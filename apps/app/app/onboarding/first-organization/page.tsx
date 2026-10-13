import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

/**
 * Mandatory first-organization onboarding. The Server Action in
 * `apps/app/lib/organization-onboarding.ts` runs the durable
 * provisioning protocol (option B in RFC-001 §5). The wizard
 * renders the four steps and the post-onboarding redirect.
 *
 * RFC-001 §8: the proxy at `apps/app/proxy.ts` short-circuits
 * `/onboarding/*` (no gate runs), so a signed-in verified user
 * with no default organization lands here. The
 * `requireCompletedOnboarding` helper inside the wizard's Server
 * Action is the authoritative gate; the page itself is a thin
 * server wrapper.
 */
export default function FirstOrganizationOnboardingPage() {
	return <OnboardingWizard />
}
