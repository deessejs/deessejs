/**
 * Authoritative organization guards (RFC-001 §8, §10 "Authoritative
 * guard placement").
 *
 * The proxy at `apps/app/proxy.ts` handles only early login /
 * verification redirects. The real authorization decisions live in
 * three server-only helpers that pages, Server Actions, Route
 * Handlers and business data-access operations invoke independently.
 * Layout checks alone are insufficient because layouts can persist
 * across navigation.
 *
 * STUB STATUS (2026-10-13): the application tables
 * `account_organization_defaults` and
 * `account_organization_provisioning` are not yet in the database
 * (the implementation branch will add them via Drizzle migrations).
 * The helpers below return permissive defaults for the scaffolding
 * step; the implementation branch replaces the stubs with real
 * queries against the database via `@workspace/database`.
 *
 * The signed-in account and email-verification checks are NOT stubs:
 * they call `auth.api.getSession` which is the existing native
 * Better Auth API. Only the organization-scoped checks are stubs.
 */

import "server-only"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"

/**
 * The minimum shape `auth.api.getSession({ headers })` returns when a
 * session cookie is present. Mirrors the existing `GetSessionResponse`
 * used by the proxy, with the addition of the `activeOrganizationId`
 * the organization plugin puts on the session payload.
 */
export interface AccountSession {
	user: { id: string; email: string; emailVerified: boolean }
	session: { id: string; activeOrganizationId?: string | null }
}

/**
 * Resolve the current session from the request headers. Returns
 * `null` when the request is unauthenticated.
 *
 * The Better Auth call must forward the request headers — otherwise
 * the session cookie does not reach the API and `getSession` returns
 * `null` even for signed-in users. This is the same forwarding
 * pattern the rest of `apps/app` uses.
 */
async function getAccountSession(): Promise<AccountSession | null> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) return null
	// The plugin augments the session payload with
	// `activeOrganizationId` (nullable). Narrow the type without
	// relying on the plugin's exported `Session` shape during the
	// scaffolding step.
	return session as unknown as AccountSession
}

/**
 * Require a signed-in account. Redirects to `/login` (preserving the
 * original pathname in the `?redirect=` query param) when the
 * request is unauthenticated.
 */
export async function requireAccountSession(): Promise<AccountSession> {
	const session = await getAccountSession()
	if (!session) {
		// The proxy already redirects unauthenticated requests away
		// from protected routes; this redirect is the last-resort
		// guard for Server Actions / Route Handlers invoked from
		// non-protected surfaces.
		redirect("/login")
	}
	return session
}

/**
 * Require a completed first-organization onboarding. Redirects to
 * `/onboarding/first-organization` when the account has no durable
 * default organization (or the durable default has been cleared).
 *
 * The check is independent of `activeOrganizationId`: an invited
 * user with membership in another organization but no default still
 * has to complete the onboarding before any workspace page.
 */
export async function requireCompletedOnboarding(): Promise<AccountSession> {
	const session = await requireAccountSession()
	if (!session.user.emailVerified) {
		redirect("/verify-email")
	}
	// STUB: the implementation branch queries
	// `account_organization_defaults` by `userId`. A row exists
	// after a successful provisioning; absent means onboarding
	// is incomplete.
	const hasDefault = await hasDefaultOrganizationRow(session.user.id)
	if (!hasDefault) {
		redirect("/onboarding/first-organization")
	}
	return session
}

/**
 * Require membership in the organization identified by the route's
 * `[organization_slug]` segment, and that the session user is
 * permitted to perform the given `action` (e.g. `read`, `write`,
 * `invite`, `delete`). Redirects to the account default home when
 * the user has no access; throws `APIError("FORBIDDEN")` when the
 * user is signed in but not a member.
 *
 * The plugin's default access rules (RFC-001 §7) drive the action
 * matrix; this helper is the place where the application layers
 * its own invariants on top (e.g. "owner-only delete").
 */
export async function requireOrganizationAccess(
	slug: string,
	action: "read" | "write" | "invite" | "delete",
): Promise<AccountSession> {
	const session = await requireCompletedOnboarding()
	// STUB: the implementation branch resolves the organization by
	// slug, looks up the member row, and applies the action matrix.
	// For now the call is a no-op so the wiring is in place; the
	// implementation branch flips the boolean to a real check.
	const isMember = await isMemberOfOrganization(session.user.id, slug, action)
	if (!isMember) {
		// Match the proxy's redirect pattern: send unauthorized
		// requests to the default home rather than /login, because
		// the user is signed in and verified; the issue is tenant
		// access, not authentication.
		const fallback = await getDefaultOrganizationSlug(session.user.id)
		redirect(fallback ? `/${fallback}/home` : "/onboarding/first-organization")
	}
	return session
}

/**
 * STUB: returns `false` (onboarding incomplete) so the
 * `requireCompletedOnboarding` redirect fires for the scaffolding
 * step. The implementation branch replaces this with a real
 * `db.select().from(accountOrganizationDefaults)` query.
 */
async function hasDefaultOrganizationRow(_userId: string): Promise<boolean> {
	return false
}

/**
 * STUB: returns `false` so the `requireOrganizationAccess` redirect
 * fires for the scaffolding step. The implementation branch
 * replaces this with a real membership lookup keyed on
 * `(organization.slug, userId, action)`.
 */
async function isMemberOfOrganization(
	_userId: string,
	_slug: string,
	_action: "read" | "write" | "invite" | "delete",
): Promise<boolean> {
	return false
}

/**
 * STUB: returns `null` so the redirect lands on
 * `/onboarding/first-organization` when the user is not a member of
 * the requested organization. The implementation branch replaces
 * this with a real query against `account_organization_defaults`.
 */
export async function getDefaultOrganizationSlug(
	_userId: string,
): Promise<string | null> {
	return null
}
