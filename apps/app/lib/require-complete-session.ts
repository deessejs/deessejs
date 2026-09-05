import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"

/**
 * Server-side guard for any `(protected)` route (ADR-031).
 *
 * Four invariants, evaluated in order, each one short-circuits to
 * a redirect if violated. The order matches the onboarding flow:
 *
 *   1. session exists         → /login?redirect=current path
 *   2. email verified         → /verify-email
 *   3. active organization   → /onboarding/organization
 *   4. onboarding completed  → /onboarding/integration
 *
 * Steps 3 and 4 are gated by additionalFields on the better-auth
 * `user` schema. The proxy enforces the same rules from the edge
 * to avoid flashes; this helper is the page-level defense-in-depth.
 */
export type CompleteSession = {
	session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
}

export async function requireCompleteSession(
	requestedPath?: string,
): Promise<CompleteSession> {
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session?.user) {
		const redirectTo = requestedPath
			? `/login?redirect=${encodeURIComponent(requestedPath)}`
			: "/login"
		redirect(redirectTo)
	}

	if (!session.user.emailVerified) {
		redirect("/verify-email")
	}

	if (!session.session.activeOrganizationId) {
		redirect("/onboarding/organization")
	}

	if (session.user.onboardingCompletedAt == null) {
		redirect("/onboarding/integration")
	}

	return { session }
}
