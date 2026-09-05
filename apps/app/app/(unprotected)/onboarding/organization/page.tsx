import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { createOrganization } from "@/lib/actions/create-organization"
import { getOnboardingState } from "@/lib/onboarding"

export default async function OnboardingOrganizationPage() {
	// Session gate: anonymous visitors bounce to /login.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	// Forward-gate: if the user already finished onboarding or
	// already has an org, push them to the right step. The
	// integration step is opt-in (ADR-031 amendment 2026-09), so
	// no check on `integration`.
	const state = await getOnboardingState()
	if (state?.step && state.step !== "organization") {
		redirect(`/onboarding/${state.step}`)
	}

	return (
		<OnboardingShell
			currentStep="organization"
			completedSteps={[]}
			backHref="/onboarding/integration"
		>
			<AuthContainer.Root>
				<AuthContainer.Header
					title="Create your organization"
					description="Workspaces group your projects, members, and settings. You can create more or accept invitations later."
				/>
				<AuthContainer.Content>
					<CreateOrganizationForm
						action={createOrganization}
						nextHref="/onboarding/complete"
					/>
				</AuthContainer.Content>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}
