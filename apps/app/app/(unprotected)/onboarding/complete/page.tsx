import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { CheckCircle2 } from "lucide-react"

import { auth } from "@workspace/auth"
import { Separator } from "@workspace/ui/components/separator"
import { AuthContainer } from "@/components/auth"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { orgHomePath } from "@/lib/org-route"

import { getOnboardingState } from "@/lib/onboarding"

async function markOnboardingComplete() {
	"use server"
	// ADR-030 PR #4: write the timestamp into the user row instead of
	// relying on a session-scoped cookie. The dummy cookie in
	// lib/onboarding.ts has been retired — sessions rotate, the
	// onboarding completion is permanent.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) return
	await auth.api.updateUser({
		// The `onboardingCompletedAt` field is declared via
		// `user.additionalFields` in auth.ts but better-auth 1.6.23
		// doesn't ship a CLI to regenerate the typed body shape; the
		// type lag is acceptable for the manual surface we use here.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		body: { onboardingCompletedAt: new Date() } as any,
		headers: await headers(),
	})
	redirect(orgHomePath())
}

export default async function OnboardingCompletePage() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	// Forward-gate: the user must have completed every prior step
	// (integration + at least one org) before they can land here.
	const state = await getOnboardingState()
	if (state?.step && state.step !== "complete") {
		redirect(`/onboarding/${state.step}`)
	}

	const completedSteps: Array<"integration" | "organization" | "complete"> = []
	if (state?.hasGithub) completedSteps.push("integration")
	if (state?.hasOrganization) completedSteps.push("organization")

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

				<form action={markOnboardingComplete} className="mt-6">
					<button
						type="submit"
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-colors"
					>
						Go to dashboard
					</button>
				</form>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}