import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@workspace/auth"
import { AcceptInvitation } from "@/components/onboarding/accept-invitation"

interface AcceptInvitationPageProps {
	params: Promise<{ id: string }>
}

/**
 * Accept-invitation landing. The route owns its own authentication
 * handoff (RFC-001 §10 "Auth transport and proxy"): an unauthenticated
 * visitor is redirected to /login with the original `?id=` query
 * param preserved, then bounced back here after sign-in. The
 * invitation acceptance itself runs as a Server Action in the
 * client component.
 *
 * The page is bypassed from the proxy's gate (no email-verification
 * redirect) because the recipient may be a brand-new account that
 * has not yet completed verification.
 */
export default async function AcceptInvitationPage({
	params,
}: AcceptInvitationPageProps) {
	const { id } = await params
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		redirect(`/login?redirect=/accept-invitation/${encodeURIComponent(id)}`)
	}

	return <AcceptInvitation invitationId={id} />
}
