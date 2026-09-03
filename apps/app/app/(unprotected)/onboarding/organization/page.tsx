import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { CreateOrganizationForm } from "@/components/auth/create-organization-form"

export default async function OnboardingOrganizationPage() {
	// Server-side session gate (ADR-030 §"Decision #9", pattern from
	// `app/(unprotected)/(auth)/device/page.tsx`). Anonymous visitors
	// land on /login with a round-tripped redirect back to this page
	// once they authenticate, so they can complete onboarding.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) {
		redirect("/login")
	}

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-12">
			<div className="w-full max-w-lg">
				<AuthContainer.Root>
					<AuthContainer.Header
					 title="Create your organization"
					 description="Workspaces group your projects, members, and settings. You can create more or accept invitations later."
				 />
					<AuthContainer.Content>
						<CreateOrganizationForm />
					</AuthContainer.Content>
				</AuthContainer.Root>
			</div>
		</div>
	)
}