import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { GitHubIcon } from "@/components/auth/icons/github-icon"
import { Button } from "@workspace/ui/components/button"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState } from "@/lib/onboarding"

export default async function OnboardingIntegrationPage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	const state = await getOnboardingState()
	if (!state) redirect("/login")

	// Forward-gate: integration is the first step. If the user has somehow
	// skipped ahead, push them to wherever they actually belong.
	if (state.step !== "integration") {
		redirect(`/onboarding/${state.step}`)
	}

	const completedSteps: Array<"integration" | "organization" | "complete"> = []
	if (state.hasGithub) completedSteps.push("integration")
	if (state.hasOrganization) completedSteps.push("organization")
	if (state.completed) completedSteps.push("complete")

	return (
		<OnboardingShell currentStep="integration" completedSteps={completedSteps}>
			<AuthContainer.Root>
				<AuthContainer.Header
					title="Connect your accounts"
					description="Link the providers you'll use to publish and deploy. You can add more later from settings."
				/>
				<AuthContainer.Content>
					<div className="flex flex-col gap-3">
						{state.hasGithub ? (
							<div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
								<div className="flex items-center gap-3">
									<GitHubIcon />
									<div className="flex flex-col">
										<span className="text-sm font-medium">GitHub</span>
										<span className="text-xs text-muted-foreground">
											Connected
										</span>
									</div>
								</div>
								<Button variant="ghost" size="sm" disabled>
									Connected
								</Button>
							</div>
						) : (
							<Button
								variant="outline"
								type="button"
								className="w-full justify-center"
								disabled
								title="Dummy: real OAuth wiring lands in ADR-030 PR #4"
							>
								<GitHubIcon />
								Connect GitHub
							</Button>
						)}
					</div>

					<p className="mt-4 text-center text-xs text-muted-foreground">
						Vercel will be available in a follow-up step.
					</p>

					<div className="mt-6">
						<Button
							type="button"
							className="w-full"
							// Dummy: in PR #4, this becomes a server action
							// that marks the integration step complete and
							// routes to /onboarding/organization.
							formAction="/onboarding/organization"
						>
							Continue
						</Button>
					</div>
				</AuthContainer.Content>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}