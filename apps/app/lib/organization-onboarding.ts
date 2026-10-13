"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { randomBytes, createHash } from "node:crypto"
import { auth } from "@workspace/auth"
import {
	finalizeOrganizationProvisioning,
	getDefaultOrganization,
	getProvisioningState,
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
 * RFC-001 §6: slug generation.
 *
 *   1. Normalize the user-supplied name to lowercase ASCII, dropping
 *      non-ASCII letters after NFKD decomposition. Hyphenate on any
 *      non-alphanumeric run.
 *   2. Fallback to `org` when normalization produces no usable base.
 *   3. Truncate the base to 41 characters so a 6-character hex suffix
 *      fits in the 2-48 byte policy bound.
 *   4. Append a deterministic 6-character hex suffix derived from
 *      `SHA-256(name + userId).slice(0, 6)`. Deterministic so a retry
 *      of the same request regenerates the SAME candidate and avoids
 *      burning through suffixes; a collision gets a fresh random
 *      suffix (see `randomSlugSuffix`).
 *
 * The server-side hook (`validateOrganizationSlug`) checks format and
 * reserved names; the database unique index on `organization.slug`
 * enforces final uniqueness. When the deterministic candidate
 * collides, the Server Action retries with a fresh random suffix.
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

function deterministicSlugSuffix(name: string, userId: string): string {
	return createHash("sha256")
		.update(`${name}::${userId}`)
		.digest("hex")
		.slice(0, 6)
}

function randomSlugSuffix(): string {
	return randomBytes(3).toString("hex") // 6 hex chars
}

function buildSlugCandidate(name: string, userId: string): string {
	return `${slugify(name)}-${deterministicSlugSuffix(name, userId)}`
}

function buildRandomSlugCandidate(name: string): string {
	return `${slugify(name)}-${randomSlugSuffix()}`
}

/**
 * Server Action: create the signed-in account's first organization
 * via the durable provisioning protocol (option B in RFC-001 §5).
 *
 * The action is the only sanctioned entry point for an undefaulted
 * account. Native `authClient.organization.create` calls on
 * incomplete accounts hit `prepareOrganizationCreation`, which
 * rejects the call with `FORBIDDEN` when an existing default is
 * found.
 *
 * The action is interruption-safe:
 *
 *   - On a fresh account, the first call lands an
 *     `account_organization_provisioning` row (via the
 *     `beforeCreateOrganization` hook), the plugin's organization
 *     row, and the creator's owner membership. We finalize by
 *     writing the `account_organization_defaults` row in the same
 *     transaction that flips the provisioning row to `completed`.
 *
 *   - On a retry of a successful call, the durable default lookup
 *     returns immediately and the action is a no-op.
 *
 *   - On a retry after a partial failure (organization + membership
 *     were created but the finalization crashed), the durable
 *     default lookup returns null but the plugin's `getProvisioning
 *     State` reports `pending`/`completed` with the existing
 *     organization id; we replay the finalization.
 *
 *   - On a retry after a slug collision, the action re-reads the
 *     last attempt's final slug from the provisioning row and
 *     retries with a fresh random suffix.
 */
export async function createFirstOrganization(
	input: CreateFirstOrganizationInput,
): Promise<CreateFirstOrganizationResult> {
	const session = await requireAccountSession()
	if (!session.user.emailVerified) {
		return { ok: false, error: "Verify your email first." }
	}

	// Step 1: idempotency on completed accounts.
	const existing = await getDefaultOrganization(session.user.id)
	if (existing) {
		return {
			ok: true,
			slug: existing.slug,
			organizationId: existing.id,
		}
	}

	// Step 2: replay detection. If a previous attempt left the
	// provisioning row in `pending` or `completed` without a
	// default, return the organization it created. This is the
	// "the user refreshed the page after the network dropped"
	// case: the plugin's organization + owner membership are
	// already in the database; we just need to finalize.
	const prior = await getProvisioningState(session.user.id)
	if (prior && prior.organizationId) {
		// Try to finalize. If the default already exists (a
		// concurrent caller beat us), we get back the slug; if a
		// fencing-token mismatch races us, we read the default
		// again.
		const replayed = await replayFinalize({
			userId: session.user.id,
			organizationId: prior.organizationId,
		})
		if (replayed.ok) return replayed
		const recovered = await getDefaultOrganization(session.user.id)
		if (recovered) {
			return {
				ok: true,
				slug: recovered.slug,
				organizationId: recovered.id,
			}
		}
	}

	// Step 3: native create. The plugin's
	// `beforeCreateOrganization` hook validates the slug and
	// claims the durable provisioning record. We retry on slug
	// collision (deterministic suffix then random suffixes) up
	// to a small bound.
	const MAX_SLUG_ATTEMPTS = 5
	let organizationId: string | null = null
	let slug: string | null = null
	let lastError: unknown = null
	for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
		const candidate =
			attempt === 0
				? buildSlugCandidate(input.name, session.user.id)
				: buildRandomSlugCandidate(input.name)
		try {
			const result = await auth.api.createOrganization({
				body: { name: input.name, slug: candidate },
				headers: await headers(),
			})
			const org = result as unknown as { id?: string; slug?: string }
			if (!org?.id || !org?.slug) {
				return { ok: false, error: "Server returned an invalid organization" }
			}
			organizationId = org.id
			slug = org.slug
			lastError = null
			break
		} catch (err) {
			lastError = err
			if (
				err &&
				typeof err === "object" &&
				"message" in err &&
				typeof (err as { message: unknown }).message === "string" &&
				(err as { message: string }).message
					.toLowerCase()
					.includes("slug")
			) {
				// Slug collision (or duplicate on retry). Re-read the
				// provisioning state — a parallel retry may have
				// already won the race and finalized; if so, return
				// that result.
				const recovered = await getDefaultOrganization(session.user.id)
				if (recovered) {
					return {
						ok: true,
						slug: recovered.slug,
						organizationId: recovered.id,
					}
				}
				continue
			}
			// Non-slug error. Surface it.
			return {
				ok: false,
				error: err instanceof Error ? err.message : "Unknown error",
			}
		}
	}
	if (lastError || organizationId === null || slug === null) {
		return {
			ok: false,
			error:
				lastError instanceof Error
					? `Could not allocate a slug after ${MAX_SLUG_ATTEMPTS} attempts: ${lastError.message}`
					: `Could not allocate a slug after ${MAX_SLUG_ATTEMPTS} attempts`,
		}
	}

	// Step 4: persist the final slug + requested name on the
	// provisioning row so future replays (a network retry, a page
	// refresh) see the SAME slug, not a fresh one. The hook
	// already created the row in `pending` state; this update
	// carries the slug through.
	await recordProvisioningRequest({
		userId: session.user.id,
		requestedName: input.name,
		finalSlug: slug,
	})

	// Step 5: finalize. Conditional update on `fencing_token`
	// inside a single transaction with the default row insert.
	// A fencing-token mismatch means a concurrent worker won;
	// we recover by re-reading the durable default.
	try {
		await finalizeOrganizationProvisioning({
			userId: session.user.id,
			organizationId,
		})
	} catch (err) {
		const recovered = await getDefaultOrganization(session.user.id)
		if (recovered) {
			return {
				ok: true,
				slug: recovered.slug,
				organizationId: recovered.id,
			}
		}
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		}
	}

	// Step 6: set the new organization active. Best-effort. The
	// default relation is the source of truth for navigation; the
	// session's active org is a convenience.
	try {
		await auth.api.setActiveOrganization({
			body: { organizationId },
			headers: await headers(),
		})
	} catch {
		// Swallow. The proxy will resolve the active org from the
		// default on the next request.
	}

	return { ok: true, slug, organizationId }
}

/**
 * Replay the finalize step on a previously-created organization.
 * Used when an interruption left the plugin's row in place but
 * the `account_organization_defaults` row was never written.
 */
async function replayFinalize(input: {
	userId: string
	organizationId: string
}): Promise<{ ok: true; slug: string; organizationId: string } | { ok: false }> {
	try {
		await finalizeOrganizationProvisioning(input)
	} catch {
		// Fencing-token mismatch or a default already exists; both
		// are recoverable by the caller through
		// getDefaultOrganization.
		return { ok: false }
	}
	const state = await getProvisioningState(input.userId)
	if (!state?.finalSlug) return { ok: false }
	return {
		ok: true,
		slug: state.finalSlug,
		organizationId: input.organizationId,
	}
}

/**
 * Server Action variant that immediately redirects to the new
 * organization's home page on success. Used by the onboarding
 * wizard's `action` prop so the wizard never has to handle
 * navigation on success.
 */
export async function createFirstOrganizationAndRedirect(
	input: CreateFirstOrganizationInput,
): Promise<never> {
	const result = await createFirstOrganization(input)
	if (!result.ok) {
		// Bounce back to the wizard with the error in the URL so
		// the client can render it. The wizard reads `?error=`
		// in its `searchParams`.
		redirect(`/onboarding?error=${encodeURIComponent(result.error)}`)
	}
	redirect(`/${result.slug}`)
}
