# 0014. Resend as the only sanctioned email transport

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** founder, tech lead
- **Scope:** transport choice for `packages/mail`, applies to all auth + billing + transactional emails

## Context and problem statement

`packages/mail` needs a transport. The auth package's 4 `send*` hooks (resetPassword, verifyEmail, magicLink, OTP × 3) currently `console.log` — they need a real send target. Billing webhooks (M2+) will need the same. Every consumer of `packages/mail.sendMail(...)` should hit the same transport, and that transport should be swappable per buyer (the buyer might want Postmark, SendGrid, AWS SES, or self-hosted SMTP).

Two questions to answer:

1. **What transport do we ship in the template?** (The default before the buyer customizes.)
2. **What's the swappable interface?** (So the buyer can replace it.)

The first question is what this ADR answers. The second is documented in `11-packages/mail/conventions.md` (provider switch).

## Considered options

1. **Resend** — `resend@^6.14` Node SDK, Hono officially supported, React Email's recommended partner.
2. **Postmark** — strong deliverability, MJML-style templates, no React Email integration story.
3. **SendGrid** — older API, dashboard-stored templates (not in our code).
4. **AWS SES** — lower-level, we'd build the send flow ourselves.
5. **Mailgun** — similar to SendGrid, dashboard-stored templates.
6. **Nodemailer + SMTP** — vendor-agnostic but no React components, no preview dev server.
7. **Multi-transport wrapper** — abstract interface with N adapters. (Rejected: premature.)

## Decision

**Option 1: Resend as the default transport.** All `packages/mail` example code, dev defaults, and documentation assume Resend. The provider is swappable (per buyer) via the `MAIL_PROVIDER` env var, but Resend is the canonical choice in the template.

Rationale:
- **Same team as React Email** — first-class integration story. Resend's docs recommend React Email; React Email's docs recommend Resend.
- **React 19.2 + Next.js 16 support** since React Email 5.0 (matches `apps/web` versions exactly).
- **Hono officially supported** by Resend — matches `packages/api`.
- **`resend.emails.send({ react: <Template /> })`** — Resend renders React components server-side, eliminating the need for us to call `render()` ourselves in the happy path.
- **Idempotency keys** built-in (24h window) — solves the "duplicate send on retry" problem.
- **5 req/sec/team default rate limit** — fine for the 4 auth hooks, request increase for higher volume.

We explicitly reject:
- **Option 7 (multi-transport wrapper)**: premature abstraction. There is one transport in the template; the buyer adds their own transport file when they swap. No driver interface to design up front.
- **Option 6 (Nodemailer)**: works everywhere but loses the React Email DX. The buyer who wants SMTP writes their own `provider/smtp.ts`.
- **Options 2-5**: each has real strengths but none has the React Email integration. Adopting them means writing our own React→HTML renderer, which is what React Email already does.

## Consequences

**Positive:**
- Single ecosystem, single mental model. Template authors don't need to learn a new tool.
- Hono integration is one line: `new Resend(apiKey)` then `resend.emails.send(...)`.
- Idempotency, retries, dev sandbox mode, webhooks (M2+) all built-in.
- `email dev` CLI (port 3005) is the preview tool — no extra infra.

**Negative:**
- Vendor lock-in for the template's default. Mitigated by the swappable provider interface.
- 5 req/sec rate limit on the default plan — high-volume senders need to request an increase.
- Resend is a third-party dependency that can have outages. No documented mitigation beyond standard retry/backoff at our layer.

**Neutral:**
- Resend domain verification is required before production. Buyers add this to their onboarding checklist.

## Why we might revisit

If Resend's pricing changes dramatically, or if a competitor ships an equivalent React Email integration with materially better deliverability, we'd reopen this. The provider switch in `packages/mail/provider/` makes the swap a 1-file change per buyer.

## References

- [ADR 0013 — react-email v6 unified package](./0013-react-email-v6-unified-package.md) — the companion template-engine decision
- [`../01-stack/resend-react-email.md`](../01-stack/resend-react-email.md) — updated 2026-06-22
- [`../11-packages/mail/conventions.md`](../11-packages/mail/conventions.md) — the `MAIL_PROVIDER` switch + provider interface
- [`../11-packages/mail/M0-deferred-work.md`](../11-packages/mail/M0-deferred-work.md) — Resend webhooks (bounce/complaint/opens) deferred to M2
- [Agent memory: Resend SDK reference](../../.claude/agent-memory/tech-lead/reference-resend-sdk-details.md)
- [Agent memory: supastarter mailing pattern](../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md)
