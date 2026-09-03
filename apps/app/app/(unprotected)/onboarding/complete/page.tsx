import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { CheckCircle2 } from "lucide-react"

import { auth } from "@workspace/auth"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { AuthContainer } from "@/components/auth"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState, markOnboardingComplete } from "@/lib/onboarding"

export default async function OnboardingCompletePage({
	searchParams,
}: {
	searchParams: Promise<{ onb?: string }>
}) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	const params = await searchParams

	const state = await getOnboardingState(params.onb)
	if (!state) redirect("/login")

	// Forward-gate: the user must have completed every prior step
	// before they can land here.
	if (state.step !== "complete") {
		redirect(`/onboarding/${state.step}`)
	}

	async function finish() {
		"use server"
		await markOnboardingComplete()
		// Server actions can't easily return a redirect in Next 16;
		// we read the cookie on the next request and let the proxy
		// step do its thing. The dummy version below uses a meta
		// refresh fallback.
	}

	const completedSteps: Array<"integration" | "organization" | "complete"> = []
	if (state.hasGithub) completedSteps.push("integration")
	if (state.hasOrganization) completedSteps.push("organization")

	return (
		<OnboardingShell currentStep="complete" completedSteps={completedSteps}>
			<AuthContainer.Root>
				<div className="flex flex-col items-center gap-2">
					<CheckCircle2 className="size-12 text-primary" />
					<h1 className="text-2xl font-bold">You&apos;re all set</h1>
					<p className="text-center text-sm text-muted-foreground">
						Your workspace is ready. Here&apos;s what you can do next.
					</p>
				</div>

				<Separator className="my-6" />

				<ul className="flex flex-col gap-3 text-sm">
					<li className="flex items-start gap-3 rounded-md border bg-muted/40 px-4 py-3">
						<span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" />
						<div className="flex flex-col">
							<span className="font-medium">Invite your team</span>
							<span className="text-xs text-muted-foreground">
								Add teammates and assign roles from your workspace settings.
							</span>
						</div>
					</li>
					<li className="flex items-start gap-3 rounded-md border bg-muted/40 px-4 py-3">
						<span className="mt-0.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
						<div className="flex flex-col">
							<span className="font-medium">Explore the dashboard</span>
							<span className="text-xs text-muted-foreground">
								Browse your projects, templates, and recent activity.
							</span>
						</div>
					</li>
					<li className="flex items-start gap-3 rounded-md border bg-muted/40 px-4 py-3">
						<span className="mt-0.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
						<div className="flex flex-col">
							<span className="font-medium">Connect more providers</span>
							<span className="text-xs text-muted-foreground">
								Add Vercel or change connected accounts at any time.
							</span>
						</div>
					</li>
				</ul>

				<form action={finish} className="mt-6 flex flex-col gap-2">
					<Button type="submit" className="w-full">
						Go to dashboard
					</Button>
					<p className="text-center text-xs text-muted-foreground">
						Dummy action — real backend lands in ADR-030 PR #4.
					</p>
				</form>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}