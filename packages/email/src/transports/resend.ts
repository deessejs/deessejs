import { Resend } from "resend"
import type { MailerTransport, SendArgs } from "../types.js"

export class ResendTransport implements MailerTransport {
  private readonly client: Resend
  private readonly from: string

  constructor(opts: { apiKey: string; from: string }) {
    this.client = new Resend(opts.apiKey)
    this.from = opts.from
  }

  async send(args: SendArgs): Promise<{ id: string } | { error: string }> {
    // The Resend SDK returns { data, error } — it does NOT throw on API errors.
    // Wrapping in try/catch is an anti-pattern per the official docs.
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: args.to,
      subject: args.subject,
      ...(args.html ? { html: args.html } : {}),
      ...(args.text ? { text: args.text } : {}),
      ...(args.react ? { react: args.react as React.ReactElement } : {}),
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
      ...(args.tags ? { tags: args.tags } : {}),
      ...(args.idempotencyKey
        ? { headers: { "Idempotency-Key": args.idempotencyKey } }
        : {}),
    })

    if (error) return { error: error.message }
    return { id: data!.id }
  }
}