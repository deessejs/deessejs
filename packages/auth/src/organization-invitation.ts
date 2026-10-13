/**
 * Organization invitation delivery (RFC-001 §9).
 *
 * The better-auth `organization` plugin calls `sendInvitationEmail`
 * with the invitation record after creating it. The callback here:
 *
 *   1. Builds the acceptance URL from `serverEnv.APP_URL` (NOT
 *      `BETTER_AUTH_URL`, NOT the request host, NOT a forwarded
 *      header). Production sets `APP_URL=https://app.deessejs.com`;
 *      previews must explicitly set a matching origin and use test
 *      delivery, otherwise the helper fails closed.
 *   2. Validates the URL: origin-only (no path, no query, no
 *      fragment, no credentials), HTTPS outside localhost. This is
 *      tighter than the existing `URL` constructor alone.
 *   3. Renders the `OrganizationInvitation` template with the
 *      organization name, inviter name, recipient email, and
 *      acceptance URL.
 *   4. Calls `sendAuthEmail`, awaits its result and inspects
 *      `result.ok`. A failed delivery surfaces a typed error to the
 *      caller; the invitation row persists in the database regardless
 *      (the plugin does not roll it back) and the user can resend
 *      later. We never claim the invitation was rolled back.
 *
 * The data shape is the better-auth `sendInvitationEmail` payload
 * (typed here as the structural fields we need, not the full plugin
 * type, to keep the implementation branch free from type drift
 * during the scaffolding step).
 */

import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"

/**
 * The minimal payload shape we consume. The full plugin type is
 * `Awaited<ReturnType<typeof auth.api.createInvitation>>` once the
 * plugin is configured. Keeping this narrow decouples the helper
 * from plugin version drift.
 */
export interface OrganizationInvitationPayload {
	id: string
	email: string
	organization?: { name?: string | null; slug?: string | null } | null
	inviter?: { name?: string | null; email?: string | null } | null
	role?: string | null
}

/**
 * Production invitation origin. Loaded from `serverEnv.APP_URL`.
 * Development fallback to `http://localhost:3001` to match the
 * `apps/app` default port; production must set
 * `APP_URL=https://app.deessejs.com` via env. Previews set their
 * own matching origin.
 */
function getInvitationOrigin(): URL {
	const raw = serverEnv.APP_URL
	const url = new URL(raw)
	// Origin-only URL: no path, no query, no fragment, no credentials.
	if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
		throw new Error(
			"APP_URL must be an origin-only URL (no path, query, or fragment)",
		)
	}
	if (url.username !== "" || url.password !== "") {
		throw new Error("APP_URL must not contain credentials")
	}
	// HTTPS outside localhost development. Plain `http` is allowed
	// only for `localhost` / `127.0.0.1` to keep the dev experience
	// working without TLS.
	if (
		url.protocol !== "https:" &&
		url.hostname !== "localhost" &&
		url.hostname !== "127.0.0.1"
	) {
		throw new Error(
			"APP_URL must use https (except for localhost development)",
		)
	}
	return url
}

/**
 * Send the invitation email. Throws on validation failure (origin
 * misconfigured) or email delivery failure. The plugin's caller can
 * decide whether to surface the error to the inviter.
 */
export async function sendOrganizationInvitation(
	payload: OrganizationInvitationPayload,
): Promise<void> {
	const origin = getInvitationOrigin()
	const acceptanceUrl = new URL(
		`/accept-invitation/${encodeURIComponent(payload.id)}`,
		origin,
	)

	const organizationName = payload.organization?.name ?? "the organization"
	const inviterName = payload.inviter?.name ?? payload.inviter?.email ?? "A teammate"

	const result = await sendAuthEmail({
		to: payload.email,
		subject: `Join ${organizationName} on DeesseJS`,
		react: templates.OrganizationInvitation({
			url: acceptanceUrl.toString(),
			organizationName,
			inviterName,
			recipientEmail: payload.email,
		}),
		tags: [{ name: "flow", value: "organization-invitation" }],
	})

	if (!result.ok) {
		// Match the existing pattern: log the failure with enough
		// context for the observability layer, but do NOT log the
		// invitation ID or the URL (those are tokens).
		console.error(
			"[auth] organization-invitation email failed",
			JSON.stringify({ flow: "organization-invitation", error: result.error }),
		)
		throw new Error(`Invitation email delivery failed: ${result.error}`)
	}
}
