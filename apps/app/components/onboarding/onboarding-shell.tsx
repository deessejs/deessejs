import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"

import { Separator } from "@workspace/ui/components/separator"

const STEPS = [
	{ id: "integration", label: "Connect" },
	{ id: "organization", label: "Workspace" },
	{ id: "complete", label: "Finish" },
] as const

type OnboardingShellProps = {
	currentStep: (typeof STEPS)[number]["id"]
	completedSteps: ReadonlyArray<(typeof STEPS)[number]["id"]>
	backHref?: string
	children: React.ReactNode
}

/**
 * Shared wrapper for the three onboarding pages (ADR-030
 * §"Decision #8"). Renders a centered card with a 3-dot stepper
 * header, a back link, and the page-specific content. The stepper
 * shows progress and lets the user click back to any completed
 * step.
 *
 * No client-side state: the current step and completed steps come
 * from the server (see `lib/onboarding.ts`). The shell is a Server
 * Component so it renders the stepper from the same source of
 * truth as the gating logic.
 */
export function OnboardingShell({
	currentStep,
	completedSteps,
	backHref,
	children,
}: OnboardingShellProps) {
	const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-12">
			<div className="w-full max-w-lg">
				<nav className="mb-6 flex items-center justify-between">
					{backHref ? (
						<Link
							href={backHref}
							className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="size-4" />
							Back
						</Link>
					) : (
						<span />
					)}
					<ol className="flex items-center gap-2" aria-label="Onboarding progress">
						{STEPS.map((step, index) => {
							const isComplete = completedSteps.includes(step.id)
							const isCurrent = step.id === currentStep
							// Resolve the dot's visual state outside the JSX
							// className expression — nested ternaries inside
							// `[...].join(" ")` confuse Turbopack's parser in
							// Next 16 (see PR #126 CI failure).
							let dotStateClass: string
							if (isComplete) {
								dotStateClass =
									"border-primary bg-primary text-primary-foreground"
							} else if (isCurrent) {
								dotStateClass = "border-primary text-primary"
							} else {
								dotStateClass = "border-muted text-muted-foreground"
							}
							return (
								<li key={step.id} className="flex items-center gap-2">
									<Link
										href={
											isComplete || isCurrent
												? `/onboarding/${step.id}`
												: "#"
										}
										aria-current={isCurrent ? "step" : undefined}
										className={[
											"flex size-7 items-center justify-center rounded-full border text-xs font-medium",
											dotStateClass,
											isComplete || isCurrent ? "" : "pointer-events-none",
										].join(" ")}
									>
										{isComplete ? <Check className="size-3.5" /> : index + 1}
									</Link>
									<span
										className={[
											"text-xs",
											isCurrent
												? "font-medium text-foreground"
												: "text-muted-foreground",
										].join(" ")}
									>
										{step.label}
									</span>
									{index < STEPS.length - 1 && (
										<Separator
											orientation="horizontal"
											className="w-6"
										/>
									)}
								</li>
							)
						})}
					</ol>
				</nav>

				{children}
			</div>
		</div>
	)
}