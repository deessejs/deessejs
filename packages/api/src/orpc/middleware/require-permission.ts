import { ORPCError } from "@orpc/server"

import { auth } from "@workspace/auth"

/**
 * `requirePermission(resource, action)` — oRPC middleware factory
 * (ADR-030 §"Decision #11" + §"Implementation surface" PR #8).
 *
 * The factory returns an oRPC middleware that:
 *   1. Reads the active session from the request headers.
 *   2. Asserts an active organization is set on the session; without
 *      one, no permission check can succeed (every `ac` row lives
 *      under an org).
 *   3. Calls `auth.api.hasPermission(...)` with the caller + the
 *      requested `(resource, action)` pair. better-auth resolves
 *      the caller's role in the active org against the
 *      `packages/auth/src/access.ts` statement.
 *   4. Throws an `ORPCError({ code: "FORBIDDEN" })` if the role
 *      doesn't grant the permission; otherwise yields the session
 *      as middleware context so downstream procedures can read it
 *      without re-fetching.
 *
 * Resource and action are typed against the better-auth
 * `Statement` shape so a typo on the call site (e.g. passing
 * `"deletee"` instead of `"delete"`) is a compile error.
 *
 * Usage:
 *
 *   const requireOrg = requirePermission("member", "delete")
 *   const deleteMember = os.member.delete
 *     .use(requireOrg)
 *     .handler(({ context }) => { ... })
 */
export const requirePermission = (resource: string, action: string) =>
	async () => {
		const session = await auth.api.getSession({ headers: new Headers() })
		if (!session?.user) {
			throw new ORPCError("UNAUTHORIZED", {
				status: 401,
				message: "Authentication required",
			})
		}
		if (!session.session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN", {
				status: 403,
				message: "No active organization on the session",
			})
		}
		const result = await auth.api.hasPermission({
			headers: new Headers(),
			body: { permissions: { [resource]: [action] } },
		})
		if (!result.success) {
			throw new ORPCError("FORBIDDEN", {
				status: 403,
				message: `Missing permission: ${resource}:${action}`,
			})
		}
		return { session }
	}
