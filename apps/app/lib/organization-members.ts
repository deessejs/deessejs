"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	hasOwnerRole,
	getMembership,
} from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"

interface ChangeRoleInput {
	organizationSlug: string
	memberId: string
	newRole: string
}

type ChangeRoleResult = { ok: true } | { ok: false; error: string }

/**
 * Server Action: change a member's role. Owners can change any
 * role; admins can change non-owner roles. The plugin's
 * `beforeUpdateMemberRole` hook enforces the creator-cannot-be
 * demoted invariant.
 */
export async function changeMemberRole(
	input: ChangeRoleInput,
): Promise<ChangeRoleResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasAdminOrOwnerRole(membership.role)) {
		return {
			ok: false,
			error: "Only owners and admins can change roles",
		}
	}
	// Admins cannot change owner roles.
	if (!hasOwnerRole(membership.role) && input.newRole === "owner") {
		return { ok: false, error: "Only owners can grant the owner role" }
	}
	try {
		await auth.api.updateMemberRole({
			body: {
				organizationId: membership.organizationId,
				memberId: input.memberId,
				role: input.newRole,
			},
			headers: await headers(),
		})
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
	revalidatePath(`/${input.organizationSlug}/settings/members`)
	return { ok: true }
}

interface RemoveInput {
	organizationSlug: string
	memberId: string
}

type RemoveResult = { ok: true } | { ok: false; error: string }

/**
 * Server Action: remove a member. The plugin's
 * `beforeRemoveMember` hook enforces the creator-cannot-be-removed
 * invariant on the default org.
 */
export async function removeMember(
	input: RemoveInput,
): Promise<RemoveResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasAdminOrOwnerRole(membership.role)) {
		return {
			ok: false,
			error: "Only owners and admins can remove members",
		}
	}
	try {
		await auth.api.removeMember({
			body: {
				organizationId: membership.organizationId,
				memberIdOrEmail: input.memberId,
			},
			headers: await headers(),
		})
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
	revalidatePath(`/${input.organizationSlug}/settings/members`)
	return { ok: true }
}
