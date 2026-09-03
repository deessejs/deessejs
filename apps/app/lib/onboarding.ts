import { cookies as nextCookies } from "next/headers"
import { headers } from "next/headers"

import { auth } from "@workspace/auth"

export type OnboardingStep = "integration" | "organization" | "complete"

export type OnboardingState = {
	step: OnboardingStep
	hasGithub: boolean
	hasOrganization: boolean
	completed: boolean
}

const ONBOARDING_COMPLETE_COOKIE = "deessejs-onboarding-complete"

/**
 * Server-side onboarding state machine (ADR-030 §"Decision #8" + step
 * refinement). Reads the better-auth session, checks whether the user
 * has a GitHub account linked and whether at least one organization
 * exists, then returns the step the user should land on.
 *
 * Three steps in order:
 *   1. integration   — connect GitHub (and Vercel in V2)
 *   2. organization  — create the first workspace
 *   3. complete      — recap and exit to /home
 *
 * Once the user marks complete complete (cookie flag), `step` returns
 * null so the proxy leaves them alone. The cookie is the dummy backend
 * for now; ADR-030 PR #4 will swap it for `user.onboardingCompletedAt`
 * on the session row.
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) return null

	const jar = await nextCookies()
	const completed = jar.get(ONBOARDING_COMPLETE_COOKIE)?.value === "1"

	// Dummy checks — real wiring lands in ADR-030 PR #4. The shape
	// matches what the server will eventually return, so the page
	// components stay unchanged when the backend lands.
	const hasGithub = false
	const hasOrganization = false

	let step: OnboardingStep
	if (!hasGithub) step = "integration"
	else if (!hasOrganization) step = "organization"
	else if (!completed) step = "complete"
	else step = "integration" // unreachable, but keeps the type exhaustive

	return {
		step: completed ? "complete" : step,
		hasGithub,
		hasOrganization,
		completed,
	}
}

export async function markOnboardingComplete() {
	const jar = await nextCookies()
	jar.set(ONBOARDING_COMPLETE_COOKIE, "1", {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		// 1 year — onboarding is a one-shot.
		maxAge: 60 * 60 * 24 * 365,
	})
}

/**
 * Gate helper. The proxy and each onboarding page call this to
 * redirect to the correct step. Pass the URL the user requested;
 * the helper returns the URL they should be on.
 */
export async function resolveOnboardingRoute(requested: OnboardingStep): Promise<string> {
	const state = await getOnboardingState()
	if (!state) return "/login"

	const order: OnboardingStep[] = ["integration", "organization", "complete"]
	const requestedIdx = order.indexOf(requested)
	const currentIdx = order.indexOf(state.step)

	// User is asking for an earlier step than they're on — let them go back.
	if (requestedIdx <= currentIdx) {
		return `/onboarding/${requested}`
	}

	// User is asking for a step ahead of where they are — push them to the
	// current step.
	return `/onboarding/${state.step}`
}