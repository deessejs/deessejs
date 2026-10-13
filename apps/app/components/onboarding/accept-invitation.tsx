"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card"
import { authClient } from "@/lib/auth-client"

interface AcceptInvitationProps {
	invitationId: string
}

/**
 * Client-side invitation acceptance. RFC-001 §9 step 5: acceptance
 * happens only after an explicit click. On success, the user is
 * routed to the organization home (`/[organization_slug]/home`).
 *
 * If the account has no default organization yet (e.g. the user
 * is brand-new and was invited before completing onboarding), the
 * component preserves the invited organization return target
 * through `/onboarding/first-organization` so the post-onboarding
 * landing lands them on the invited organization instead of the
 * freshly created default.
 *
 * STUB: the implementation branch reads the invitation record to
 * pre-fill the organization name and the inviter name (so the
 * card can render "Acme Inc invited you to …"); for the
 * scaffolding step we show a generic prompt.
 */
export function AcceptInvitation({ invitationId }: AcceptInvitationProps) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleAccept() {
		setError(null)
		startTransition(async () => {
			try {
				await authClient.organization.acceptInvitation({
					invitationId,
				})
				router.push("/onboarding/first-organization")
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error")
			}
		})
	}

	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Accept invitation</CardTitle>
					<CardDescription>
						You&apos;ve been invited to join an organization. Accept to
						continue. You&apos;ll complete onboarding afterwards.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
					<Button onClick={handleAccept} disabled={pending}>
						{pending ? "Accepting…" : "Accept invitation"}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
