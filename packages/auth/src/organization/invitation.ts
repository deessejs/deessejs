import type { OrganizationOptions } from "better-auth/plugins/organization"
import * as React from "react"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail } from "@workspace/email"

type SendInvitationData = Parameters<
  NonNullable<OrganizationOptions["sendInvitationEmail"]>
>[0]

/**
 * Typed error thrown by `dispatchInvitationEmail` to signal a
 * specific failure category to the Better Auth callback
 * (`sendInvitationEmail`). The `kind` field carries the
 * `error_reason` taxonomy, and the callback is the only place that
 * emits structured logs — this guarantees at most one log per
 * invitation. The `cause` field preserves the underlying error for
 * debugging.
 */
export class InvitationError extends Error {
  constructor(
    public readonly kind: "config_invalid" | "smtp_threw",
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
 * Internal implementation of the invitation dispatch. Resolves
 * when the SMTP call settles (success or `ok: false`), or throws a
 * typed `InvitationError` on configuration or transport errors.
 * The Better Auth callback (`sendInvitationEmail`) awaits it and
 * absorbs the failure. Tests await it directly to make assertions
 * deterministic.
 *
 * `dispatchInvitationEmail` does **not** call `console.error`; the
 * single point of structured logging is `sendInvitationEmail`. This
 * avoids the double-log problem (one log from the dispatch path,
 * one from the catch-all in the callback) that would otherwise
 * contradict the "at most one log per invitation" contract.
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

  // 3. Build the URL on the validated origin.
  const origin = `${parsed.protocol}//${parsed.host}`
  const link = new URL(
    "/accept-invitation/" + encodeURIComponent(data.id),
    origin,
  ).toString()

  // 4. Build the payload, then send. The payload is assembled
  //    **outside** the transport `try`/`catch` on purpose: the
  //    `smtp_threw` bucket means "the transport failed", so a
  //    programming error while reading `data` must not be filed
  //    under it. Letting it escape untyped is what routes it to
  //    `dispatch_rejected`, which is the bucket that means exactly
  //    that.
  //
  //    The placeholder React body is replaced by a call to
  //    `templates.OrganizationInvitation(...)` in a downstream
  //    increment, which owns the React Email template. The
  //    structured log fields and the `error_reason` taxonomy stay
  //    identical.
  const payload = {
    to: data.email,
    subject: `Invitation to join ${data.organization.name}`,
    react: React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        null,
        `You have been invited to join ${data.organization.name} on DeesseJS.`,
      ),
      React.createElement(
        "p",
        null,
        React.createElement("a", { href: link }, "Accept the invitation"),
      ),
      React.createElement(
        "p",
        null,
        `This invitation expires on ${data.invitation.expiresAt.toISOString()}.`,
      ),
    ),
    tags: [{ name: "flow", value: "organization-invitation" }],
  }

  let result: { ok: true } | { ok: false; error: string }
  try {
    result = await sendAuthEmail(payload)
  } catch (error) {
    throw new InvitationError(
      "smtp_threw",
      error instanceof Error ? error.message : String(error),
      { cause: error },
    )
  }

  // 5. Resolved transport: `ok: false` is an SMTP-level failure.
  //    We resolve (no throw, no log here): the callback does not see
  //    a rejection on this path, and the mailer has its own logs. A
  //    later increment that wants `ok: false` in the platform's logs
  //    can throw a typed error from here; the callback's catch picks
  //    up any `InvitationError` without changing.
  if (!result.ok) {
    return
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
 * latency of the invitation request, which is the trade this version
 * makes deliberately: the alternative, a detached promise, needs a
 * post-response scheduler to survive a serverless freeze, and that
 * machinery is more complexity than the latency is worth at this
 * stage. If the latency ever shows up in the numbers, the fix is to
 * reintroduce the scheduler behind this same signature, which stays
 * `Promise<void>` either way.
 *
 * Nothing propagates to the caller. Every failure is caught here,
 * logged once, and turned into a resolved promise, so a transport
 * problem can never fail the request that created the invitation.
 * The `.catch` inspects `error.kind` to choose the `error_reason`;
 * for any other unexpected runtime error, the bucket is
 * `dispatch_rejected`.
 *
 * This callback is the **single point of structured logging** for
 * the invitation flow: at most one log per failed invitation, with
 * the `error_reason` chosen from a three-value taxonomy
 * (`config_invalid`, `smtp_threw`, `dispatch_rejected`).
 */
export async function sendInvitationEmail(
  data: SendInvitationData,
): Promise<void> {
  try {
    await dispatchInvitationEmail(data)
  } catch (error: unknown) {
    let errorReason: "config_invalid" | "smtp_threw" | "dispatch_rejected"
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
