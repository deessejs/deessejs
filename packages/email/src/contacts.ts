import { Resend } from "resend"
import { serverEnv } from "@workspace/env/server"

/**
 * Result of `subscribeToPlaybookUpdates`: discriminated union so callers
 * can branch on success vs failure without throwing. Same shape the mailer
 * returns.
 *
 * `ok: true` covers both "subscribed for the first time" and "already
 * subscribed". Resend's `contacts.create` is idempotent per contact and we
 * do not need to distinguish those two states at the call site.
 *
 * `ok: false` covers three failure modes the call site may want to handle
 * differently:
 *   - `not_configured`: RESEND_PLAYBOOK_TOPIC_ID is unset; skip
 *   - `api_error`: Resend returned an error; the signup procedure
 *     falls back to sending the PDF email without the topic
 *     subscription
 *   - `unexpected`: thrown exception, e.g. network blip
 */
export type SubscribeToPlaybookUpdatesResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "api_error" | "unexpected"; error: string }

/**
 * Subscribe a contact to the Resend Topic that carries the playbook
 * marketing opt-in list.
 *
 * A Topic models a subscription preference, which is what the checkbox on
 * the playbook page actually expresses: "send me occasional updates about
 * DeesseJS". A Segment is for internal ranking and a contact can belong to
 * both, so the Segment is deliberately not touched here.
 *
 * When the topic ID env var is unset, this returns `not_configured` instead
 * of throwing: the playbook signup flow treats the subscription as
 * best-effort (the PDF email still goes out either way; the contact simply
 * will not receive future marketing emails).
 *
 * Implementation notes:
 *   - The Resend SDK is instantiated lazily so that test runs that
 *     never call this helper don't pay the cost of importing + decrypting
 *     the API key.
 *   - The SDK is created per call rather than held as a module-level
 *     singleton; this matches the existing `ResendTransport` pattern
 *     and makes the function straightforward to mock in tests.
 *   - `topics` and `audienceId` are mutually exclusive in the Resend
 *     contacts API, so the payload carries the topic subscription and no
 *     audience. The SDK still exposes `audienceId` as a deprecated
 *     overload; using it here would opt the contact into the old
 *     audience model and drop the per-topic preference.
 *   - `unsubscribed` is left unset on purpose. It is the contact's global
 *     state, distinct from the per-topic subscription: sending
 *     `unsubscribed: false` would override a global unsubscribe for a
 *     contact who had already opted out of every broadcast. Opting into
 *     one topic does not need to re-subscribe them to everything.
 *   - No custom contact properties are sent. Resend only accepts a
 *     value for a property that was declared in the account first, and
 *     a payload naming an undeclared property fails the whole call.
 *     The signup handler treats a failure as best-effort, so the
 *     symptom would be a consent checkbox that reports success while
 *     recording nothing. The Topic subscription already records where
 *     the opt-in came from, since it is the only surface that
 *     subscribes to it. A second signup surface gets its own Topic.
 */
export async function subscribeToPlaybookUpdates(opts: {
  email: string
}): Promise<SubscribeToPlaybookUpdatesResult> {
  const topicId = serverEnv.RESEND_PLAYBOOK_TOPIC_ID
  if (!topicId) {
    // Fail-soft: the playbook signup flow logs and continues without
    // the topic subscription. The contact will not receive future
    // marketing emails until they sign up again.
    return {
      ok: false,
      reason: "not_configured",
      error:
        "RESEND_PLAYBOOK_TOPIC_ID is not set; the topic subscription was skipped. " +
        "The PDF will still be sent but the contact will not receive " +
        "future marketing emails.",
    }
  }

  try {
    const client = new Resend(serverEnv.RESEND_API_KEY ?? "")
    const { error } = await client.contacts.create({
      email: opts.email,
      topics: [{ id: topicId, subscription: "opt_in" }],
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
