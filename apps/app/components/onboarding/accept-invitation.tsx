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
import { acceptInvitation } from "@/lib/organization-invitation"

interface AcceptInvitationProps {
	invitationId: string
}

/**
 * Client-side invitation acceptance. RFC-001 §9 step 5: acceptance
 * happens only after an explicit click.
 *
 * On success we have two destinations:
 *   - If the account already has a default organization
 *     (`hasDefault === true`), navigate to the invited org's
 *     home. The org layout's `requireOrganizationAccess` guard
 *     is the authoritative check.
 *   - If the account has no default yet (a brand-new account
 *     was invited before completing onboarding), navigate to
 *     `/onboarding?return=<invited slug>`. The wizard's
 *     `?error=` and `?return=` handling preserves the invited
 *     destination through the onboarding flow: the
 *     `createFirstOrganization` Server Action reads `?return=`
 *     and lands the user on the invited org after creating the
 *     fresh default.
 */
export function AcceptInvitation({ invitationId }: AcceptInvitationProps) {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleAccept() {
		setError(null)
		startTransition(async () => {
			const result = await acceptInvitation(invitationId)
			if (!result.ok) {
				setError(result.error)
				return
			}
			if (result.hasDefault) {
				router.push(`/${result.slug}/home`)
			} else {
				router.push(
					`/onboarding/first-organization?return=${encodeURIComponent(`/${result.slug}/home`)}`,
				)
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
						continue. You&apos;ll complete onboarding afterwards if
						needed.
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
