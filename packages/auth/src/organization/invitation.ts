import { APIError } from "better-auth/api"
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
 * The Better Auth callback (`sendInvitationEmail`) wraps this
 * function with `waitUntil` on Vercel or a `.catch`'d detached
 * Promise elsewhere. Tests and the probe `await` the returned
 * Promise directly to make assertions deterministic.
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

  // 4. Send the email. The placeholder React body is replaced by
  //    a call to `templates.OrganizationInvitation(...)` in a
  //    downstream PR (PR-6, which owns the React Email template).
  //    The structured log fields and the `error_reason` taxonomy
  //    stay identical.
  //
  // TODO(PR-6): replace this placeholder body with the React Email
  // template `templates.OrganizationInvitation({ url: link, ... })`.
  let result: { ok: true } | { ok: false; error: string }
  try {
    result = await sendAuthEmail({
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
    })
  } catch (error) {
    throw new InvitationError(
      "smtp_threw",
      error instanceof Error ? error.message : String(error),
      { cause: error },
    )
  }

  // 5. Resolved transport: `ok: false` is an SMTP-level failure.
  //    We resolve (no throw, no log here) — the callback does not
  //    see a rejection on this path. PR-2 deliberately does not add
  //    a fourth log line for this case; the mailer has its own
  //    logs. A future increment that wants to surface `ok: false`
  //    in the platform's logs can throw
  //    `InvitationError("smtp_failed", ...)` from here without
  //    changing the catch in `sendInvitationEmail`.
  if (!result.ok) {
    return
  }
}

/**
 * The Better Auth callback. Signature is fixed by the plugin:
 * `Promise<void>`. Resolves immediately after dispatching the
 * work. The internal dispatch is wrapped in `safeDispatch` whose
 * `.catch` is attached before the Promise is detached, so no
 * rejection ever produces an unhandled-rejection event. The
 * `.catch` inspects `error.kind` to choose the `error_reason`; for
 * any other unexpected runtime error, the bucket is
 * `dispatch_rejected`.
 *
 * This callback is the **single point of structured logging** for
 * the invitation flow: at most one log per failed invitation, with
 * the `error_reason` chosen from a three-value taxonomy
 * (`config_invalid`, `smtp_threw`, `dispatch_rejected`). A future
 * Vercel deployment can wrap the detached Promise in
 * `waitUntil` from `@vercel/functions` to keep the serverless
 * function alive; the contract here is the long-lived-Node
 * baseline (detached Promise with explicit `.catch`).
 */
export function sendInvitationEmail(data: SendInvitationData): Promise<void> {
  const safeDispatch = dispatchInvitationEmail(data).catch(
    (error: unknown) => {
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
          recipient_email: data.email,
          inviter_user_id: data.inviter.user.id,
          organization_id: data.organization.id,
          error_reason: errorReason,
          error: errorMessage,
        }),
      )
    },
  )
  void safeDispatch
  return Promise.resolve()
}
