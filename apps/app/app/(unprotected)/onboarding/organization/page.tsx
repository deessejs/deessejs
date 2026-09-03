import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState } from "@/lib/onboarding"

export default async function OnboardingOrganizationPage() {
	// Session gate: anonymous visitors bounce to /login.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	// Forward-gate: integration must be done before the user can
	// land on the organization step. If they got here directly,
	// push them to the current step.
	const state = await getOnboardingState()
	if (state?.step && state.step !== "organization") {
		redirect(`/onboarding/${state.step}`)
	}

	return (
		<OnboardingShell
			currentStep="organization"
			completedSteps={state?.hasGithub ? ["integration"] : []}
			backHref="/onboarding/integration"
		>
			<AuthContainer.Root>
				<AuthContainer.Header
					title="Create your organization"
					description="Workspaces group your projects, members, and settings. You can create more or accept invitations later."
				/>
				<AuthContainer.Content>
					<CreateOrganizationForm nextHref="/onboarding/complete" />
				</AuthContainer.Content>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}