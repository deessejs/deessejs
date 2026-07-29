# `packages/mail`

The transactional mail package. Owns every email the DeesseJS template sends — auth (reset password, verify email, magic link, OTP), billing (M2+), and operational notifications (M2+). All sends go through this package; no other module imports `resend` directly.

> **Version note.** Built on `react-email@^6.0` (unified package) and `resend@^6.14`. See [`../../10-decisions/0013-react-email-v6-unified-package.md`](../../10-decisions/0013-react-email-v6-unified-package.md) and [`../../10-decisions/0014-resend-as-transport.md`](../../10-decisions/0014-resend-as-transport.md) for the choices. The transport is swappable per buyer via the `MAIL_PROVIDER` env var.

## Purpose

Provide a single, well-typed mail layer that:

- **Owns the Resend client lifecycle** — lazy singleton, never crashes dev/test without env.
- **Owns the React Email template registry** — typed `sendMail<T>({template: T, context})` calls with autocomplete on `context`.
- **Switches transport at runtime** via `MAIL_PROVIDER` — `resend` (prod), `console` (dev default), `noop` (unit tests).
- **Wires to Better Auth `send*` hooks** so password reset, email verification, magic link, and OTP actually send.
- **Provides the `<Wrapper>` shared layout** — every template inherits the brand chrome in one place.

## Surface

Public exports from `packages/mail/src/index.ts`:

| Export | Purpose |
|---|---|
| `sendMail` | `sendMail<T extends MailTemplateId>(input: SendMailInput<T>): Promise<SendMailResult>` — the single function callers use |
| `mailTemplates` | The registry mapping `MailTemplateId` → React component |
| `MailTemplateId` | The string union of all known template IDs (`resetPassword`, `verifyEmail`, `magicLink`, `otp-sign-in`, `otp-email-verification`, `otp-forgot-password`) |
| `BaseMailProps` | The common props every template receives (`preview?: string`) |
| `Mailer` (type) | The provider interface — `console`, `resend`, `noop`, or any custom one |
| `getMailer` | Returns the active `Mailer` instance based on `MAIL_PROVIDER` env |

`packages/mail` does **not** import from `apps/*` or from `packages/api`. The dependency direction is `apps → packages`, never the reverse.

## Internal structure

```
packages/mail/
├── src/
│   ├── index.ts                 # public surface
│   ├── config.ts                # from address, replyTo, brand name (NOT secret)
│   ├── env.ts                   # zod schema: RESEND_API_KEY, MAIL_FROM, MAIL_REPLY_TO, MAIL_PROVIDER
│   ├── client.ts                # lazy singletons: getResendClient, getConsoleClient, getNoopClient
│   ├── provider/
│   │   ├── index.ts             # getMailer() switch
│   │   ├── types.ts             # Mailer interface, MailerSendInput
│   │   ├── resend.ts            # ResendMailer
│   │   ├── console.ts           # ConsoleMailer (dev fallback)
│   │   └── noop.ts              # NoopMailer (unit tests)
│   ├── render.ts                # renderHtml(), renderText() — pure utilities
│   ├── send.ts                  # sendMail() — registry lookup + provider dispatch + idempotency
│   ├── registry.ts              # mailTemplates map
│   ├── types.ts                 # SendMailInput, MailTemplateId, BaseMailProps, SendMailResult
│   └── templates/
│       ├── Wrapper.tsx          # shared <Html><Head><Tailwind><Container>... shell
│       ├── components/
│       │   └── PrimaryButton.tsx
│       ├── reset-password.tsx
│       ├── verify-email.tsx
│       ├── magic-link.tsx
│       ├── otp-sign-in.tsx
│       ├── otp-email-verification.tsx
│       └── otp-forgot-password.tsx
└── tests/
    ├── send.test.ts             # sendMail() with each provider — assert called with right args
    ├── registry.test.ts         # every MailTemplateId is in the registry and has PreviewProps
    ├── render.test.ts           # render → non-empty html + valid plain text
    └── templates.test.ts        # snapshot per template
```

See [`structure.md`](./structure.md) for the file-by-file contract.

## The 6 templates shipped in v1

| Template ID | Better Auth hook (line) | Triggered by |
|---|---|---|
| `resetPassword` | `emailAndPassword.sendResetPassword` (`auth.ts:55`) | User clicks "forgot password" |
| `verifyEmail` | `emailVerification.sendVerificationEmail` (`auth.ts:63`) | Sign-up with `requireEmailVerification: true` |
| `magicLink` | `magicLink.sendMagicLink` (`auth.ts:73`) | User requests passwordless sign-in |
| `otp-sign-in` | `emailOTP.sendVerificationOTP` (`auth.ts:85`, type=`sign-in`) | OTP-based sign-in |
| `otp-email-verification` | same hook, type=`email-verification` | OTP-based email verification |
| `otp-forgot-password` | same hook, type=`forget-password` | OTP-based password reset recovery |

Each template receives typed props (`{ url, name, expiresInMinutes }` for the link-based ones, `{ otp, expiresInMinutes, type }` for the OTP ones). See [`integrations.md`](./integrations.md) for the full hook → template mapping.

## Wiring to Better Auth

`packages/auth/src/auth.ts` calls `void sendMail(...)` inside its 4 `send*` hooks. **Never `await`** — Better Auth's docs explicitly warn about timing attacks. On Vercel, the `hono/vercel` adapter's `waitUntil` covers the gap.

The full mapping (signatures, idempotency keys, context shapes) is in [`integrations.md`](./integrations.md).

## Provider switch

`MAIL_PROVIDER` env var selects the active provider:

| Value | Behavior | When to use |
|---|---|---|
| `console` (default if no `RESEND_API_KEY`) | Logs the mail payload to stdout. No network. | Local dev, demo deployment |
| `resend` (default if `RESEND_API_KEY` is set) | Sends via Resend SDK | Production |
| `noop` | Returns `{ id: 'noop' }`. No logging, no network. | Unit tests of consumers |

The provider interface lives in [`provider/types.ts`](./structure.md#srcprovidertypests). Adding a new provider is one file.

## Conventions

- **No direct `resend` imports outside `packages/mail/provider/resend.ts`.** Enforced by ESLint `no-restricted-imports` (same rule pattern as `packages/cache`).
- **All templates wrap their content in `<Wrapper>`.** The `Wrapper` owns `<Html><Head><Tailwind config={brand}><Container>...</Container></Tailwind></Html>` — single edit site for brand.
- **Lazy singletons.** No `new Resend(...)` at module top-level — would crash dev/test without env. Mirrors `packages/cache` and `packages/database` env patterns.
- **`void sendMail(...)` everywhere.** Never `await` in a Better Auth callback or a procedure handler.
- **Idempotency keys on every send.** Format: `<scope>:<id>:<hash>` (24h Resend window). See [`conventions.md`](./conventions.md#idempotency-keys) for the exact strings.
- **Templates declare `Template.PreviewProps`** for the `email dev` preview server.

## Testing

- **Unit (Vitest)** — `provider/*`, `render.ts`, `registry.ts`, each template's `PreviewProps`. 80% line / 75% branch coverage.
- **Integration (Vitest)** — `sendMail()` end-to-end with `console` and `noop` providers. Resend provider tested with a mock client (no real API key in CI).
- **Snapshot (Vitest)** — each template's rendered HTML, to catch unintended style changes.
- **No real Resend key in CI.** The `noop` provider is the default in `vitest.config.ts`.

Full system strategy: [`../../08-testing/`](../../08-testing/).

## Cross-references

### System concerns

- [`../../01-stack/resend-react-email.md`](../../01-stack/resend-react-email.md) — the Resend + React Email rationale
- [`../../04-api-surface/`](../../04-api-surface/) — public surface, includes the mail send endpoint if exposed
- [`../../06-security/`](../../06-security/) — idempotency, PII handling in logs, webhook signing (M2+)

### System ADRs

- [`../../10-decisions/0013-react-email-v6-unified-package.md`](../../10-decisions/0013-react-email-v6-unified-package.md)
- [`../../10-decisions/0014-resend-as-transport.md`](../../10-decisions/0014-resend-as-transport.md)

### Related packages

- [`../auth/`](../auth/) — `packages/auth`. Owns the 4 `send*` hooks that call `sendMail`.
- [`../cache/`](../cache/) — `packages/cache`. Mirrors the lazy-singleton + provider-switch pattern.
- [`../api/`](../api/) — `packages/api`. May consume `sendMail` for procedural notifications (M1+).

### Local docs

- [`structure.md`](./structure.md) — file-by-file contract
- [`integrations.md`](./integrations.md) — Better Auth hooks wiring (signatures, idempotency keys)
- [`conventions.md`](./conventions.md) — template naming, provider switch semantics, idempotency key format
- [`M0-deferred-work.md`](./M0-deferred-work.md) — production gaps (i18n, webhooks, plain-text fallback, unsubscribe)
- [`decisions/0001-resend-react-email-v6-supastarter-pattern.md`](./decisions/0001-resend-react-email-v6-supastarter-pattern.md) — the local ADR that locks the Resend + react-email + supastarter choice

### App

- [`../../12-apps/email-preview/`](../../12-apps/email-preview/) — the Next.js preview app that lists every template

### Reference docs (agent memory)

- [Mail stack decision](../../.claude/agent-memory/tech-lead/project-mail-stack-decision.md)
- [React Email v6 unified reference](../../.claude/agent-memory/tech-lead/reference-react-email-v6-unified.md)
- [Resend SDK reference](../../.claude/agent-memory/tech-lead/reference-resend-sdk-details.md)
- [supastarter mailing pattern](../../.claude/agent-memory/tech-lead/reference-supastarter-mailing-pattern.md)
- [Better Auth send* hooks wiring](../../.claude/agent-memory/tech-lead/project-better-auth-send-hooks.md)
