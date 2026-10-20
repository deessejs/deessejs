import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { serverEnv } from "@workspace/env/server"
import { mailer, subscribeToPlaybookUpdates, templates } from "@workspace/email"
import { base } from "../base.js"
import { logger } from "../../constants/logger.js"
import {
  checkEmailDedup,
  checkIpLimit,
  clientIp,
} from "../middleware/rate-limit.js"

const signupInput = z.object({
  email: z.string().email(),
  consentMarketing: z.boolean().optional().default(false),
})

/**
 * Public procedure: subscribe to the playbook lead magnet.
 *
 * Pipeline (each gate runs in order; cheaper failures short-circuit):
 *
 *   1. Zod validate                   { email, consentMarketing }
 *   2. IP rate limit                  (5 per 60s, per Vercel instance)
 *   3. Email dedup                    (1 per 60s, accidental double-submits)
 *   4. If consentMarketing            subscribe the contact to the
 *      Resend Topic (subscription failure is soft-skipped: the PDF
 *      still goes out)
 *   5. Send PDF email via mailer
 *   6. Return { ok: true }
 *
 * Errors are mapped to typed wire-codes via ORPCError so the client
 * branches on a discriminant instead of parsing prose:
 *
 *   - RATE_LIMITED         429: client should back off
 *   - DUPLICATE_SIGNUP     409: same email resent within 60s
 *   - EMAIL_SEND_FAILED    502: mailer rejected the send
 *
 * Privacy / GDPR notes:
 *   - The PDF email always goes out, regardless of consent. PDF
 *     delivery is the requested service. Withholding it for
 *     non-consent would conflate two distinct purposes and break
 *     the brief's exchange-of-value contract.
 *   - Future marketing emails go only to contacts subscribed to the
 *     Resend Topic, which gives every broadcast a Resend-managed
 *     List-Unsubscribe header. The topic subscription is
 *     best-effort: a network blip does not block the PDF send, only
 *     the marketing opt-in record. Fail-open for the lead-magnet
 *     experience.
 *   - "Audit trail" for consent is delegated to Resend (the contact's
 *     topic subscription with `subscription: "opt_in"` is the
 *     canonical record). The DB has no copy of the email in v0.1,
 *     deliberate scope cut. A future `playbook_signups` table is the
 *     v0.2 upgrade.
 */
export const signup = base
  .input(signupInput)
  .errors({
    RATE_LIMITED: {
      message:
        "You've sent a few signups recently. Please wait a minute and try again.",
    },
    DUPLICATE_SIGNUP: {
      message:
        "We just sent you the PDF. If you can't find it, check spam or wait a minute and try again.",
    },
    EMAIL_SEND_FAILED: {
      message:
        "Couldn't send the email right now. Please try again in a few minutes.",
    },
  })
  .handler(async ({ input, context }) => {
    const requestId = context.requestId
    const ip = clientIp(context.headers)

    // 2. IP rate limit
    const ipVerdict = checkIpLimit(ip)
    if (!ipVerdict.allowed) {
      logger.warn("playbook_rate_limited", {
        requestId,
        ip,
        resetSeconds: ipVerdict.resetSeconds,
      })
      throw new ORPCError("RATE_LIMITED", {
        status: 429,
        data: { retryAfterSeconds: ipVerdict.resetSeconds },
      })
    }

    // 3. Email dedup
    const dedupVerdict = checkEmailDedup(input.email)
    if (!dedupVerdict.allowed) {
      logger.info("playbook_duplicate_signup", {
        requestId,
        emailDomain: input.email.split("@")[1] ?? "(unknown)",
      })
      throw new ORPCError("DUPLICATE_SIGNUP", { status: 409 })
    }

    // 4. Topic subscription: best-effort, never blocks the PDF.
    if (input.consentMarketing) {
      const topicResult = await subscribeToPlaybookUpdates({
        email: input.email,
        source: "playbook-page",
      })
      if (!topicResult.ok) {
        // Soft-skip: log and continue. The user still gets the
        // PDF; they simply will not receive future marketing
        // emails until they sign up again (or the team
        // backfills from Resend's audit trail).
        logger.warn("playbook_topic_subscribe_skipped", {
          requestId,
          reason: topicResult.reason,
          detail: topicResult.error,
        })
      }
    }

    // 5. Send the PDF email.
    //
    // PDF URL is built from `WEB_URL` (the canonical marketing
    // host). Missing env throws at startup: there is no silent
    // fallback that would produce a broken link. `new URL()`
    // does the trailing-slash normalization so callers do not
    // have to think about it.
    const pdfUrl = new URL("/playbook.pdf", serverEnv.WEB_URL).toString()

    const sendResult = await mailer.send({
      to: input.email,
      subject: "Your playbook from DeesseJS",
      react: templates.PlaybookDownload({
        pdfUrl,
        consentMarketing: input.consentMarketing,
      }),
      tags: [{ name: "playbook", value: "v0.1" }],
    })

    if ("error" in sendResult) {
      logger.error("playbook_email_send_failed", {
        requestId,
        error: sendResult.error,
      })
      throw new ORPCError("EMAIL_SEND_FAILED", { status: 502 })
    }

    return { ok: true as const }
  })

export const playbookRouter = {
  signup,
}
