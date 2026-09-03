import { createAccessControl } from "better-auth/plugins/access"

/**
 * Resource-level access control statement for the better-auth
 * organization plugin (ADR-030 §"Decision #2"). Each resource
 * exposes the actions a role can take on it; roles combine
 * statements into a permission set.
 *
 * The statement is declared `as const` so role definitions below
 * can read it without a runtime cast — better-auth's
 * `createAccessControl` expects a literal record.
 */
export const statement = {
	organization: ["update", "delete"],
	member: ["create", "read", "update", "delete"],
	invitation: ["create", "cancel"],
	ac: ["read"],
} as const

/**
 * Shared access-control instance. Imported by `packages/auth/src/auth.ts`
 * (server) and `apps/app/lib/auth-client.ts` (client) so both halves
 * of the auth surface stay in lockstep — a role added on the
 * server without a matching client role would let the UI render
 * controls the backend will then reject at the API boundary.
 */
export const ac = createAccessControl(statement)

/**
 * Default roles (ADR-030 §"Decision #2"). Three tiers:
 *   - owner   — full CRUD on the org and its members.
 *   - admin   — almost full CRUD; cannot delete the org itself.
 *   - member  — read-only on the org and members.
 *
 * The creator of a new org is assigned the `owner` role
 * (`creatorRole` in the plugin config). Org admins/members are
 * added through invitations.
 */
export const owner = ac.newRole({
	organization: ["update", "delete"],
	member: ["create", "read", "update", "delete"],
	invitation: ["create", "cancel"],
	ac: ["read"],
})

export const admin = ac.newRole({
	organization: ["update"],
	member: ["create", "read", "update", "delete"],
	invitation: ["create", "cancel"],
	ac: ["read"],
})

export const member = ac.newRole({
	organization: [],
	member: ["read"],
	invitation: [],
	ac: ["read"],
})
