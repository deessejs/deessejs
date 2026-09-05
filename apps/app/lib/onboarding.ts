import { headers } from "next/headers"

import { auth } from "@workspace/auth"

export type OnboardingStep = "organization" | "complete"

export type OnboardingState = {
	step: OnboardingStep | null
	hasOrganization: boolean
	completed: boolean
}

/**
 * Server-side onboarding state machine (ADR-030 §"Decision #8"
 * with backend; ADR-031 amendment 2026-09).
 *
 * Two mandatory steps:
 *   1. organization  — create the first workspace
 *   2. complete      — recap and exit to /home
 *
 * The third step that ADR-030 originally scoped (`integration`
 * for connecting GitHub / Vercel) was opt-in: the user can skip
 * every integration and still reach the dashboard. The step is
 * kept in the wizard for product surface but no longer feeds the
 * gate, so it doesn't appear in `OnboardingState`.
 *
 * `step` is `null` once onboarding is finished — the proxy and
 * the page-level gates both treat null as "do not redirect, the
 * user can navigate freely".
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) return null

	// Org membership surfaces via listOrganizations.
	const orgsRes = await auth.api.listOrganizations({ headers: await headers() })
	const orgs = (orgsRes ?? []) as { id: string }[]
	const hasOrganization = orgs.length > 0

	// Stamped by the /onboarding/complete server action.
	const completed =
		(session.user as { onboardingCompletedAt?: Date | string | null })
			.onboardingCompletedAt != null

	let step: OnboardingStep | null
	if (!hasOrganization) step = "organization"
	else if (!completed) step = "complete"
	else step = null

	return {
		step,
		hasOrganization,
		completed,
	}
}
