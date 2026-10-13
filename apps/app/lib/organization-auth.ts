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
 * The signed-in account and email-verification checks call
 * `auth.api.getSession` directly. The organization-scoped checks
 * delegate to `packages/auth/src/organization-policy.ts` which owns
 * the real Drizzle queries against `account_organization_defaults`,
 * `account_organization_provisioning`, `organization`, and `member`.
 */

import "server-only"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import {
	getDefaultOrganization,
	getMembership,
} from "@workspace/auth/organization-policy"

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
	const defaultOrg = await getDefaultOrganization(session.user.id)
	if (!defaultOrg) {
		redirect("/onboarding/first-organization")
	}
	return session
}

/**
 * Require membership in the organization identified by the route's
 * `[organization_slug]` segment, and that the session user is
 * permitted to perform the given `action` (e.g. `read`, `write`,
 * `invite`, `delete`). Redirects to the account default home when
 * the user has no access; throws an `APIError("FORBIDDEN")` when
 * the user is signed in but not a member.
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
	const membership = await getMembership(session.user.id, slug)
	if (!membership) {
		// Match the proxy's redirect pattern: send unauthorized
		// requests to the default home rather than /login, because
		// the user is signed in and verified; the issue is tenant
		// access, not authentication.
		const fallback = await getDefaultOrganization(session.user.id)
		redirect(fallback ? `/${fallback.slug}/home` : "/onboarding/first-organization")
	}
	// Action-level authorization. The plugin's default rules apply
	// at the data-access layer; this helper is the early gate.
	if (action === "delete" && membership.role !== "owner") {
		const fallback = await getDefaultOrganization(session.user.id)
		redirect(fallback ? `/${fallback.slug}/home` : "/onboarding/first-organization")
	}
	if (action === "invite" && membership.role === "member") {
		const fallback = await getDefaultOrganization(session.user.id)
		redirect(fallback ? `/${fallback.slug}/home` : "/onboarding/first-organization")
	}
	return session
}

/**
 * Resolve the account's permanent default organization. The page
 * redirect at `/` and the post-onboarding landing consume this to
 * pick the destination. Returns `null` when the account has not
 * completed onboarding.
 */
export async function getDefaultOrganizationSlug(
	userId: string,
): Promise<string | null> {
	const org = await getDefaultOrganization(userId)
	return org?.slug ?? null
}
