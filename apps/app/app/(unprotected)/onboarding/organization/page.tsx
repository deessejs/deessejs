import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

export default async function OnboardingOrganizationPage() {
	// Anonymous-only gate. Forward-gate (integration done? org done?)
	// is disabled until ADR-030 PR #4 wires the real backend.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

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