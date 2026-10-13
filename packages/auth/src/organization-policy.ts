/**
 * Organization policy helpers (RFC-001 §5, §7, §10).
 *
 * Server-only. Imported by `packages/auth/src/auth.ts` and called from
 * the `organization()` plugin's `organizationHooks` block. Each helper
 * enforces one application invariant that the plugin's default access
 * rules do not cover:
 *
 *   - `prepareOrganizationCreation` claims the durable provisioning
 *     record (option B in RFC-001 §5) and returns the server-only
 *     bootstrap marker that the plugin carries through native creation.
 *     The marker is correlated with the application table by a unique
 *     index, so a retry recovers the same organization rather than
 *     creating a duplicate. No session flag is authoritative.
 *
 *   - `assertOrganizationIsDeletable` rejects any organization referenced
 *     by an `account_organization_defaults` row (RFC-001 §5 "Permanent
 *     default organization invariant"). The plugin's
 *     `beforeDeleteOrganization` hook runs the check before the cascade.
 *
 *   - `assertDefaultOwnerMembershipIsRetained` blocks `removeMember` for
 *     the creator's owner membership in the account's default
 *     organization. The plugin's default rules prevent the sole owner
 *     from leaving; this helper extends the guarantee to "the creator
 *     can never be removed from the default org, even if other owners
 *     exist".
 *
 *   - `assertDefaultOwnerRoleIsRetained` blocks demotion of the creator
 *     in the default organization. Pairs with the previous helper.
 *
 *   - `getDefaultOrganization` exposes the durable default lookup used by
 *     the app-side guard helpers in `apps/app/lib/organization-auth.ts`.
 */

import { randomBytes } from "node:crypto"
import { APIError } from "better-auth/api"
import { and, eq, gt, lte, sql } from "drizzle-orm"
import { db } from "@workspace/database"
import {
	accountOrganizationDefaults,
	accountOrganizationProvisioning,
	member,
	organization,
} from "@workspace/database/schema"
import type { Member, Organization } from "better-auth/plugins/organization"

import { AsyncLocalStorage } from "node:async_hooks"

/**
 * Lease duration in milliseconds. The claim is renewable while the
 * current fencing token is held; an expired lease allows recovery
 * (a new claim), not an unconditional new creation.
 */
const LEASE_DURATION_MS = 60_000

/**
 * Per-request storage for the attempt id. The Server Action
 * sets the id before calling `auth.api.createOrganization`; the
 * plugin's `beforeCreateOrganization` hook reads it to scope
 * its claim stash to THIS attempt. AsyncLocalStorage is the
 * right primitive here: the hook is invoked synchronously
 * inside the same async call stack as the Server Action, so
 * a stack-local context is the correct scope.
 *
 * We expose `withProvisioningAttempt(userId, attemptId, fn)`
 * for the Server Action to wrap its native create call, and
 * `getCurrentAttemptId()` for the hook to read.
 */
interface AttemptContext {
	userId: string
	attemptId: string
}
const attemptStorage = new AsyncLocalStorage<AttemptContext>()

export function withProvisioningAttempt<T>(
	userId: string,
	attemptId: string,
	fn: () => Promise<T>,
): Promise<T> {
	return attemptStorage.run({ userId, attemptId }, fn)
}

export function getCurrentAttemptId(): AttemptContext | null {
	return attemptStorage.getStore() ?? null
}

/**
 * The data shape the plugin's `beforeCreateOrganization` hook may
 * return. Includes the `additionalFields` keys declared in
 * `packages/auth/src/auth.ts` — specifically
 * `bootstrapOperationId` with `input: false`.
 */
export type OrganizationBootstrapData = {
	/**
	 * Server-only, unique, immutable bootstrap operation marker. The
	 * plugin refuses to write this column from caller input; the
	 * hook always overrides it from the durable claim. The marker
	 * correlates the plugin's organization row with the
	 * `account_organization_provisioning` row that owns it.
	 */
	bootstrapOperationId?: string
}

/**
 * The full state of a user's provisioning claim. Returned by
 * `prepareOrganizationCreation` and forwarded verbatim to
 * `finalizeOrganizationProvisioning`. Carrying the operation
 * id, fencing token, and lease expiry together is the only way
 * to make the protocol concurrency-safe: the caller never
 * re-reads the row mid-flow, so a parallel worker cannot
 * advance past the caller without the caller noticing.
 */
export interface ProvisioningClaim {
	operationId: string
	fencingToken: number
	leaseUntil: number
}

/**
 * Process-local stash of the most recent provisioning claim
 * for each `(userId, attemptId)`. The Server Action generates
 * a fresh `attemptId` per request and threads it through the
 * plugin call so the hook's return value is bound to THIS
 * attempt and cannot collide with a stale entry from a prior
 * request that never consumed (e.g. a previous request that
 * timed out between the hook and the Server Action's
 * consume).
 *
 * The map is per-process; on a serverless function the
 * Node.js instance is the unit of isolation, and the request
 * handler's two calls (the hook and the action) run in the
 * same instance for the same Vercel function invocation.
 * Cross-instance handoff is not possible here — Vercel
 * functions are stateless, and the attemptId is opaque to
 * the network.
 */
const provisioningClaims = new Map<string, ProvisioningClaim>()

function stashKey(userId: string, attemptId: string): string {
	return `${userId}::${attemptId}`
}

export function stashProvisioningClaim(
	userId: string,
	attemptId: string,
	claim: ProvisioningClaim,
): void {
	provisioningClaims.set(stashKey(userId, attemptId), claim)
}

export function consumeProvisioningClaim(
	userId: string,
): ProvisioningClaim | null {
	const ctx = getCurrentAttemptId()
	if (!ctx || ctx.userId !== userId) {
		return null
	}
	const claim = provisioningClaims.get(stashKey(userId, ctx.attemptId)) ?? null
	provisioningClaims.delete(stashKey(userId, ctx.attemptId))
	return claim
}

/**
 * Server-generated operation id. The id is a 32-character lowercase
 * hex string (16 random bytes) — long enough to be globally unique
 * for the lifetime of the application, short enough to fit in a
 * `text` column without bloating the index.
 */
function generateOperationId(): string {
	return randomBytes(16).toString("hex")
}

/**
 * Claim (or resume) the durable onboarding provisioning record for
 * `userId`, and return the bootstrap data the plugin will carry
 * through native creation. The hook is invoked from
 * `beforeCreateOrganization` so the marker is always present on the
 * organization row that the plugin inserts.
 *
 * The `attemptId` is a per-request nonce generated by the
 * Server Action. The hook stashes a `ProvisioningClaim` keyed
 * by `(userId, attemptId)`, and the action reads it back via
 * `consumeProvisioningClaim(userId, attemptId)`. The
 * attemptId makes the stash safe across requests: a previous
 * request that crashed between the hook and the consume
 * leaves a stale entry that the next request cannot pick up.
 *
 * Concurrency: the conditional UPDATE that takes over an
 * expired lease uses the current fencing token as a guard,
 * so a parallel worker holding the live lease cannot lose its
 * claim to a stale worker.
 *
 * Behavior:
 *   1. If the account already has a default, return `{}` —
 *      this is an additional-org creation; the marker stays
 *      NULL on the new row.
 *   2. If no default and no provisioning row exists, insert a
 *      fresh row with a new operationId + fencingToken=1 +
 *      fresh lease, and stash the claim.
 *   3. If no default and a row exists with a LIVE lease,
 *      resume it: the same operationId + current fencingToken
 *      + current leaseUntil. A parallel worker that bumps the
 *      token will fail our subsequent finalize; a parallel
 *      worker that took over via a different attemptId is
 *      unrelated to ours.
 *   4. If no default and a row exists with an EXPIRED lease,
 *      the previous worker died. Take over: KEEP the existing
 *      operationId (the marker is the durable correlation
 *      pointer; re-rolling it would orphan a prior partial
 *      attempt's organization and let a fresh create leak
 *      in under a new marker). Bump the fencing token (so
 *      the dead worker's finalize WHERE clause fails) and
 *      renew the lease. The Server Action's `replayFinalize`
 *      can then `findOrganizationByMarker` to recover the
 *      prior org if the previous attempt committed it.
 */
export async function prepareOrganizationCreation(
	userId: string,
): Promise<OrganizationBootstrapData> {
	// The hook is called by better-auth during createOrganization,
	// which the Server Action wraps in withProvisioningAttempt.
	// The attempt id scopes the claim stash to THIS request.
	const ctx = getCurrentAttemptId()
	if (!ctx || ctx.userId !== userId) {
		throw new Error(
			"prepareOrganizationCreation must be called inside withProvisioningAttempt; " +
				"the Server Action wraps the native create call.",
		)
	}
	const attemptId = ctx.attemptId
	const now = Date.now()

	// 1. Has the account already completed onboarding? If so,
	// this is an additional-organization creation; the marker is
	// NOT set on the new org (the marker is a one-time
	// correlation pointer for the first org, see RFC-001 §5).
	const existingDefault = await db
		.select({ organizationId: accountOrganizationDefaults.organizationId })
		.from(accountOrganizationDefaults)
		.where(eq(accountOrganizationDefaults.userId, userId))
		.limit(1)
	if (existingDefault.length > 0) {
		return {}
	}

	// 2. Onboarding path: claim or resume the durable
	// provisioning record.
	const existing = await db
		.select({
			operationId: accountOrganizationProvisioning.operationId,
			fencingToken: accountOrganizationProvisioning.fencingToken,
			leaseUntil: accountOrganizationProvisioning.leaseUntil,
		})
		.from(accountOrganizationProvisioning)
		.where(eq(accountOrganizationProvisioning.userId, userId))
		.limit(1)
	if (existing.length > 0 && existing[0]) {
		const { operationId, fencingToken, leaseUntil } = existing[0]
		if (leaseUntil > now) {
			// Live claim. Resume with the same operationId +
			// token. A parallel worker that bumps the token
			// between this read and our finalize will fail our
			// WHERE clause; the attemptId prevents stale
			// stashes from cross-pollinating.
			stashProvisioningClaim(userId, attemptId, {
				operationId,
				fencingToken,
				leaseUntil,
			})
			return { bootstrapOperationId: operationId }
		}
		// Expired lease. Take over: KEEP the existing
		// operationId (the marker is a durable correlation
		// pointer — `findOrganizationByMarker` recovers a
		// previous attempt's organization by it; abandoning
		// it would orphan the prior org and let a fresh
		// create leak in under a new marker). Bump the
		// fencing token (so the dead worker's finalize
		// WHERE clause fails) and renew the lease. The
		// conditional UPDATE uses the current token as a
		// guard; if a parallel worker raced us and bumped
		// it first, the UPDATE affects 0 rows and we retry
		// by re-reading.
		const takeoverOperationId = operationId
		let newFencingToken = fencingToken + 1
		const newLeaseUntil = now + LEASE_DURATION_MS
		for (let i = 0; i < 3; i++) {
			const updated = await db
				.update(accountOrganizationProvisioning)
				.set({
					fencingToken: newFencingToken,
					leaseUntil: newLeaseUntil,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(accountOrganizationProvisioning.userId, userId),
						eq(
							accountOrganizationProvisioning.fencingToken,
							newFencingToken - 1,
						),
						lte(accountOrganizationProvisioning.leaseUntil, now),
					),
				)
				.returning({ operationId: accountOrganizationProvisioning.operationId })
			if (updated.length > 0) {
				stashProvisioningClaim(userId, attemptId, {
					operationId: takeoverOperationId,
					fencingToken: newFencingToken,
					leaseUntil: newLeaseUntil,
				})
				return { bootstrapOperationId: takeoverOperationId }
			}
			// Lost the race. Re-read and decide again.
			const reread = await db
				.select({
					operationId: accountOrganizationProvisioning.operationId,
					fencingToken: accountOrganizationProvisioning.fencingToken,
					leaseUntil: accountOrganizationProvisioning.leaseUntil,
				})
				.from(accountOrganizationProvisioning)
				.where(eq(accountOrganizationProvisioning.userId, userId))
				.limit(1)
			if (!reread[0]) {
				throw new Error("Provisioning row disappeared during take-over")
			}
			if (reread[0].leaseUntil > now) {
				// Another worker has a live claim. Resume
				// with their state.
				stashProvisioningClaim(userId, attemptId, {
					operationId: reread[0].operationId,
					fencingToken: reread[0].fencingToken,
					leaseUntil: reread[0].leaseUntil,
				})
				return { bootstrapOperationId: reread[0].operationId }
			}
			// Still expired (rare). Loop with a fresh token
			// based on the current value. The conditional
			// UPDATE re-asserts the new token under the
			// fencing-token guard; the next iteration of the
			// loop repeats the read+update cycle. The
			// operationId stays the same — never re-roll it.
			newFencingToken = reread[0].fencingToken + 1
		}
		throw new APIError("CONFLICT", {
			message:
				"Could not take over expired provisioning after 3 attempts. Retry.",
		})
	}

	// 3. Insert a fresh pending row. The primary key on `userId`
	// makes this an atomic create-or-fail; a concurrent worker
	// that raced us and inserted first will surface as a unique
	// violation, which we recover by re-reading.
	const operationId = generateOperationId()
	const leaseUntil = now + LEASE_DURATION_MS
	const fencingToken = 1
	try {
		await db.insert(accountOrganizationProvisioning).values({
			userId,
			operationId,
			organizationId: null,
			status: "pending",
			requestedName: "",
			finalSlug: "",
			leaseUntil,
			fencingToken,
		})
	} catch (err) {
		const reread = await db
			.select({
				operationId: accountOrganizationProvisioning.operationId,
				fencingToken: accountOrganizationProvisioning.fencingToken,
				leaseUntil: accountOrganizationProvisioning.leaseUntil,
			})
			.from(accountOrganizationProvisioning)
			.where(eq(accountOrganizationProvisioning.userId, userId))
			.limit(1)
		if (reread[0]) {
			stashProvisioningClaim(userId, attemptId, {
				operationId: reread[0].operationId,
				fencingToken: reread[0].fencingToken,
				leaseUntil: reread[0].leaseUntil,
			})
			return { bootstrapOperationId: reread[0].operationId }
		}
		throw err
	}
	stashProvisioningClaim(userId, attemptId, {
		operationId,
		fencingToken,
		leaseUntil,
	})
	return { bootstrapOperationId: operationId }
}

/**
 * Reject deletion of an organization referenced by any
 * `account_organization_defaults` row. Throws `APIError` to abort the
 * plugin's deletion path. RFC-001 §5: "Deletion checks must reject
 * any organization referenced by a default relation, not merely the
 * requesting account's default."
 *
 * The `ON DELETE RESTRICT` foreign key on
 * `account_organization_defaults.organizationId` is the last line of
 * defense at the database level; this hook enforces the same rule at
 * the application level so the plugin returns a 4xx rather than a
 * raw constraint violation.
 */
export async function assertOrganizationIsDeletable(
	organizationId: string,
): Promise<void> {
	const rows = await db
		.select({ userId: accountOrganizationDefaults.userId })
		.from(accountOrganizationDefaults)
		.where(eq(accountOrganizationDefaults.organizationId, organizationId))
		.limit(1)
	if (rows.length > 0) {
		throw new APIError("FORBIDDEN", {
			message:
				"Organization is the default of at least one account and cannot be deleted.",
		})
	}
}

/**
 * Block `removeMember` for the creator's owner membership in the
 * account's default organization. Throws `APIError` to abort the
 * plugin's leave/remove path. Pairs with the same constraint on
 * role demotion in `assertDefaultOwnerRoleIsRetained`.
 *
 * RFC-001 §5: "Protect the creator's owner membership in that
 * organization: it cannot be removed, left or demoted, even if
 * another owner exists."
 *
 * The role comparison is multi-role aware: the plugin can store
 * `"owner,admin"` for an account that holds both roles. A
 * strict `member.role !== "owner"` check would let a
 * multi-role membership bypass this guard, because
 * `"owner,admin" !== "owner"`. We use `hasOwnerRole` instead.
 *
 * The native `leaveOrganization` path does not call
 * `beforeRemoveMember`; this helper is also called from a separate
 * server hook for the leave path (the implementation branch adds
 * the wiring). The membership removal hook + the database
 * `ON DELETE RESTRICT` form a layered defense.
 */
export async function assertDefaultOwnerMembershipIsRetained(
	member: Member,
): Promise<void> {
	if (!hasOwnerRole(member.role)) return
	const rows = await db
		.select({ userId: accountOrganizationDefaults.userId })
		.from(accountOrganizationDefaults)
		.where(
			and(
				eq(
					accountOrganizationDefaults.organizationId,
					member.organizationId,
				),
				eq(accountOrganizationDefaults.userId, member.userId),
			),
		)
		.limit(1)
	if (rows.length > 0) {
		throw new APIError("FORBIDDEN", {
			message:
				"The creator's owner membership in the default organization cannot be removed.",
		})
	}
}

/**
 * Block demotion of the creator's owner role in the account's
 * default organization. Throws `APIError` to abort the plugin's
 * update path.
 *
 * The current role check is multi-role aware (see
 * `assertDefaultOwnerMembershipIsRetained` for the rationale).
 * The new-role check is also multi-role aware: a caller
 * demoting to "owner,admin" would still hold the owner
 * capability, so we treat that as no-op and let the call
 * through; only a demotion that drops `owner` from the new
 * role set is forbidden.
 */
export async function assertDefaultOwnerRoleIsRetained(
	member: Member,
	newRole: string,
): Promise<void> {
	if (!hasOwnerRole(member.role) || hasOwnerRole(newRole)) return
	const rows = await db
		.select({ userId: accountOrganizationDefaults.userId })
		.from(accountOrganizationDefaults)
		.where(
			and(
				eq(
					accountOrganizationDefaults.organizationId,
					member.organizationId,
				),
				eq(accountOrganizationDefaults.userId, member.userId),
			),
		)
		.limit(1)
	if (rows.length > 0) {
		throw new APIError("FORBIDDEN", {
			message:
				"The creator's owner role in the default organization cannot be demoted.",
		})
	}
}

/**
 * Lightweight guard: is `(userId, organizationId)` the creator
 * membership of an `account_organization_defaults` row?
 *
 * Used by the Hono middleware in
 * `packages/api/src/http/routes/http.ts` that intercepts
 * `POST /api/v1/auth/organization/leave` BEFORE the better-auth
 * handler. The plugin does NOT fire `beforeRemoveMember` on the
 * leave path (its source is `routes/crud-members.mjs` line ~390
 * in `leaveOrganization`), so the only way to enforce
 * "creator cannot leave their default org" is to intercept the
 * route.
 *
 * Returns `true` if the user is the creator of the named
 * default; `false` otherwise. The caller is responsible for
 * translating `true` into a 4xx response.
 *
 * The database `ON DELETE RESTRICT` foreign key on
 * `account_organization_defaults.organizationId` is the last
 * line of defense if this middleware is bypassed (e.g. a
 * future plugin upgrade that adds new removal paths), but the
 * application-level check returns a clean 403 instead of a raw
 * constraint violation.
 */
export async function isDefaultCreator(
	userId: string,
	organizationId: string,
): Promise<boolean> {
	const rows = await db
		.select({ userId: accountOrganizationDefaults.userId })
		.from(accountOrganizationDefaults)
		.where(
			and(
				eq(accountOrganizationDefaults.userId, userId),
				eq(accountOrganizationDefaults.organizationId, organizationId),
			),
		)
		.limit(1)
	return rows.length > 0
}

/**
 * Read the durable provisioning record for an account. Returns
 * `null` when no record exists. Used by the onboarding Server
 * Action to detect "a previous attempt left the plugin's
 * organization in place but the default row was never written"
 * and replay the finalization.
 */
export async function getProvisioningState(userId: string): Promise<{
	operationId: string
	organizationId: string | null
	status: string
	finalSlug: string
	fencingToken: number
	leaseUntil: number
} | null> {
	const rows = await db
		.select({
			operationId: accountOrganizationProvisioning.operationId,
			organizationId: accountOrganizationProvisioning.organizationId,
			status: accountOrganizationProvisioning.status,
			finalSlug: accountOrganizationProvisioning.finalSlug,
			fencingToken: accountOrganizationProvisioning.fencingToken,
			leaseUntil: accountOrganizationProvisioning.leaseUntil,
		})
		.from(accountOrganizationProvisioning)
		.where(eq(accountOrganizationProvisioning.userId, userId))
		.limit(1)
	const row = rows[0]
	if (!row) return null
	return {
		operationId: row.operationId,
		organizationId: row.organizationId,
		status: row.status,
		finalSlug: row.finalSlug,
		fencingToken: row.fencingToken,
		leaseUntil: row.leaseUntil,
	}
}

/**
 * Find the organization that was created for a given bootstrap
 * marker. Returns `null` if no organization carries the marker.
 * Used by the onboarding Server Action to recover from
 * "organization was created but the finalization crashed"
 * without trusting `account_organization_provisioning.organization_id`
 * (which is only set during finalization).
 */
export async function findOrganizationByMarker(
	operationId: string,
): Promise<{ id: string; slug: string; name: string } | null> {
	const rows = await db
		.select({
			id: organization.id,
			slug: organization.slug,
			name: organization.name,
		})
		.from(organization)
		.where(eq(organization.bootstrapOperationId, operationId))
		.limit(1)
	return rows[0] ?? null
}

/**
 * Ensure the user has a membership row for the named
 * organization with role `owner`. Used during onboarding
 * recovery when the plugin's `createOrganization` was
 * interrupted after the org row was written but before the
 * owner membership was inserted (or after the membership was
 * inserted but before the finalization committed).
 *
 * The function is idempotent and concurrency-safe: a single
 * `INSERT ... ON CONFLICT (organization_id, user_id) DO
 * UPDATE` issues an atomic upsert. Two parallel recovery
 * workers on the same (org, user) pair collide on the unique
 * index and one row wins; both callers see the same final
 * state.
 *
 * The `DO UPDATE` only promotes a non-owner to owner; an
 * already-owner row is left alone. The role string is parsed
 * multi-role aware so `"owner,admin"` is recognized as owner.
 */
export async function ensureOwnerMembership(
	userId: string,
	organizationId: string,
): Promise<{ memberId: string }> {
	const id = randomBytes(8).toString("hex")
	const rows = await db
		.insert(member)
		.values({
			id,
			organizationId,
			userId,
			role: "owner",
			createdAt: new Date(),
		})
		.onConflictDoUpdate({
			target: [member.organizationId, member.userId],
			set: {
				role: sql`CASE
					WHEN ${member.role} LIKE '%owner%' THEN ${member.role}
					ELSE 'owner'
				END`,
			},
		})
		.returning({ id: member.id })
	return { memberId: rows[0]?.id ?? id }
}

/**
 * Finalize a successful provisioning. Called by the
 * `createFirstOrganization` Server Action after the native
 * organization + owner membership are verified.
 *
 * Steps (in a single PostgreSQL transaction):
 *   1. Conditional update on `account_organization_provisioning`:
 *      `status = 'completed'`, `organizationId = <newId>`, fencing
 *      token incremented, `WHERE fencingToken = <expected>`. If
 *      the update affects 0 rows, the caller has lost the race
 *      and the transaction rolls back.
 *   2. Insert into `account_organization_defaults`. The unique
 *      index on `organizationId` ensures no other account already
 *      claims this organization as its default. (In V1 each
 *      organization is the default of exactly one account: its
 *      creator.)
 *
 * The `expectedFencingToken` is the value the caller read at
 * claim time. Passing it from the caller — rather than re-reading
 * the row inside the function — is the only way to test the
 * "stale worker" scenario: a worker that read fencing_token = 1
 * before another worker advanced it to 2 will fail its WHERE
 * clause and the transaction rolls back. A function that
 * re-reads would silently use the latest value and never fail.
 *
 * The transaction guarantees that the `completed` provisioning
 * row and the `account_organization_defaults` row either both
 * land or neither does. A crash between the two steps leaves the
 * provisioning row at its previous state, so a retry re-attempts
 * the same finalization.
 *
 * Returns the durable default on success. Throws `APIError` on
 * fencing-token mismatch or missing provisioning record.
 */
export async function finalizeOrganizationProvisioning(input: {
	userId: string
	organizationId: string
	expectedFencingToken: number
}): Promise<{ slug: string }> {
	return db.transaction(async (tx) => {
		// Step 1: conditional update. fencing_token = <expected>
		// AND lease_until > now ensures:
		//   - a stale worker (token was advanced) fails the
		//     fencing check;
		//   - an expired lease (the previous worker died) also
		//     fails the lease check, even if no one else has
		//     claimed the row yet. `prepareOrganizationCreation`
		//     takes over expired leases and bumps the token; if
		//     that hasn't happened, we reject the finalize and
		//     let the next request re-claim.
		const now = Date.now()
		const updated = await tx
			.update(accountOrganizationProvisioning)
			.set({
				organizationId: input.organizationId,
				status: "completed",
				fencingToken: input.expectedFencingToken + 1,
				leaseUntil: now + LEASE_DURATION_MS,
			})
			.where(
				and(
					eq(accountOrganizationProvisioning.userId, input.userId),
					eq(
						accountOrganizationProvisioning.fencingToken,
						input.expectedFencingToken,
					),
					gt(accountOrganizationProvisioning.leaseUntil, now),
				),
			)
			.returning({
				finalSlug: accountOrganizationProvisioning.finalSlug,
			})

		if (updated.length === 0) {
			throw new APIError("CONFLICT", {
				message:
					"Provisioning was advanced by a concurrent worker or its lease expired. Retry the create request.",
			})
		}

		// Step 2: insert the default row. The unique index on
		// `organizationId` guards against two accounts claiming
		// the same default.
		await tx.insert(accountOrganizationDefaults).values({
			userId: input.userId,
			organizationId: input.organizationId,
		})

		return { slug: updated[0]?.finalSlug ?? "" }
	})
}

/**
 * Resolve the account's permanent default organization. Returns
 * `null` when the account has not completed onboarding. The lookup
 * joins `account_organization_defaults` to `organization` so the
 * caller gets the slug alongside the id.
 *
 * The plugin's `activeOrganizationId` session field is a
 * convenience, not a source of truth: a session may be cached with
 * a stale selection. This lookup is the authoritative one.
 */
export async function getDefaultOrganization(
	userId: string,
): Promise<{ id: string; slug: string } | null> {
	const rows = await db
		.select({
			id: organization.id,
			slug: organization.slug,
		})
		.from(accountOrganizationDefaults)
		.innerJoin(
			organization,
			eq(organization.id, accountOrganizationDefaults.organizationId),
		)
		.where(eq(accountOrganizationDefaults.userId, userId))
		.limit(1)
	return rows[0] ?? null
}

/**
 * Resolve a membership row by `(organizationSlug, userId)`. Returns
 * `null` when the user is not a member. Used by the
 * `requireOrganizationAccess` helper in `apps/app/lib/organization-auth.ts`.
 *
 * The role string is parsed through `parseMemberRoles` to support
 * the multi-role representation the plugin can produce (RFC-001
 * §7 "Authorization must still parse supported plugin role
 * representations safely and deny unexpected values").
 */
export async function getMembership(
	userId: string,
	organizationSlug: string,
): Promise<{ id: string; role: string; organizationId: string } | null> {
	const rows = await db
		.select({
			id: member.id,
			role: member.role,
			organizationId: member.organizationId,
		})
		.from(member)
		.innerJoin(organization, eq(organization.id, member.organizationId))
		.where(and(eq(organization.slug, organizationSlug), eq(member.userId, userId)))
		.limit(1)
	if (rows.length === 0 || !rows[0]) return null
	return {
		id: rows[0].id,
		role: rows[0].role,
		organizationId: rows[0].organizationId,
	}
}

/**
 * Load an organization by slug. Returns `null` when no such
 * organization exists. Used by Server Actions that need the
 * server-side `name` for typed-confirmation guards; the value
 * is fetched from the database, never from client input, so a
 * caller cannot bypass the check by sending a fake `name`.
 */
export async function getOrganizationBySlug(
	organizationSlug: string,
): Promise<{ id: string; slug: string; name: string } | null> {
	const rows = await db
		.select({
			id: organization.id,
			slug: organization.slug,
			name: organization.name,
		})
		.from(organization)
		.where(eq(organization.slug, organizationSlug))
		.limit(1)
	return rows[0] ?? null
}

/**
 * List every organization the user is a member of. The list is
 * the source of truth for the sidebar's organization switcher:
 * the layout server-renders it once, the client hydrates from
 * the prop, and selection updates the session's active org on
 * the client.
 *
 * The query joins `member` to `organization` to get the
 * display name; the (userId, organizationId) unique index on
 * `member` makes the join O(memberships), not O(memberships *
 * orgs).
 */
export async function listUserMemberships(userId: string): Promise<
	Array<{ id: string; slug: string; name: string; role: string }>
> {
	const rows = await db
		.select({
			id: organization.id,
			slug: organization.slug,
			name: organization.name,
			role: member.role,
		})
		.from(member)
		.innerJoin(organization, eq(organization.id, member.organizationId))
		.where(eq(member.userId, userId))
	return rows
}

/**
 * Parse the `member.role` string the plugin stores. The plugin
 * accepts a single role OR a comma-separated list. We split on
 * commas, trim, and lowercase; an empty or missing token is
 * rejected as `null`. Callers use this for action-level
 * authorization (e.g. "is this user an owner or admin?").
 */
export function parseMemberRoles(raw: string | null | undefined): string[] {
	if (!raw) return []
	return raw
		.split(",")
		.map((r) => r.trim().toLowerCase())
		.filter((r) => r.length > 0)
}

/**
 * True when the role list contains `owner` (multi-role aware).
 */
export function hasOwnerRole(raw: string | null | undefined): boolean {
	return parseMemberRoles(raw).includes("owner")
}

/**
 * True when the role list contains `owner` or `admin`.
 */
export function hasAdminOrOwnerRole(raw: string | null | undefined): boolean {
	const roles = parseMemberRoles(raw)
	return roles.includes("owner") || roles.includes("admin")
}

/**
 * Persist the requested name and final slug on the provisioning
 * row. Called by `createFirstOrganization` after the slug has been
 * generated server-side and the native `createOrganization` is about
 * to fire. The values are needed for retry consistency: a duplicate
 * request replays the same final slug rather than regenerating a
 * different one.
 */
export async function recordProvisioningRequest(input: {
	userId: string
	requestedName: string
	finalSlug: string
}): Promise<void> {
	await db
		.update(accountOrganizationProvisioning)
		.set({
			requestedName: input.requestedName,
			finalSlug: input.finalSlug,
			updatedAt: new Date(),
		})
		.where(eq(accountOrganizationProvisioning.userId, input.userId))
}

// `Member` and `Organization` are imported as type-only for the
// JSDoc/imports that name them; they are not used as values.
// `isNull` from drizzle-orm is reserved for future query helpers
// (the implementation branch uses it in the membership lookup).
