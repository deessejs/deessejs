import type { OrganizationOptions } from "better-auth/plugins/organization"
import { serverEnv } from "@workspace/env/server"
import { sendOrganizationInvitationEmail } from "@workspace/email"

type SendInvitationData = Parameters<
  NonNullable<OrganizationOptions["sendInvitationEmail"]>
>[0]

/**
 * Typed error thrown by `dispatchInvitationEmail` to signal a
 * specific failure category to the Better Auth callback
 * (`sendInvitationEmail`). The `kind` field carries the
 * `error_reason` taxonomy, and the callback is the only place that
 * emits structured logs. The `cause` field preserves the underlying
 * error for debugging.
 *
 * The taxonomy has one value per thing that can go wrong:
 *
 * - `config_invalid`: the invitation id or `APP_URL` is unusable. A
 *   deployment mistake, so it should page someone rather than be
 *   retried.
 * - `smtp_failed`: the transport accepted the message and reported a
 *   failure. This is the path a real outage takes, because
 *   `sendAuthEmail` converts every transport error, thrown or
 *   returned, into `{ ok: false }` rather than rejecting.
 *
 * Anything else reaches the callback untyped and is filed under
 * `dispatch_rejected`: an unexpected runtime error in code that is not
 * supposed to fail.
 */
export class InvitationError extends Error {
  constructor(
    public readonly kind: "config_invalid" | "smtp_failed",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message)
    this.name = "InvitationError"
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

/**
 * Internal implementation of the invitation dispatch. Resolves when
 * the message is accepted by the transport, or throws a typed
 * `InvitationError` on a configuration or transport failure. The
 * Better Auth callback (`sendInvitationEmail`) awaits it and absorbs
 * the failure; tests await it directly to make assertions
 * deterministic.
 *
 * This layer owns only what is specific to a Better Auth
 * invitation: the opaque id, the origin policy on `APP_URL`, and the
 * link it builds. The message itself — subject line, React tree,
 * provider tags — is composed by `sendOrganizationInvitationEmail` in
 * `@workspace/email`, which is where every other transactional email
 * is built too.
 *
 * `dispatchInvitationEmail` does **not** call `console.error`; the
 * single point of structured logging is `sendInvitationEmail`. This
 * avoids the double-log problem (one log from the dispatch path, one
 * from the catch-all in the callback) that would otherwise contradict
 * the "at most one log per invitation" contract.
 */
export async function dispatchInvitationEmail(
  data: SendInvitationData,
): Promise<void> {
  // 1. Validate opaque id.
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new InvitationError("config_invalid", "Invitation id is missing")
  }

  // 2. Validate origin — origin-only, no path/query/fragment/
  //    credentials. The contract is "reject" not "normalize": any
  //    non-origin component is a configuration error. We do not rely
  //    on `URL#origin` to silently discard these components.
  //
  //    On any `config_invalid` failure, throw a typed
  //    `InvitationError`. The callback catches it and emits the
  //    structured log.
  let parsed: URL
  try {
    parsed = new URL(serverEnv.APP_URL)
    if (parsed.username !== "" || parsed.password !== "") {
      throw new InvitationError(
        "config_invalid",
        "APP_URL must not include credentials",
      )
    }
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      throw new InvitationError(
        "config_invalid",
        "APP_URL must be origin-only (no path)",
      )
    }
    if (parsed.search !== "") {
      throw new InvitationError(
        "config_invalid",
        "APP_URL must be origin-only (no query string)",
      )
    }
    if (parsed.hash !== "") {
      throw new InvitationError(
        "config_invalid",
        "APP_URL must be origin-only (no fragment)",
      )
    }
    // Protocol rule: HTTPS everywhere, except HTTP on loopback
    // hosts in development. The exception is narrow on purpose —
    // it tolerates the local dev server, not arbitrary non-HTTP
    // schemes on a public host. `ftp://localhost` is rejected.
    // `http://example.com` is rejected. `https://localhost` is
    // accepted (the protocol takes priority over the host when
    // the host is a loopback).
    const isLoopback =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    if (
      parsed.protocol !== "https:" &&
      !(parsed.protocol === "http:" && isLoopback)
    ) {
      throw new InvitationError(
        "config_invalid",
        "APP_URL must be HTTPS (HTTP only on localhost or 127.0.0.1)",
      )
    }
  } catch (error) {
    if (error instanceof InvitationError) throw error
    throw new InvitationError("config_invalid", "APP_URL is not a valid URL")
  }

  // 3. Build the link on the validated origin.
  const origin = `${parsed.protocol}//${parsed.host}`
  const link = new URL(
    "/accept-invitation/" + encodeURIComponent(data.id),
    origin,
  ).toString()

  // 4. Send. `sendAuthEmail` never rejects: it reports every
  //    transport failure as `{ ok: false, error }`. A rejection from
  //    here therefore means something other than the transport went
  //    wrong, so it is deliberately left untyped and surfaces as
  //    `dispatch_rejected` in the callback.
  const result = await sendOrganizationInvitationEmail({
    to: data.email,
    url: link,
    organizationName: data.organization.name,
    // Better Auth's `user.name` is nullable, and the template has to
    // render something. An account with no display name still
    // produced a deliberate invitation, so the email is not dropped
    // for want of a name.
    inviterName: data.inviter.user.name ?? "Someone",
    expiresAt: data.invitation.expiresAt,
  })

  if (!result.ok) {
    throw new InvitationError("smtp_failed", result.error)
  }
}

/**
 * Read a field for the structured log without ever throwing.
 *
 * The log is the last line of defence for this flow: if the failure
 * handler itself throws, the promise rejects with nothing observing
 * it and the invitation disappears with no trace. Some of the fields
 * are read off a value the handler has already proven to be
 * malformed, so the read cannot be trusted.
 */
function logField(read: () => unknown): string {
  try {
    const value = read()
    return typeof value === "string" ? value : "unknown"
  } catch {
    return "unknown"
  }
}

/**
 * The Better Auth callback. Signature is fixed by the plugin:
 * `Promise<void>`.
 *
 * It awaits the dispatch. That puts the SMTP round trip on the
 * latency of the invitation request, which is also what Better Auth
 * does by default: `runInBackgroundOrAwait` awaits the callback
 * unless `advanced.backgroundTasks.handler` is configured. If the
 * latency ever shows up in the numbers, that handler (a `waitUntil`
 * on Vercel) is the switch, and it needs no change here.
 *
 * Nothing propagates to the caller. Every failure is caught here,
 * logged once, and turned into a resolved promise, so a transport
 * problem can never fail the request that created the invitation.
 * The `catch` inspects `error.kind` to choose the `error_reason`;
 * any other error is filed under `dispatch_rejected`.
 *
 * This callback is the **single point of structured logging** for
 * the invitation flow: at most one log per failed invitation, with
 * the `error_reason` chosen from a three-value taxonomy
 * (`config_invalid`, `smtp_failed`, `dispatch_rejected`).
 */
export async function sendInvitationEmail(
  data: SendInvitationData,
): Promise<void> {
  try {
    await dispatchInvitationEmail(data)
  } catch (error: unknown) {
    let errorReason: "config_invalid" | "smtp_failed" | "dispatch_rejected"
    let errorMessage: string
    if (error instanceof InvitationError) {
      errorReason = error.kind
      errorMessage = error.message
    } else {
      errorReason = "dispatch_rejected"
      errorMessage = error instanceof Error ? error.message : String(error)
    }
    console.error(
      "[auth] organization-invitation failed",
      JSON.stringify({
        recipient_email: logField(() => data.email),
        inviter_user_id: logField(() => data.inviter.user.id),
        organization_id: logField(() => data.organization.id),
        error_reason: errorReason,
        error: errorMessage,
      }),
    )
  }
}