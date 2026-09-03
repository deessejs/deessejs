import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
 * §"Decision #8"). A thin progress bar fills from the left as the
 * user advances, with a "Step N of 3 — Label" caption underneath.
 * Pattern after Stripe Checkout / Linear onboarding: minimal
 * chrome, the wizard state is felt without dominating the page.
 *
 * The shell is a Server Component; current and completed steps
 * come from `lib/onboarding.ts` server-side.
 */
export function OnboardingShell({
	currentStep,
	completedSteps,
	backHref,
	children,
}: OnboardingShellProps) {
	const currentIndex = STEPS.findIndex((step) => step.id === currentStep)
	// Fill stops mid-circle on the current step (e.g. step 2 of 3 = 50%).
	// Once the user lands on the final step we snap to 100%.
	const fillWidth =
		currentIndex < 0
			? "0%"
			: currentIndex >= STEPS.length - 1
				? "100%"
				: `${Math.round(((currentIndex + 0.5) / STEPS.length) * 100)}%`

	const currentLabel =
		STEPS.find((step) => step.id === currentStep)?.label ?? ""
	const stepPosition =
		currentIndex >= 0 ? currentIndex + 1 : completedSteps.length + 1

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-12">
			<div className="w-full max-w-lg">
				{backHref ? (
					<Link
						href={backHref}
						className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						Back
					</Link>
				) : null}

				<div
					className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted"
					role="progressbar"
					aria-valuenow={stepPosition}
					aria-valuemin={1}
					aria-valuemax={STEPS.length}
					aria-label="Onboarding progress"
				>
					<div
						className="h-full bg-primary transition-[width] duration-300"
						style={{ width: fillWidth }}
					/>
				</div>

				<p className="mb-6 text-xs text-muted-foreground">
					Step {Math.min(stepPosition, STEPS.length)} of {STEPS.length}
					{currentLabel ? ` — ${currentLabel}` : ""}
				</p>

				{children}
			</div>
		</div>
	)
}