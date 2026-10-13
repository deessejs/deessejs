"use server"

import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import { requireAccountSession } from "@/lib/organization-auth"

type AcceptInvitationResult =
	| { ok: true; slug: string; organizationId: string }
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
 * The Server Action returns a clean `{ ok, slug, organizationId }`
 * shape so the client can render the error inline AND navigate to
 * the invited organization's home on success. For a brand-new
 * account that has no default yet, the client preserves the slug
 * through the onboarding wizard's `?return=` query param.
 */
export async function acceptInvitation(
	invitationId: string,
): Promise<AcceptInvitationResult> {
	await requireAccountSession()
	try {
		const result = (await auth.api.acceptInvitation({
			body: { invitationId },
			headers: await headers(),
		})) as unknown as { member?: { organizationId?: string } } | null
		const organizationId = result?.member?.organizationId
		if (!organizationId) {
			return { ok: false, error: "Invitation did not return an organization" }
		}
		// Resolve the slug for client navigation. The plugin
		// already set the new organization active; `listOrganizations`
		// returns the user's full list. We pick the just-joined
		// org by id.
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
		return { ok: true, slug: org.slug, organizationId: org.id }
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not accept invitation",
		}
	}
}
