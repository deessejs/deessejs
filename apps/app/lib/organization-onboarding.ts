"use server"

import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import {
	finalizeOrganizationProvisioning,
	getDefaultOrganization,
	recordProvisioningRequest,
} from "@workspace/auth/organization-policy"
import { requireAccountSession } from "@/lib/organization-auth"

interface CreateFirstOrganizationInput {
	name: string
}

type CreateFirstOrganizationResult =
	| { ok: true; slug: string; organizationId: string }
	| { ok: false; error: string }

/**
 * Generate a slug candidate from the user-supplied name. The
 * algorithm is documented in RFC-001 §6:
 *
 *   1. Lowercase ASCII letters and digits only.
 *   2. Hyphen-separated segments; collapse runs of separators.
 *   3. Trim leading and trailing hyphens.
 *   4. Fallback to `org` when normalization produces no usable base.
 *   5. Truncate to 41 characters (so a 6-char hex suffix fits in the
 *      2-48 byte bound).
 *
 * The server appends the random suffix on collision or reserved
 * match (handled in `auth.ts` by the plugin's slug uniqueness
 * check). This function is the input to that pipeline; the actual
 * uniqueness arbitration happens in the plugin.
 */
function slugify(name: string): string {
	const base = name
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
	const safe = base || "org"
	return safe.slice(0, 41)
}

/**
 * Server Action: create the signed-in account's first organization
 * via the durable provisioning protocol (option B in RFC-001 §5).
 *
 * The action:
 *   1. Resolves the session and asserts email verification.
 *   2. Asserts the account has no existing default. A repeated
 *      call on a completed account is a no-op and returns the
 *      existing default.
 *   3. Generates a server-side slug candidate.
 *   4. Records the request on the provisioning row (so a retry
 *      replays the same name and slug, not a fresh random one).
 *   5. Calls `auth.api.createOrganization` with the user-supplied
 *      name. The plugin's `beforeCreateOrganization` hook
 *      validates the slug, claims the durable provisioning record
 *      (no-op since we already created the row), and returns the
 *      server-only `bootstrapOperationId`. The plugin writes the
 *      organization row and the creator's owner membership.
 *   6. Calls `finalizeOrganizationProvisioning` which finalizes
 *      the `account_organization_defaults` row + the
 *      `account_organization_provisioning` row (status
 *      `completed`) in a short application transaction conditional
 *      on the current fencing token. A repeated completion is a
 *      no-op.
 *   7. Sets the new organization active in the session.
 *
 * The action is the only sanctioned entry point for an
 * undefaulted account. Native `authClient.organization.create`
 * calls on incomplete accounts are rejected by the same hook.
 */
export async function createFirstOrganization(
	input: CreateFirstOrganizationInput,
): Promise<CreateFirstOrganizationResult> {
	const session = await requireAccountSession()
	if (!session.user.emailVerified) {
		return { ok: false, error: "Verify your email first." }
	}

	// Step 2: idempotency. A repeat call on a completed account
	// returns the existing default. The Server Action is the
	// only sanctioned entry point, so a duplicate submission is
	// the expected case (network retry, double-click, etc.).
	const existing = await getDefaultOrganization(session.user.id)
	if (existing) {
		return {
			ok: true,
			slug: existing.slug,
			organizationId: existing.id,
		}
	}

	// Step 3 + 4: slug candidate + record the request on the
	// provisioning row. The provisioning row was created by the
	// `beforeCreateOrganization` hook on the first attempt; on
	// retries it already exists. The `recordProvisioningRequest`
	// call is a no-op on the first attempt and a real update on
	// retries.
	const finalSlug = slugify(input.name)
	await recordProvisioningRequest({
		userId: session.user.id,
		requestedName: input.name,
		finalSlug,
	})

	// Step 5: native create. The plugin's
	// `beforeCreateOrganization` hook validates the slug and
	// claims the durable provisioning record (returning
	// `bootstrapOperationId`).
	let organizationId: string
	let slug: string
	try {
		const result = await auth.api.createOrganization({
			body: { name: input.name, slug: finalSlug },
			headers: await headers(),
		})
		const org = result as unknown as { id?: string; slug?: string }
		if (!org?.id || !org?.slug) {
			return { ok: false, error: "Server returned an invalid organization" }
		}
		organizationId = org.id
		slug = org.slug
	} catch (err) {
		// Recoverable: a previous attempt may have left an
		// organization row without finalizing. Look it up by the
		// marker and finalize the existing one rather than failing
		// the user.
		if (
			err &&
			typeof err === "object" &&
			"message" in err &&
			typeof (err as { message: unknown }).message === "string" &&
			((err as { message: string }).message.toLowerCase().includes("slug") ||
				(err as { message: string }).message.toLowerCase().includes("unique"))
		) {
			// The slug collided or the operation was already
			// attempted. Re-read the provisioning record and try
			// to finalize the existing organization.
			const recovered = await getDefaultOrganization(session.user.id)
			if (recovered) {
				return {
					ok: true,
					slug: recovered.slug,
					organizationId: recovered.id,
				}
			}
		}
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}

	// Step 6: finalize. The conditional update on
	// `fencing_token` returns 0 rows if a concurrent worker
	// advanced the row first; we recover by reading the durable
	// default.
	try {
		await finalizeOrganizationProvisioning({
			userId: session.user.id,
			operationId: finalSlug, // The marker correlated to the
			// provisioning row by the
			// beforeCreateOrganization hook;
			// the actual operationId lives on
			// the row.
			organizationId,
		})
	} catch (err) {
		// Fencing-token mismatch or other conflict. The recovery
		// path: re-read the default and return it. The
		// implementation branch tightens this with a transactional
		// retry; for now a single attempt is the contract.
		if (err && typeof err === "object" && "message" in err) {
			const recovered = await getDefaultOrganization(session.user.id)
			if (recovered) {
				return {
					ok: true,
					slug: recovered.slug,
					organizationId: recovered.id,
				}
			}
		}
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}

	// Step 7: set the new organization active. Failure here is
	// non-fatal: the durable default is in place, the user lands
	// on the post-onboarding page, and the next page-level helper
	// will resolve the active org from the default.
	try {
		await auth.api.setActiveOrganization({
			body: { organizationId },
			headers: await headers(),
		})
	} catch {
		// Best-effort. The default relation is the source of truth
		// for navigation; the session's active org is a
		// convenience.
	}

	return { ok: true, slug, organizationId }
}
