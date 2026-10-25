import { Resend } from "resend"
import { findInvalidTag } from "../tags.js"
import type { MailerTransport, SendArgs } from "../types.js"

export class ResendTransport implements MailerTransport {
  private readonly client: Resend
  private readonly from: string

  constructor(opts: { apiKey: string; from: string }) {
    this.client = new Resend(opts.apiKey)
    this.from = opts.from
  }

  async send(args: SendArgs): Promise<{ id: string } | { error: string }> {
    // A tag the API would reject fails the whole send with a 422 that
    // names a field index and nothing else. Catching it here turns
    // that into a message that names the tag.
    const invalidTag = findInvalidTag(args.tags)
    if (invalidTag) {
      return {
        error:
          `Invalid Resend tag at index ${invalidTag.index}: a tag name and ` +
          `value may only contain ASCII letters, numbers, underscores or ` +
          `dashes (got "${invalidTag.name}"="${invalidTag.value}").`,
      }
    }

    // The Resend SDK returns { data, error }: it does NOT throw on API errors.
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