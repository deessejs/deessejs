import type { MailerTransport } from "./types.js";
export type { MailerTransport, SendArgs } from "./types.js";
/**
 * Build a MailerTransport from serverEnv.MAIL_TRANSPORT.
 *
 *   "console" (default) → ConsoleTransport — logs to stdout, no infra
 *   "resend"            → ResendTransport  — production
 *
 * The factory is called once at module load; the result is exported as a
 * singleton. Tests can override via `vi.spyOn(mailer, "send")`.
 */
export declare function createMailer(): MailerTransport;
/** Process-wide singleton — import this everywhere instead of createMailer(). */
export declare const mailer: Readonly<MailerTransport>;
//# sourceMappingURL=transport.d.ts.map