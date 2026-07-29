import { serverEnv } from "@workspace/env/server"
import { ConsoleTransport } from "./transports/console.js"
import { ResendTransport } from "./transports/resend.js"
import type { MailerTransport } from "./types.js"

export type { MailerTransport, SendArgs } from "./types.js"

/**
 * Build a MailerTransport from serverEnv.MAIL_TRANSPORT.
 *
 *   "console" (default) → ConsoleTransport — logs to stdout, no infra
 *   "resend"            → ResendTransport  — production
 *
 * The factory is called once at module load; the result is exported as a
 * singleton. Tests can override via `vi.spyOn(mailer, "send")`.
 */
export function createMailer(): MailerTransport {
  const from = `${serverEnv.RESEND_FROM_NAME} <${serverEnv.RESEND_FROM_EMAIL}>`

  switch (serverEnv.MAIL_TRANSPORT) {
    case "resend":
      return new ResendTransport({
        apiKey: serverEnv.RESEND_API_KEY!,
        from,
      })
    case "console":
    default:
      return new ConsoleTransport({ from })
  }
}

/** Process-wide singleton — import this everywhere instead of createMailer(). */
export const mailer: Readonly<MailerTransport> = createMailer()