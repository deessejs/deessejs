"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { randomBytes, createHash } from "node:crypto"
import { auth } from "@workspace/auth"
import {
	consumeProvisioningClaim,
	ensureOwnerMembership,
	finalizeOrganizationProvisioning,
	findOrganizationByMarker,
	getDefaultOrganization,
	getProvisioningState,
	recordProvisioningRequest,
	takeOverExpiredProvisioning,
	withProvisioningAttempt,
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
	const safe = base || "org"
	// Truncate BEFORE the leading/trailing dash strip.
	// The earlier order (strip, then truncate) silently
	// produced a trailing dash for inputs whose last
	// non-alphanumeric run landed at the truncation
	// boundary (e.g. 40 letters + " " + a letter ->
	// "aaaa...a-z" truncated to 41 -> "aaaa...a-" ->
	// "--suffix" after appending the random suffix, which
	// the server then rejected as malformed on every
	// retry). Stripping after the slice keeps the slug
	// policy (no leading/trailing dashes) true at the
	// final length.
	const trimmed = safe.slice(0, 41).replace(/^-+|-+$/g, "")
	return trimmed || "org"
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

	// Step 2: replay detection. A previous attempt may have
	// landed the plugin's organization row + owner membership but
	// crashed before finalization. The marker is the ONLY way to
	// find that organization: `account_organization_provisioning
	// .organization_id` is null until the finalization
	// transaction commits, so reading it from the provisioning
	// row tells us nothing about a partial-attempt org. We also
	// pass the prior `leaseUntil` so the recovery path can
	// take over the lease when it has expired (otherwise the
	// finalization WHERE clause `fencingToken = <old> AND
	// leaseUntil > now` would reject and we'd fall through to a
	// fresh create — which the unique index on
	// `bootstrap_operation_id` would then reject because the
	// old org still carries the same marker).
	const prior = await getProvisioningState(session.user.id)
	if (prior) {
		const replayed = await replayFinalize({
			userId: session.user.id,
			operationId: prior.operationId,
			fencingToken: prior.fencingToken,
			leaseUntil: prior.leaseUntil,
		})
		if (replayed.ok) return replayed
	}

	// Steps 3–6 run inside ONE `withProvisioningAttempt` frame
	// so the AsyncLocalStorage context that scopes the hook's
	// claim stash is still live when the Server Action calls
	// `consumeProvisioningClaim` below. A previous revision
	// wrapped only the `createOrganization` call; the
	// `consumeProvisioningClaim` then ran outside the frame and
	// always returned null, breaking first-time org creation. The
	// frame must therefore span BOTH the create AND the
	// consume/finalize. The callback is `async` so we can `await
	// headers()` and the various DB calls.
	const attemptId = randomBytes(16).toString("hex")
	return await withProvisioningAttempt(
		session.user.id,
		attemptId,
		async () => {
			// Step 3: native create. The plugin's
			// `beforeCreateOrganization` hook validates the
			// slug and claims the durable provisioning
			// record. We retry on slug collision
			// (deterministic suffix then random suffixes) up
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
						return {
							ok: false,
							error: "Server returned an invalid organization",
						}
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
						// Slug collision (or duplicate on
						// retry). Re-read the provisioning
						// state — a parallel retry may have
						// already won the race and finalized;
						// if so, return that result.
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

			// Step 4: persist the final slug + requested name
			// on the provisioning row so future replays (a
			// network retry, a page refresh) see the SAME
			// slug, not a fresh one. The hook already created
			// the row in `pending` state; this update carries
			// the slug through.
			await recordProvisioningRequest({
				userId: session.user.id,
				requestedName: input.name,
				finalSlug: slug,
			})

			// Step 5: finalize. Conditional update on
			// `fencing_token` inside a single transaction with
			// the default row insert. The fencing token + lease
			// we pass are the ones the
			// `beforeCreateOrganization` hook stashed via
			// `prepareOrganizationCreation`. Reading them from
			// the stash — rather than re-querying the row — is
			// the only way to test the "stale worker" scenario:
			// a worker that read fencing_token = 1 before
			// another worker advanced it to 2 will fail our
			// WHERE clause and the transaction rolls back. A
			// function that re-reads would silently use the
			// latest value and never fail.
			const claim = consumeProvisioningClaim(session.user.id)
			if (!claim) {
				return {
					ok: false,
					error: "Provisioning state disappeared mid-flight",
				}
			}
			try {
				await finalizeOrganizationProvisioning({
					userId: session.user.id,
					organizationId,
					expectedFencingToken: claim.fencingToken,
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

			// Step 6: set the new organization active.
			// Best-effort. The default relation is the source
			// of truth for navigation; the session's active
			// org is a convenience.
			try {
				await auth.api.setActiveOrganization({
					body: { organizationId },
					headers: await headers(),
				})
			} catch {
				// Swallow. The proxy will resolve the active
				// org from the default on the next request.
			}

			return { ok: true, slug, organizationId }
		},
	)
}

/**
 * Replay the finalize step on a previously-created organization.
 *
 * Three recovery scenarios, distinguished by what we find in the
 * database:
 *
 *   - **Default already exists** — a parallel caller won the
 *     race. Return the durable default immediately; no
 *     finalization needed.
 *
 *   - **No default yet, marker-bound org exists, lease is live** —
 *     the plugin's organization row + owner membership are on
 *     disk from a partial previous attempt. Repair the owner
 *     membership in case the previous attempt crashed AFTER
 *     creating the org but BEFORE the membership, then re-issue
 *     the finalization with the fencing token we read at the
 *     start of the request. A fencing-token mismatch means a
 *     parallel request advanced past us — fall back to the
 *     durable default.
 *
 *   - **No default yet, marker-bound org exists, lease is
 *     expired** — the previous attempt's worker died AFTER
 *     creating the org + membership but before finalization,
 *     and the lease timed out. The finalize's WHERE clause
 *     requires `leaseUntil > now` so passing the old token
 *     would fail; we must first call
 *     `takeOverExpiredProvisioning` to bump the token and
 *     renew the lease, then finalize with the NEW token. A
 *     fresh create in this state would hit the unique index
 *     on `bootstrap_operation_id` and reject (the old org
 *     still carries the same marker).
 */
async function replayFinalize(input: {
	userId: string
	operationId: string
	fencingToken: number
	leaseUntil: number
}): Promise<{ ok: true; slug: string; organizationId: string } | { ok: false }> {
	const existing = await getDefaultOrganization(input.userId)
	if (existing) {
		return {
			ok: true,
			slug: existing.slug,
			organizationId: existing.id,
		}
	}
	const recovered = await findOrganizationByMarker(input.operationId)
	if (!recovered) {
		// The previous attempt did not even reach the
		// organization insert. Let the caller create a fresh
		// one.
		return { ok: false }
	}
	// Take over the lease if it has expired. The helper
	// bumps the fencing token and returns the new value;
	// the finalize step below uses that new token. If the
	// lease is already live, the helper returns the existing
	// (unchanged) state — the finalize then matches the
	// caller's input token, which is what the original
	// "live-lease" branch did before.
	const now = Date.now()
	const lease = input.leaseUntil > now
		? { operationId: input.operationId, fencingToken: input.fencingToken, leaseUntil: input.leaseUntil }
		: await takeOverExpiredProvisioning(
				input.userId,
				input.operationId,
				input.fencingToken,
			)
	await ensureOwnerMembership(input.userId, recovered.id)
	try {
		await finalizeOrganizationProvisioning({
			userId: input.userId,
			organizationId: recovered.id,
			expectedFencingToken: lease.fencingToken,
		})
	} catch {
		// Fencing-token mismatch: a parallel worker advanced
		// past us. The default is either already there (a
		// parallel caller landed it) or the parallel caller is
		// still mid-flight. The caller will re-read the default
		// on the next pass.
		return { ok: false }
	}
	return {
		ok: true,
		slug: recovered.slug,
		organizationId: recovered.id,
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

interface CreateAdditionalOrganizationInput {
	name: string
}

type CreateAdditionalOrganizationResult =
	| { ok: true; slug: string; organizationId: string }
	| { ok: false; error: string }

/**
 * Server Action: create an additional organization for an
 * already-defaulted account. Used by the sidebar's "Create
 * organization" dialog after onboarding is complete.
 *
 * The action deliberately goes through a Server Action rather
 * than `authClient.organization.create` so the additional-org
 * path is centralized: the slug generation lives here, the
 * `prepareOrganizationCreation` hook returns `{}` for
 * additional orgs (the marker is a one-time correlation
 * pointer for the first org), and the response is a clean
 * `{ ok, slug, organizationId }` shape the dialog can render
 * without parsing the plugin's `{ data, error }` envelope.
 *
 * Preconditions: account has a default organization, the user
 * is email-verified. We re-check both server-side and return a
 * non-2xx-equivalent `{ ok: false }` rather than throwing so
 * the dialog's existing error path renders the message
 * inline.
 */
export async function createAdditionalOrganization(
	input: CreateAdditionalOrganizationInput,
): Promise<CreateAdditionalOrganizationResult> {
	const session = await requireAccountSession()
	if (!session.user.emailVerified) {
		return { ok: false, error: "Verify your email first." }
	}
	const trimmed = input.name.trim()
	if (trimmed.length < 1 || trimmed.length > 80) {
		return {
			ok: false,
			error: "Name must be between 1 and 80 characters",
		}
	}
	const existing = await getDefaultOrganization(session.user.id)
	if (!existing) {
		return {
			ok: false,
			error: "Complete onboarding before creating additional organizations.",
		}
	}

	// The plugin's `beforeCreateOrganization` hook enforces a
	// provisioning-attempt context for every call. The hook
	// returns `{}` early for additional orgs (the default
	// relation already exists), so the attempt id is harmless
	// here — but it MUST be present or the hook throws. The
	// context is also a safety net: a future change that
	// tightens the hook's additional-org path will be picked
	// up here without further work.
	const attemptId = randomBytes(16).toString("hex")
	return await withProvisioningAttempt(
		session.user.id,
		attemptId,
		async () => {
			const MAX_SLUG_ATTEMPTS = 5
			let organizationId: string | null = null
			let slug: string | null = null
			let lastError: unknown = null
			for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
				const candidate = buildRandomSlugCandidate(trimmed)
				try {
					const result = await auth.api.createOrganization({
						body: { name: trimmed, slug: candidate },
						headers: await headers(),
					})
					const org = result as unknown as { id?: string; slug?: string }
					if (!org?.id || !org?.slug) {
						return {
							ok: false,
							error: "Server returned an invalid organization",
						}
					}
					organizationId = org.id
					slug = org.slug
					lastError = null
					break
				} catch (err) {
					lastError = err
					const message =
						err instanceof Error ? err.message.toLowerCase() : ""
					if (message.includes("slug")) {
						continue
					}
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

			// Set the new organization active. Best-effort.
			// The proxy will resolve the active org from the
			// session on the next request if this fails.
			try {
				await auth.api.setActiveOrganization({
					body: { organizationId },
					headers: await headers(),
				})
			} catch {
				// Swallow. The user can re-select from the
				// sidebar.
			}

			return { ok: true, slug, organizationId }
		},
	)
}
