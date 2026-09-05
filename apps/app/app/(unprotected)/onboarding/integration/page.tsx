import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { auth } from "@workspace/auth"
import { AuthContainer } from "@/components/auth"
import { GitHubIcon } from "@/components/auth/icons/github-icon"
import { VercelIcon } from "@/components/auth/icons/vercel-icon"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

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

	// ADR-031 amendment 2026-09: the integration step is opt-in.
	// The user can browse this page freely, skip every provider,
	// and click Continue to reach the next step. The strict
	// gate at the proxy only enforces activeOrganizationId +
	// onboardingCompletedAt, so the wizard is not a blocker here.

	return (
		<OnboardingShell currentStep="integration" completedSteps={[]}>
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
						// The integration step is opt-in (ADR-031
						// amendment 2026-09). We don't surface a
						// "Set up" / "Not set up" badge here — the user
						// can click Continue without connecting any
						// provider. The connected-state read is deferred
						// to the Vercel / GitHub connect flow that
						// ships separately.
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
							</li>
						)
					})}
				</ul>

				<div className="mt-6">
					<Link
						href="/onboarding/organization"
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-colors"
					>
						Continue
					</Link>
				</div>
			</AuthContainer.Root>
		</OnboardingShell>
	)
}