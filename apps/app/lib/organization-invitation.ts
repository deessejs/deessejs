"use server"

import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import { getDefaultOrganization } from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"

type AcceptInvitationResult =
	| { ok: true; slug: string; organizationId: string; hasDefault: boolean }
	| { ok: false; error: string }

/**
 * Server Action: accept an invitation.
 *
 * The component previously called `authClient.organization.acceptInvitation`
 * directly, which:
 *   1. wrapped the request in `try/catch` but never read the
 *      `{ data, error }` return shape, so any 4xx was swallowed
 *      and the user was unconditionally pushed to the onboarding
 *      wizard as if the call had succeeded;
 *   2. routed every user — including already-defaulted accounts
 *      accepting a real invitation — to
 *      `/onboarding/first-organization`, losing the invited
 *      organization context.
 *
 * The Server Action returns a clean `{ ok, slug, organizationId,
 * hasDefault }` shape. `hasDefault` lets the client decide
 * whether to navigate directly to the invited org's home (when
 * the account is already completed) or to
 * `/onboarding?return=<slug>` first (when the account is brand
 * new and was invited before completing onboarding).
 */
export async function acceptInvitation(
	invitationId: string,
): Promise<AcceptInvitationResult> {
	const session = await requireAccountSession()
	try {
		const result = (await auth.api.acceptInvitation({
			body: { invitationId },
			headers: await headers(),
		})) as unknown as { member?: { organizationId?: string } } | null
		const organizationId = result?.member?.organizationId
		if (!organizationId) {
			return { ok: false, error: "Invitation did not return an organization" }
		}
		const orgs = (await auth.api.listOrganizations({
			headers: await headers(),
		})) as Array<{ id: string; slug: string }>
		const org = orgs.find((o) => o.id === organizationId)
		if (!org) {
			return {
				ok: false,
				error: "Organization not found after acceptance",
			}
		}
		const defaultOrg = await getDefaultOrganization(session.user.id)
		return {
			ok: true,
			slug: org.slug,
			organizationId: org.id,
			hasDefault: defaultOrg !== null,
		}
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not accept invitation",
		}
	}
}
