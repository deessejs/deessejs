import { redirect } from "next/navigation"

/**
 * Entry point for the onboarding wizard. Forwards to the first step
 * (`integration`) — the per-step pages gate forward themselves once
 * the user has connected GitHub, created an org, etc. ADR-030 §"Decision #8".
 */
export default function OnboardingIndexPage(): never {
	redirect("/onboarding/integration")
}