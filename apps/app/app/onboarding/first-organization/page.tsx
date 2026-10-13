import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

interface FirstOrganizationOnboardingPageProps {
	searchParams: Promise<{ return?: string }>
}

/**
 * Mandatory first-organization onboarding. The Server Action in
 * `apps/app/lib/organization-onboarding.ts` runs the durable
 * provisioning protocol (option B in RFC-001 §5). The wizard
 * renders the four steps and the post-onboarding redirect.
 *
 * The `?return=` query param preserves a destination across the
 * onboarding flow. The invitation-accept flow sets it to
 * `/<invited slug>/home` when a brand-new account accepts an
 * invitation before completing onboarding. The wizard honors
 * the destination after creating the new default; the
 * org-scoped layout's `requireOrganizationAccess` guard is
 * the authoritative check on whether the user is actually a
 * member of the invited org.
 *
 * RFC-001 §8: the proxy at `apps/app/proxy.ts` short-circuits
 * `/onboarding/*` (no gate runs), so a signed-in verified user
 * with no default organization lands here. The
 * `requireCompletedOnboarding` helper inside the wizard's Server
 * Action is the authoritative gate; the page itself is a thin
 * server wrapper.
 */
export default async function FirstOrganizationOnboardingPage({
	searchParams,
}: FirstOrganizationOnboardingPageProps) {
	const { return: returnTo } = await searchParams
	if (!returnTo) {
		return <OnboardingWizard />
	}
	return <OnboardingWizard returnTo={returnTo} />
}
