import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { CheckCircle2 } from "lucide-react"

import { auth } from "@workspace/auth"
import { Separator } from "@workspace/ui/components/separator"
import { AuthContainer } from "@/components/auth"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

export default async function OnboardingCompletePage() {
	// Anonymous-only gate. Forward-gate is disabled until ADR-030 PR #4.
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user) redirect("/login")

	return (
		<OnboardingShell currentStep="complete" completedSteps={[]}>
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

				<div className="mt-6">
					<Link
						href="/home"
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-colors"
					>
						Go to dashboard
					</Link>
				</div>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}