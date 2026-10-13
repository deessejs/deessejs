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
 * STUB STATUS (2026-10-13): this file documents the contract. The
 * actual database reads against `account_organization_defaults` and
 * `account_organization_provisioning` are out of scope for this commit
 * because the application tables are not yet in the database (the
 * implementation branch will add them via Drizzle migrations and
 * `auth:generate` will produce the plugin schema). The plugin
 * configuration in `auth.ts` references these helpers so the wiring is
 * in place; once the tables exist on the implementation branch, the
 * bodies land in the same commit cycle as the migrations.
 */

import type { Member, Organization, User } from "better-auth/plugins/organization"

/**
 * The data shape the plugin's `beforeCreateOrganization` hook may
 * return. Includes the `additionalFields` keys defined in
 * `prepareOrganizationCreation` below. Kept as `unknown`-keyed for the
 * stub so the auth.ts type-checker doesn't complain about a missing
 * plugin configuration during the scaffolding step.
 */
export type OrganizationBootstrapData = {
	/**
	 * Server-only, unique, immutable bootstrap operation marker. Set
	 * with `input: false` so a caller cannot provide it; the hook
	 * always overrides it from the durable claim. The plugin's
	 * organization additional field must be declared with this name
	 * in the implementation branch.
	 */
	bootstrapOperationId?: string
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
 */
export async function prepareOrganizationCreation(
	_userId: string,
): Promise<OrganizationBootstrapData> {
	// Stub: the implementation branch queries
	// `account_organization_provisioning` for an in-progress or
	// completed row, claims it (insert/upsert with conditional update
	// and `leaseUntil = now() + 60s`), and returns
	// `{ bootstrapOperationId: row.operationId }`. The first-ever
	// call inserts a new pending row with a freshly generated
	// `operationId` and `fencingToken = 1`. Subsequent calls resume.
	return {}
}

/**
 * Reject deletion of an organization referenced by any
 * `account_organization_defaults` row. Throws `APIError` to abort the
 * plugin's deletion path. RFC-001 §5: "Deletion checks must reject
 * any organization referenced by a default relation, not merely the
 * requesting account's default."
 *
 * STUB: the implementation branch joins `organization` to
 * `account_organization_defaults` on `organizationId` and rejects on
 * any match. For now, the call is a no-op so the wiring is in place
 * and the plugin can be configured.
 */
export async function assertOrganizationIsDeletable(
	_organizationId: string,
): Promise<void> {
	// Stub.
}

/**
 * Block `removeMember` for the creator's owner membership in the
 * account's default organization. Throws `APIError` to abort the
 * plugin's leave/remove path. Pairs with the same constraint on
 * role demotion in `assertDefaultOwnerRoleIsRetained`.
 *
 * STUB: the implementation branch looks up the `userId` of the
 * matched `account_organization_defaults` row and rejects when
 * `member.userId === defaultUserId && member.role === "owner"`.
 */
export async function assertDefaultOwnerMembershipIsRetained(
	_member: Member,
): Promise<void> {
	// Stub.
}

/**
 * Block demotion of the creator's owner role in the account's
 * default organization. Throws `APIError` to abort the plugin's
 * update path.
 *
 * STUB: same pattern as `assertDefaultOwnerMembershipIsRetained`,
 * keyed on `member.role === "owner" && newRole !== "owner"`.
 */
export async function assertDefaultOwnerRoleIsRetained(
	_member: Member,
	_newRole: string,
): Promise<void> {
	// Stub.
}

// Type re-exports for convenience in test files. The plugin's own
// `Member` type carries the `organizationId`, `userId` and `role` we
// need; `User` is reserved for the future when `prepareOrganizationCreation`
// returns a richer payload tied to a session-bound `User`.
export type { Member, Organization, User }
