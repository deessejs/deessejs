import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState } from "@/lib/onboarding"
import { orgHomePath } from "@/lib/org-route"

async function createOrganizationAction(formData: FormData) {
	"use server"
	const name = formData.get("name")?.toString().trim() ?? ""
	const slug = formData.get("slug")?.toString().trim() ?? ""

	// The form already validated client-side. Re-run the schema
	// server-side to keep the contract tight.
	if (!name || !slug) {
		redirect(`/onboarding/organization?error=${encodeURIComponent("missing")}`)
	}

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	// Call the server-side API directly. The authClient.organization
	// wrapper hits a path better-auth 1.7.2 doesn't register; the
	// server-side `auth.api.createOrganization` resolves the matching
	// route via the typed endpoint map.
	try {
		await auth.api.createOrganization({
			body: { name, slug },
			headers: await headers(),
		})
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not create workspace"
		redirect(
			`/onboarding/organization?error=${encodeURIComponent(message)}`,
		)
	}

	redirect("/onboarding/complete")
}

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
						action={createOrganizationAction}
						nextHref="/onboarding/complete"
					/>
				</AuthContainer.Content>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}
