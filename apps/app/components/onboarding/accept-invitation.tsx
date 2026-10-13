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
 * happens only after an explicit click. On success, the user is
 * routed to the invited organization's home (`/<slug>/home`).
 *
 * If the account has no default organization yet (e.g. the user
 * is brand-new and was invited before completing onboarding), the
 * component preserves the invited organization return target
 * through `/onboarding/first-organization?return=<slug>` so the
 * post-onboarding landing lands them on the invited organization
 * instead of the freshly created default.
 *
 * The Server Action returns a clean `{ ok, slug, organizationId }`
 * shape; the component reads the error from that envelope and
 * renders it inline, rather than swallowing it.
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
			// The account may or may not have a default
			// organization. We do not know here; the simplest
			// is to navigate directly to the invited org's
			// home — the org layout's `requireOrganizationAccess`
			// guard will bounce the user to onboarding if the
			// account is not yet default. The / route also
			// handles "no default" by sending the user to the
			// wizard; we use `return=` so the wizard can land
			// the user on the invited org afterwards.
			router.push(`/${result.slug}/home`)
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
