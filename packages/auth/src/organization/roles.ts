/**
 * The roles a member can hold, and the comparison the application makes
 * against them.
 *
 * Better Auth stores the roles a member holds as a comma-separated
 * string, and every role check in the organization plugin splits on
 * commas and trims before comparing (`crud-members.mjs` line 196,
 * `crud-invites.mjs` line 123, `permission.mjs` line 4). This module
 * follows the same convention, so a member stored as "admin,owner" holds
 * both roles, and a comparison that ignored the convention would deny
 * an owner their own organization.
 *
 * The module is pure and imports nothing, so it is reachable from a
 * client component without dragging the database in. The application
 * needs it on both sides of the wire: the API decides what a role may
 * do, and the interface has to show an owner-only affordance to
 * exactly the people the API allows to use it.
 */

/** The roles that may administer an organization. */
export const MANAGING_ROLES: ReadonlySet<string> = new Set(["owner", "admin"])

/** The roles a member holds, one per element. */
export function memberRoles(role: string): string[] {
  return role.split(",").map((r) => r.trim()).filter(Boolean)
}

/** Whether a member's stored role string grants the given role. */
export function hasRole(role: string, required: string): boolean {
  return memberRoles(role).includes(required)
}

/**
 * Whether a member's stored role string grants any managing role.
 *
 * The comparison fails closed: a role the application does not
 * recognise is not a role that grants access.
 */
export function hasManagingRole(role: string): boolean {
  return memberRoles(role).some((r) => MANAGING_ROLES.has(r))
}
