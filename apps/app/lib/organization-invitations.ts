"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	getMembership,
} from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"

interface InviteInput {
	organizationSlug: string
	email: string
	role: "member" | "admin" | "owner"
}

type InviteResult =
	| { ok: true; invitationId: string; expiresAt: string }
	| { ok: false; error: string }

/**
 * Server Action: send an invitation to join the named
 * organization. The caller must be owner or admin. The plugin
 * routes the email through `sendInvitationEmail` (wired to
 * `sendOrganizationInvitation` in
 * `packages/auth/src/organization-invitation.ts`).
 *
 * The page-level layout re-checks the admin role; this action
 * re-checks too because Server Actions are reachable directly
 * via the action ID.
 */
export async function inviteMember(
	input: InviteInput,
): Promise<InviteResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasAdminOrOwnerRole(membership.role)) {
		return {
			ok: false,
			error: "Only owners and admins can invite members",
		}
	}
	if (!input.email.includes("@")) {
		return { ok: false, error: "Invalid email" }
	}
	if (input.role === "owner" && !membership.role.includes("owner")) {
		return { ok: false, error: "Only owners can invite an owner" }
	}
	try {
		const result = await auth.api.createInvitation({
			body: {
				organizationId: membership.organizationId,
				email: input.email.trim(),
				role: input.role,
			},
			headers: await headers(),
		})
		const inv = result as {
			id: string
			expiresAt: Date | string
		}
		if (!inv?.id) {
			return { ok: false, error: "Server returned an invalid invitation" }
		}
		const expiresAt =
			typeof inv.expiresAt === "string"
				? inv.expiresAt
				: inv.expiresAt.toISOString()
		revalidatePath(`/${input.organizationSlug}/settings/invitations`)
		return { ok: true, invitationId: inv.id, expiresAt }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
}

interface RevokeInput {
	organizationSlug: string
	invitationId: string
}

type RevokeResult = { ok: true } | { ok: false; error: string }

/**
 * Server Action: revoke a pending invitation. Owner/admin only.
 */
export async function revokeInvitation(
	input: RevokeInput,
): Promise<RevokeResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasAdminOrOwnerRole(membership.role)) {
		return {
			ok: false,
			error: "Only owners and admins can revoke invitations",
		}
	}
	try {
		await auth.api.cancelInvitation({
			body: { invitationId: input.invitationId },
			headers: await headers(),
		})
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
	revalidatePath(`/${input.organizationSlug}/settings/invitations`)
	return { ok: true }
}
