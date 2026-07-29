# Resend + React Email

## Decision

**Resend** as the email transport. **React Email v6 unified package** for component-composed email templates. **All email goes through `apps/template/packages/mail/`** — the only sanctioned module that touches `resend.emails.send()`.

- **Decision date:** 2026-06-22 (revised from 2026-06-17 after react-email 6.0 release)
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Resend handles every transactional email:

- **Auth templates** (verify, reset, magic link, OTP × 3) — via Better Auth `send*` hooks wired to `packages/mail`.
- **Billing templates** (receipt, dunning, trial ending) — Stripe webhook → React Email → Resend. (M2+)
- **Notification templates** (activity digests, team changes) — via `packages/notifications` (when implemented).

Marketing templates (newsletters, announcements) are **out of scope** — the buyer uses their own list management (Resend Audiences or a third party like Loops / Beehiiv).

## What we use

### Resend Node.js SDK — `resend@^6.14`

- **HTTP API via `new Resend(apiKey).emails.send({...})`** — see [the SDK reference](../../.claude/agent-memory/tech-lead/reference-resend-sdk-details.md).
- **Webhooks** for bounce / complaint / open / click tracking — M2+ work (see [`../11-packages/mail/M0-deferred-work.md`](../11-packages/mail/M0-deferred-work.md)).
- **Per-domain DKIM/SPF/DMARC** — the buyer verifies their sending domain in the Resend dashboard before production.
- **Idempotency keys** (`idempotencyKey`) — used on every `sendMail()` call to make retries safe (24h window).
- **Rate limit** — 5 req/sec/team by default; request increase for high-volume senders.

### React Email — `react-email@^6.0` (unified package)

- **One import, everything inside.** Since v6.0.0 (2026-04-16), all components AND rendering utilities live in the single `react-email` package — see [the v6 reference](../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md) and [ADR 0013](../10-decisions/0013-react-email-v6-unified-package.md).
- **Component-composed templates.** Emails are React components, versioned in code, type-safe via Zod-derived props.
- **`<Tailwind>` component** for styling (Tailwind 4.1.12 internal — independent of `apps/web` PostCSS pipeline).
- **`resend.emails.send({ react: <Template /> })`** — Resend renders server-side. We don't need to call `render()` ourselves in the happy path.
- **`pretty()` and `toPlainText()` utilities** — exported from `react-email` for the plain-text fallback (M2+).
- **`email dev` CLI** (via `@react-email/ui`) — preview dev server on port 3000 by default. We use `-p 3005` to avoid collision with `apps/web`.
- **Migrating from `@react-email/components`**: just rewrite imports to come from `react-email`. The legacy packages are deprecated.

## Why Resend + React Email (not the alternatives)

| Alternative | Why not |
|---|---|
| **SendGrid** | Older API. Templates are stored in their dashboard, not in our code. |
| **Postmark + MJML** | MJML is good but a different mental model from our React stack. |
| **AWS SES** | Lower-level. We'd build the templates and the send flow ourselves. |
| **Mailgun** | Similar to SendGrid. |
| **Loops** | Great product, but transactional-only niche. |
| **Nodemailer + DIY** | We'd rebuild Resend badly. |
| **`react-mail` / `mailing` / `react-mailkit`** | Not the official Resend package. Community forks, smaller maintenance burden. |
| **`jsx-email`** | Concurrent sérieux with email-client CLI checker. But React 18 only (no React 19), smaller team (1.2k stars vs 19k). |

Resend + React Email wins on:

- **Single ecosystem** — same team builds both. Resend's docs explicitly recommend React Email; React Email's docs explicitly recommend Resend.
- **React Email templates live in our repo**, versioned with our code. The buyer can customize without leaving the codebase.
- **Type-safe props** match our TypeScript stack end-to-end.
- **`<Tailwind>` component** gives us Tailwind DX in emails (with the `pixelBasedPreset` for Outlook `rem` compat).
- **React 19.2 + Next.js 16 officially supported** since React Email 5.0 — matches our `apps/web` versions exactly.
- **Hono officially supported** by Resend — matches our `packages/api` stack.

## Architecture

```
Caller (Better Auth hook | procedure | background job)
  │  void sendMail({ to, template, context, idempotencyKey })
  ▼
packages/mail/src/send.ts
  │ 1. Look up template in registry (mailTemplates)
  │ 2. provider = getMailer()  ← console | resend | noop (lazy singleton)
  │ 3. provider.send({ to, react: <Template {...} />, subject, ... })
  ▼
Resend HTTP API → Recipient
   │
   ├── Delivered
   ├── Bounced     ← webhook (M2+)
   ├── Complained  ← webhook (M2+)
   └── Opened / Clicked  ← webhook (M2+)
```

The provider is selected by env:

- `MAIL_PROVIDER=console` → log-only (dev default when `RESEND_API_KEY` is missing)
- `MAIL_PROVIDER=resend` → Resend SDK (prod)
- `MAIL_PROVIDER=noop` → no-op (unit tests)

If `MAIL_PROVIDER` is unset, auto-detect: `RESEND_API_KEY` present → Resend, else → Console.

## Example template

```tsx
// apps/template/packages/mail/src/templates/reset-password.tsx
import { Button, Heading, Text } from 'react-email'
import { Wrapper } from './Wrapper'

interface ResetPasswordProps {
  url: string
  name: string
  expiresInMinutes: number
}

export function ResetPassword({ url, name, expiresInMinutes }: ResetPasswordProps) {
  return (
    <Wrapper preview="Reset your DeesseJS password">
      <Heading>Hi {name},</Heading>
      <Text>Click the button below to reset your password. The link expires in {expiresInMinutes} minutes.</Text>
      <Button href={url}>Reset password</Button>
    </Wrapper>
  )
}
export default ResetPassword

// apps/template/packages/mail/src/send.ts
import { Resend } from 'resend'
import { mailTemplates } from './registry'

export async function sendMail<T extends keyof typeof mailTemplates>({ to, template, context, idempotencyKey }) {
  const mailer = getMailer()  // console | resend | noop — lazy
  return mailer.send({ to, subject: subjects[template], react: mailTemplates[template](context), idempotencyKey })
}
```

## Constraints

- **All email goes through `packages/mail`.** No direct `resend.emails.send()` calls from feature modules or apps.
- **Templates are React components** in `packages/mail/src/templates/`. No HTML strings inlined.
- **Lazy singleton for the Resend client.** Never `new Resend()` at module top-level — would crash dev/test without `RESEND_API_KEY` set.
- **`void sendMail(...)`** in Better Auth callbacks. Never `await` — see [Better Auth send* hooks wiring](../../.claude/agent-memory/tech-lead/project-better-auth-send-hooks.md). On Vercel, the `hono/vercel` adapter's `waitUntil` covers the gap if the lambda would otherwise exit.
- **Idempotency keys** on every send: `reset:<userId>:<tokenHash>`, `verify:<userId>:<1hBucket>`, `magiclink:<email>:<5minBucket>`, `otp:<email>:<type>:<1minBucket>`.
- **Bounced addresses suppressed** automatically (M2+ — see M0-deferred-work).
- **Per-category unsubscribe** (M2+) — not just global.

## What the buyer can replace

The buyer can swap Resend for any other provider (Postmark, SendGrid, AWS SES, self-hosted SMTP) by:

1. Adding a new file in `packages/mail/src/provider/<theirs>.ts` implementing the `Mailer` interface.
2. Setting `MAIL_PROVIDER=<theirs>` in env.
3. Templates stay — React Email is provider-agnostic.
4. The rest of the app continues to work.

## Preview app — `apps/email-preview` (M2, not v1)

**For M1 (v1):** the dev CLI is sufficient. `pnpm --filter @deessejs/mail dev` starts `email dev -p 3005`, which hot-reloads templates and previews them in a browser. Designers + devs can iterate on the 6 templates without any additional app.

**For M2:** a dedicated Next.js preview app at `apps/template/apps/email-preview/` will exist. It will:

- List all templates with sample data
- Switch between providers (`resend` / `console` / `noop`)
- Deploy to Vercel as a public demo URL (`demo.deessejs.dev/email-preview`) for marketing
- See [`../12-apps/email-preview/`](../12-apps/email-preview/) for the full M2 spec.

**Why deferred (user decision 2026-06-23):** the v1 priority is `packages/mail` working end-to-end with the 4 Better Auth hooks. The preview UI is polish for designers + prospects — not core product. Community consensus (ShipFast, CREA.MBA) is to use just the CLI; only supastarter ships a dedicated preview app, and ours is modeled after theirs.

## Cross-references

### Stack ADRs (system-wide)

- [ADR 0013 — react-email v6 unified package](../10-decisions/0013-react-email-v6-unified-package.md)
- [ADR 0014 — Resend as transport](../10-decisions/0014-resend-as-transport.md)

### Package docs

- [`../11-packages/mail/README.md`](../11-packages/mail/README.md) — the `packages/mail` implementation
- [`../11-packages/mail/integrations.md`](../11-packages/mail/integrations.md) — wiring to Better Auth `send*` hooks
- [`../11-packages/mail/conventions.md`](../11-packages/mail/conventions.md) — template naming, idempotency key format, provider switch
- [`../11-packages/mail/M0-deferred-work.md`](../11-packages/mail/M0-deferred-work.md) — gaps before production

### App docs

- [`../12-apps/email-preview/`](../12-apps/email-preview/) — the Next.js preview app (**M2**, deferred 2026-06-23)

### Reference docs (agent memory)

- [Resend SDK reference](../../.claude/agent-memory/tech-lead/reference-resend-sdk-details.md)
- [React Email v6 unified reference](../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md)
- [supastarter mailing pattern](../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md)
- [Better Auth send* hooks wiring](../../.claude/agent-memory/tech-lead/project-better-auth-send-hooks.md)
