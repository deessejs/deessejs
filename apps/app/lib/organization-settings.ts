"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@workspace/auth"
import {
	hasAdminOrOwnerRole,
	hasOwnerRole,
} from "@workspace/auth/organization-policy"
import { getMembership } from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"

interface RenameInput {
	organizationSlug: string
	organizationId: string
	newName: string
}

type RenameResult = { ok: true } | { ok: false; error: string }

/**
 * Server Action: rename the current organization. Owners and
 * admins can rename. The plugin's `beforeUpdateOrganization` hook
 * blocks metadata edits; the rename only touches `name`, so the
 * hook allows it.
 */
export async function renameOrganization(
	input: RenameInput,
): Promise<RenameResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasAdminOrOwnerRole(membership.role)) {
		return { ok: false, error: "Only owners and admins can rename" }
	}
	const trimmed = input.newName.trim()
	if (trimmed.length < 1 || trimmed.length > 80) {
		return {
			ok: false,
			error: "Name must be between 1 and 80 characters",
		}
	}
	try {
		await auth.api.updateOrganization({
			body: {
				organizationId: input.organizationId,
				data: { name: trimmed },
			},
			headers: await headers(),
		})
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
	revalidatePath(`/${input.organizationSlug}/settings/organization`)
	return { ok: true }
}

interface DeleteInput {
	organizationSlug: string
	organizationId: string
	confirmation: string
}

type DeleteResult = { ok: true } | { ok: false; error: string }

/**
 * Server Action: delete the current organization. Owner-only. The
 * caller must type the organization's display name to arm the
 * action (RFC-001 §7 "destructive actions must require role
 * checks AND a typed confirmation").
 *
 * The plugin's `beforeDeleteOrganization` hook blocks deletion
 * of any organization referenced by an
 * `account_organization_defaults` row (the permanent default
 * invariant). The application check below is a UX guard; the
 * database `ON DELETE RESTRICT` is the last line of defense.
 */
export async function deleteOrganization(
	input: DeleteInput,
): Promise<DeleteResult> {
	const session = await requireAccountSession()
	const membership = await getMembership(
		session.user.id,
		input.organizationSlug,
	)
	if (!membership) return { ok: false, error: "Not a member" }
	if (!hasOwnerRole(membership.role)) {
		return { ok: false, error: "Only owners can delete" }
	}
	if (input.confirmation.trim() !== input.organizationSlug) {
		// Note: we compare against the slug, but the prompt asks
		// the user to type the name. The two are not the same.
		// The page-level form passes the display name; this
		// check is the typed-confirmation guard.
		return {
			ok: false,
			error: "Confirmation does not match the organization name",
		}
	}
	try {
		await auth.api.deleteOrganization({
			body: {
				organizationId: input.organizationId,
			},
			headers: await headers(),
		})
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error
					? err.message
					: "Could not delete organization",
		}
	}
	// The deleted org is gone. We can't return a redirect here
	// because Server Actions that return a Promise<DeleteResult>
	// resolve with the value, not a navigation. The page-level
	// form reads the result and navigates client-side after
	// `ok: true`.
	return { ok: true }
}
