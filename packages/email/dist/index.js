import { mailer } from "./transport.js";
import { VerifyEmail } from "./templates/verify-email.js";
import { ResetPassword } from "./templates/reset-password.js";
export { mailer };
/**
 * Send a transactional email. Returns a discriminated union instead of
 * `Promise<void>` so the caller can react to failures (Better Auth's
 * "Avoid awaiting the email sending to prevent timing attacks" guidance
 * applies to the response latency, not to error observability — the
 * caller can `void sendAuthEmail(...).then(result => ...)`).
 *
 * The DEBUG log is dropped in production to avoid leaking user PII
 * (subject lines often contain the recipient's email) into stdout.
 */
export async function sendAuthEmail(opts) {
    if (process.env.NODE_ENV !== "production") {
        console.log("[DEBUG] sendAuthEmail() called — subject:", opts.subject);
    }
    try {
        const result = await mailer.send({
            to: opts.to,
            subject: opts.subject,
            react: opts.react,
            ...(opts.tags ? { tags: opts.tags } : {}),
            ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
        });
        // ResendTransport returns `{ data, error }`; ConsoleTransport returns
        // the data directly. Normalize to the discriminated union.
        if (result && typeof result === "object" && "error" in result && result.error) {
            return { ok: false, error: String(result.error) };
        }
        return { ok: true };
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}
/**
 * Re-export the templates under a `templates` namespace for ergonomic imports
 * from packages/auth:
 *
 *   import { sendAuthEmail, templates } from "@workspace/email"
 *   templates.VerifyEmail({ url, userEmail: user.email })
 */
export const templates = {
    VerifyEmail,
    ResetPassword,
};
