import { headers } from "next/headers"

import { auth } from "@workspace/auth"

export type OnboardingStep = "integration" | "organization" | "complete"

export type OnboardingState = {
	step: OnboardingStep | null
	hasGithub: boolean
	hasOrganization: boolean
	completed: boolean
}

/**
 * Server-side onboarding state machine (ADR-030 §"Decision #8"
 * with backend). Reads the better-auth session and the account /
 * organization tables to decide which step the user should land on.
 *
 * Three steps in order:
 *   1. integration   — connect GitHub (Vercel in V2)
 *   2. organization  — create the first workspace
 *   3. complete      — recap and exit to /home
 *
 * `step` is `null` once onboarding is finished — the proxy and
 * the page-level gates both treat null as "do not redirect, the
 * user can navigate freely".
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) return null

	// Read the linked accounts. Note: better-auth names the endpoint
	// `listUserAccounts` (singular) — it lists the calling user's
	// own account rows, not arbitrary user rows.
	const accountsRes = await auth.api.listUserAccounts({
		headers: await headers(),
	})
	const accounts = (accountsRes ?? []) as { providerId: string }[]
	const hasGithub = accounts.some((account) => account.providerId === "github")

	// Org membership surfaces via listOrganizations.
	const orgsRes = await auth.api.listOrganizations({ headers: await headers() })
	const orgs = (orgsRes ?? []) as { id: string }[]
	const hasOrganization = orgs.length > 0

	// Stamped by the /onboarding/complete server action.
	const completed =
		(session.user as { onboardingCompletedAt?: Date | string | null })
			.onboardingCompletedAt != null

	let step: OnboardingStep | null
	if (!hasGithub) step = "integration"
	else if (!hasOrganization) step = "organization"
	else if (!completed) step = "complete"
	else step = null

	return {
		step,
		hasGithub,
		hasOrganization,
		completed,
	}
}
