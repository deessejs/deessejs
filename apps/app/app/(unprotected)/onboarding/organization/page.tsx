import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState } from "@/lib/onboarding"

export default async function OnboardingOrganizationPage() {
	// Server-side session gate (ADR-030 §"Decision #9", pattern from
	// `app/(unprotected)/(auth)/device/page.tsx`). Anonymous visitors
	// land on /login with a round-tripped redirect back to this page
	// once they authenticate, so they can complete onboarding.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) {
		redirect("/login")
	}

	const state = await getOnboardingState()
	if (!state) redirect("/login")

	// Forward-gate: integration must be done before the user can land
	// on the organization step. If they got here directly, push them
	// to the current step.
	if (state.step !== "organization") {
		redirect(`/onboarding/${state.step}`)
	}

	const completedSteps: Array<"integration" | "organization" | "complete"> = []
	if (state.hasGithub) completedSteps.push("integration")

	return (
		<OnboardingShell
			currentStep="organization"
			completedSteps={completedSteps}
			backHref="/onboarding/integration"
		>
			<AuthContainer.Root>
				<AuthContainer.Header
					title="Create your organization"
					description="Workspaces group your projects, members, and settings. You can create more or accept invitations later."
				/>
				<AuthContainer.Content>
					{/*
					  Dummy form. PR #4 swaps the onSubmit to call
					  `authClient.organization.createOrganization(...)`
					  and route to /onboarding/complete (instead of /home).
					*/}
					<CreateOrganizationForm nextHref="/onboarding/complete" />
				</AuthContainer.Content>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}