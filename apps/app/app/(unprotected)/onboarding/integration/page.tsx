import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { GitHubIcon } from "@/components/auth/icons/github-icon"
import { VercelIcon } from "@/components/auth/icons/vercel-icon"
import { Button } from "@workspace/ui/components/button"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

import { getOnboardingState } from "@/lib/onboarding"

type Integration = {
	id: "github" | "vercel"
	name: string
	description: string
	Icon: (props: { className?: string }) => React.JSX.Element
}

const INTEGRATIONS: Integration[] = [
	{
		id: "github",
		name: "GitHub",
		description: "Sync your projects to your repos and pull requests.",
		Icon: GitHubIcon,
	},
	{
		id: "vercel",
		name: "Vercel",
		description: "Deploy previews and link your workspaces.",
		Icon: VercelIcon,
	},
]

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

	return (
		<OnboardingShell currentStep="integration" completedSteps={completedSteps}>
			<AuthContainer.Root>
				<header className="mb-6 flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
							<VercelIcon className="size-5" />
						</span>
						<div className="flex flex-col gap-1">
							<h1 className="text-xl font-semibold leading-tight">
								Connect your accounts
							</h1>
							<p className="text-sm text-muted-foreground">
								Link the providers you&apos;ll use to publish and deploy.
							</p>
						</div>
					</div>
				</header>

				<ul className="flex flex-col gap-3">
					{INTEGRATIONS.map(({id, name, description, Icon}) => {
						const isConnected = state.hasGithub && id === "github"
						// Dummy: both read as not-set-up until PR #4 wires the
						// real `account` table check.
						const badgeState = isConnected ? "connected" : "not-set-up"
						return (
							<li
								key={id}
								className="flex items-center justify-between gap-3 rounded-md border bg-background px-4 py-3"
							>
								<div className="flex items-start gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
										<Icon className="size-5" />
									</span>
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium leading-none">
											{name}
										</span>
										<span className="text-xs text-muted-foreground">
											{description}
										</span>
									</div>
								</div>
								<span
									className={[
										"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
										badgeState === "connected"
											: "border-primary bg-primary text-primary-foreground"
											: "border-muted bg-muted text-muted-foreground",
									].join(" ")}
								>
									{badgeState === "connected" ? "Set up" : "Not set up"}
								</span>
							</li>
						)
					})}
				</ul>

				<div className="mt-6">
					<Button type="button" className="w-full" asChild>
						<Link href="/onboarding/organization">Continue</Link>
					</Button>
				</div>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}