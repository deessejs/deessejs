"use server"

import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import { requireAccountSession } from "@/lib/organization-auth"

interface CreateFirstOrganizationInput {
	name: string
}

type CreateFirstOrganizationResult =
	| { ok: true; slug: string; organizationId: string }
	| { ok: false; error: string }

/**
 * Server Action: create the signed-in account's first organization
 * via the durable provisioning protocol (option B in RFC-001 §5).
 *
 * The action:
 *   1. Resolves the session and asserts email verification.
 *   2. Asserts the account has no existing default (an extra
 *      onboarding attempt on a completed account is a no-op and
 *      returns the existing default).
 *   3. Calls `auth.api.createOrganization` with the user-supplied
 *      name. The plugin's `beforeCreateOrganization` hook validates
 *      the slug, claims the provisioning record, and returns the
 *      server-only `bootstrapOperationId`. The plugin writes the
 *      organization row and the creator's owner membership.
 *   4. Finalizes the `account_organization_defaults` row + the
 *      `account_organization_provisioning` row (status `completed`)
 *      in a short application transaction conditional on the
 *      current fencing token. A repeated completion is a no-op.
 *   5. Sets the new organization active in the session.
 *
 * The action is the only sanctioned entry point for an
 * unauthenticated-by-default account. Native `authClient.organization.create`
 * calls on incomplete accounts are rejected by the same hook.
 *
 * STUB: the implementation branch adds the
 * `account_organization_provisioning` table, the bootstrap marker
 * additional field, and the transactional finalization. The stub
 * performs a regular `auth.api.createOrganization` call so the
 * route is wired end-to-end.
 */
export async function createFirstOrganization(
	input: CreateFirstOrganizationInput,
): Promise<CreateFirstOrganizationResult> {
	const session = await requireAccountSession()
	if (!session.user.emailVerified) {
		return { ok: false, error: "Verify your email first." }
	}

	// STUB: real implementation asserts the account has no
	// `account_organization_defaults` row, and that the durable
	// provisioning record is fresh or recoverable. For the
	// scaffolding step the call goes straight to the plugin.
	try {
		const result = await auth.api.createOrganization({
			body: { name: input.name },
			headers: await headers(),
		})
		// Narrow the response shape; the plugin returns either
		// `{ id, slug, name }` on success or throws an `APIError`.
		const org = result as unknown as {
			id?: string
			slug?: string
		}
		if (!org?.id || !org?.slug) {
			return { ok: false, error: "Server returned an invalid organization" }
		}
		return {
			ok: true,
			slug: org.slug,
			organizationId: org.id,
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}
}
