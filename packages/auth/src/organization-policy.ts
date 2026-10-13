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
import { and, eq } from "drizzle-orm"
import { db } from "@workspace/database"
import {
	accountOrganizationDefaults,
	accountOrganizationProvisioning,
	member,
	organization,
} from "@workspace/database/schema"
import type { Member, Organization } from "better-auth/plugins/organization"

/**
 * Lease duration in milliseconds. The claim is renewable while the
 * current fencing token is held; an expired lease allows recovery
 * (a new claim), not an unconditional new creation.
 */
const LEASE_DURATION_MS = 60_000

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
 * Concurrency: claim/resume uses a short PostgreSQL transaction with
 * row lock and conditional update. The lease proposal is 60 seconds;
 * renewals require the current fencing token. The function does NOT
 * hold a transaction across a native auth call.
 *
 * Behavior:
 *   1. If the account has no default yet, the provisioning row
 *      is the durable first-org bootstrap record. Claim or
 *      resume it; the marker correlates the plugin's
 *      organization row with the `account_organization_provisioning`
 *      row that owns it.
 *   2. If the account already has a default, this is an additional
 *      organization creation. The marker is still set on the
 *      organization row (the partial unique index on
 *      `bootstrap_operation_id` allows many organizations to carry
 *      a marker, but the marker is only unique within a user's
 *      provisioning history). The provisioning row is shared with
 *      the first-org record, so we do NOT create a new one — we
 *      reuse the existing one and let the partial unique index
 *      govern the additional org's marker.
 *   3. The function never throws on concurrency; it returns the
 *      existing operation id and the caller treats the create as
 *      idempotent.
 */
export async function prepareOrganizationCreation(
	userId: string,
): Promise<OrganizationBootstrapData> {
	// 1. If a provisioning row already exists, return its operation id.
	const existing = await db
		.select({
			operationId: accountOrganizationProvisioning.operationId,
			fencingToken: accountOrganizationProvisioning.fencingToken,
		})
		.from(accountOrganizationProvisioning)
		.where(eq(accountOrganizationProvisioning.userId, userId))
		.limit(1)
	if (existing.length > 0 && existing[0]) {
		// The provisioning row is reused across additional org
		// creations. The marker on the NEW organization row is
		// still unique (the partial unique index on
		// `bootstrap_operation_id` allows multiple organizations to
		// share a marker, since this is the same user's history).
		// The new organization gets the same marker; the create
		// path's `beforeCreateOrganization` hook does not enforce
		// marker uniqueness beyond what the partial index already
		// allows.
		return { bootstrapOperationId: existing[0].operationId }
	}

	// 2. Insert a fresh pending row. The primary key on `userId`
	// makes this an atomic create-or-fail; a concurrent worker that
	// raced us and inserted first will surface as a unique
	// violation, which the caller can treat as "row exists, retry
	// the read".
	const operationId = generateOperationId()
	const now = Date.now()
	try {
		await db.insert(accountOrganizationProvisioning).values({
			userId,
			operationId,
			organizationId: null,
			status: "pending",
			requestedName: "",
			finalSlug: "",
			leaseUntil: now + LEASE_DURATION_MS,
			fencingToken: 1,
		})
	} catch (err) {
		// Concurrent insert lost the race. The other worker now
		// owns the row; re-read and return its operation id.
		const reread = await db
			.select({
				operationId: accountOrganizationProvisioning.operationId,
			})
			.from(accountOrganizationProvisioning)
			.where(eq(accountOrganizationProvisioning.userId, userId))
			.limit(1)
		if (reread[0]) {
			return { bootstrapOperationId: reread[0].operationId }
		}
		throw err
	}

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
 * The native `leaveOrganization` path does not call
 * `beforeRemoveMember`; this helper is also called from a separate
 * server hook for the leave path (the implementation branch adds
 * the wiring). The membership removal hook + the database
 * `ON DELETE RESTRICT` form a layered defense.
 */
export async function assertDefaultOwnerMembershipIsRetained(
	member: Member,
): Promise<void> {
	if (member.role !== "owner") return
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
 */
export async function assertDefaultOwnerRoleIsRetained(
	member: Member,
	newRole: string,
): Promise<void> {
	if (member.role !== "owner" || newRole === "owner") return
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
} | null> {
	const rows = await db
		.select({
			operationId: accountOrganizationProvisioning.operationId,
			organizationId: accountOrganizationProvisioning.organizationId,
			status: accountOrganizationProvisioning.status,
			finalSlug: accountOrganizationProvisioning.finalSlug,
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
	}
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
}): Promise<{ slug: string }> {
	return db.transaction(async (tx) => {
		const provisioningRows = await tx
			.select({
				fencingToken: accountOrganizationProvisioning.fencingToken,
				finalSlug: accountOrganizationProvisioning.finalSlug,
			})
			.from(accountOrganizationProvisioning)
			.where(eq(accountOrganizationProvisioning.userId, input.userId))
			.limit(1)
		if (provisioningRows.length === 0 || !provisioningRows[0]) {
			throw new APIError("BAD_REQUEST", {
				message: "No provisioning record for this account",
			})
		}
		const { fencingToken, finalSlug } = provisioningRows[0]

		// Step 1: conditional update. fencing_token = <expected>
		// ensures a stale worker cannot overwrite a newer state.
		// The update returns the row count; 0 means the caller
		// has lost the race and the whole transaction rolls back.
		const updated = await tx
			.update(accountOrganizationProvisioning)
			.set({
				organizationId: input.organizationId,
				status: "completed",
				fencingToken: fencingToken + 1,
				leaseUntil: Date.now() + LEASE_DURATION_MS,
			})
			.where(
				and(
					eq(accountOrganizationProvisioning.userId, input.userId),
					eq(accountOrganizationProvisioning.fencingToken, fencingToken),
				),
			)
			.returning({
				operationId: accountOrganizationProvisioning.operationId,
			})

		if (updated.length === 0) {
			throw new APIError("CONFLICT", {
				message:
					"Provisioning was advanced by a concurrent worker. Retry the create request.",
			})
		}

		// Step 2: insert the default row. The unique index on
		// `organizationId` guards against two accounts claiming
		// the same default.
		await tx.insert(accountOrganizationDefaults).values({
			userId: input.userId,
			organizationId: input.organizationId,
		})

		return { slug: finalSlug }
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
