import { Resend } from "resend";
export class ResendTransport {
    client;
    from;
    constructor(opts) {
        this.client = new Resend(opts.apiKey);
        this.from = opts.from;
    }
    async send(args) {
        // The Resend SDK returns { data, error } — it does NOT throw on API errors.
        // Wrapping in try/catch is an anti-pattern per the official docs.
        const { data, error } = await this.client.emails.send({
            from: this.from,
            to: args.to,
            subject: args.subject,
            ...(args.html ? { html: args.html } : {}),
            ...(args.text ? { text: args.text } : {}),
            ...(args.react ? { react: args.react } : {}),
            ...(args.replyTo ? { replyTo: args.replyTo } : {}),
            ...(args.tags ? { tags: args.tags } : {}),
            ...(args.idempotencyKey
                ? { headers: { "Idempotency-Key": args.idempotencyKey } }
                : {}),
        });
        if (error)
            return { error: error.message };
        return { id: data.id };
    }
}
