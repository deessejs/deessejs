"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card"
import { createFirstOrganization } from "@/lib/organization-onboarding"

/**
 * Four-step onboarding wizard (RFC-001 §5 "First-organization
 * provisioning"). The first step is the only mandatory one — the
 * gate. Steps 2-4 are placeholders for the scaffolding step; the
 * implementation branch wires them to the plugin's invitation
 * lifecycle and the GitHub OAuth flow.
 */
type Step = 1 | 2 | 3 | 4

export function OnboardingWizard() {
	const router = useRouter()
	const [step, setStep] = useState<Step>(1)
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()

	function handleCreate(event: React.FormEvent) {
		event.preventDefault()
		if (!name.trim()) return
		setError(null)
		startTransition(async () => {
			const result = await createFirstOrganization({ name: name.trim() })
			if (!result.ok) {
				setError(result.error)
				return
			}
			router.push(`/${result.slug}/home`)
		})
	}

	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create your organization</CardTitle>
					<CardDescription>
						Step {step} of 4 — give your organization a name. The slug is
						generated automatically.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						id="create-first-organization"
						onSubmit={handleCreate}
						className="flex flex-col gap-3"
					>
						<label className="flex flex-col gap-1 text-sm">
							<span className="font-medium">Organization name</span>
							<Input
								autoFocus
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Acme Inc"
								disabled={pending}
							/>
						</label>
						{error && (
							<p className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</form>
				</CardContent>
				<div className="flex items-center justify-between border-t p-6">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
						disabled={pending}
					>
						Skip this step
					</Button>
					<Button
						type="submit"
						form="create-first-organization"
						disabled={pending || !name.trim()}
					>
						{pending ? "Creating…" : "Create organization"}
					</Button>
				</div>
			</Card>
		</div>
	)
}
