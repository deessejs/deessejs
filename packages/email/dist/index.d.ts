import { mailer } from "./transport.js";
import { VerifyEmail } from "./templates/verify-email.js";
import { ResetPassword } from "./templates/reset-password.js";
import type { MailerTransport, SendArgs } from "./types.js";
export { mailer, type MailerTransport, type SendArgs };
/**
 * Result of `sendAuthEmail` — discriminated union so callers can branch on
 * success vs failure without inspecting the underlying transport's shape.
 */
export type SendEmailResult = {
    ok: true;
} | {
    ok: false;
    error: string;
};
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
export declare function sendAuthEmail(opts: {
    to: string;
    subject: string;
    react: React.ReactNode;
    tags?: Array<{
        name: string;
        value: string;
    }>;
    idempotencyKey?: string;
}): Promise<SendEmailResult>;
/**
 * Re-export the templates under a `templates` namespace for ergonomic imports
 * from packages/auth:
 *
 *   import { sendAuthEmail, templates } from "@workspace/email"
 *   templates.VerifyEmail({ url, userEmail: user.email })
 */
export declare const templates: {
    VerifyEmail: typeof VerifyEmail;
    ResetPassword: typeof ResetPassword;
};
//# sourceMappingURL=index.d.ts.map