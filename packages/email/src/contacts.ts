import { Resend } from "resend"
import { serverEnv } from "@workspace/env/server"

/**
 * Result of `addToAudience` — discriminated union so callers can branch on
 * success vs failure without throwing. Same shape the mailer returns.
 *
 * `ok: true` covers both "added for the first time" and "already a
 * contact" — Resend's `contacts.create` is idempotent per `(audience, email)`
 * and we do not need to distinguish those two states at the call site.
 *
 * `ok: false` covers three failure modes the call site may want to handle
 * differently:
 *   - `not_configured` — RESEND_PLAYBOOK_AUDIENCE_ID is unset; skip
 *   - `api_error`      — Resend returned an error; the playbook signup
 *                        procedure falls back to sending the PDF email
 *                        without audience membership
 *   - `unexpected`     — thrown exception, e.g. network blip
 */
export type AddToAudienceResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "api_error" | "unexpected"; error: string }

/**
 * Add a contact to the Resend Audience that holds the marketing-opt-in
 * list for the playbook page.
 *
 * When the audience ID env var is unset, this returns `not_configured`
 * instead of throwing — the playbook signup flow treats audience
 * enrollment as best-effort (the PDF email still goes out either way;
 * the contact simply will not receive future marketing emails).
 *
 * Implementation notes:
 *   - The Resend SDK is instantiated lazily so that test runs that
 *     never call this helper don't pay the cost of importing + decrypting
 *     the API key.
 *   - The SDK is created per call rather than held as a module-level
 *     singleton; this matches the existing `ResendTransport` pattern
 *     and makes the function straightforward to mock in tests.
 *   - Resend's `contacts.create` requires an unsubscribed=false on
 *     first add (default behavior). Future emails sent through this
 *     audience carry the auto-generated `List-Unsubscribe` header,
 *     satisfying CNIL's "consent must be revocable" requirement.
 *   - When the SDK supports a richer `metadata` field on contacts,
 *     `source` will land as a first-class metadata tag. For now, the
 *     source is dropped because no public SDK API binds custom
 *     metadata to a contact (Resend contact fields are fixed
 *     `firstName`/`lastName`/`unsubscribed`). A TODO flags this gap;
 *     see the v0.2 milestone.
 */
export async function addToAudience(opts: {
  email: string
  source: string
}): Promise<AddToAudienceResult> {
  const audienceId = serverEnv.RESEND_PLAYBOOK_AUDIENCE_ID
  if (!audienceId) {
    // Fail-soft: the playbook signup flow logs and continues
    // without audience enrollment. The contact will not receive
    // future marketing emails until they sign up again.
    return {
      ok: false,
      reason: "not_configured",
      error:
        "RESEND_PLAYBOOK_AUDIENCE_ID is not set; contact add was skipped " +
        "— the PDF will still be sent but the contact will not receive " +
        "future marketing emails.",
    }
  }

  try {
    const client = new Resend(serverEnv.RESEND_API_KEY ?? "")
    const { error } = await client.contacts.create({
      email: opts.email,
      audienceId,
      unsubscribed: false,
    })
    if (error) {
      return { ok: false, reason: "api_error", error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      reason: "unexpected",
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
