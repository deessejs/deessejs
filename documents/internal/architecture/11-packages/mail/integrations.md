# `packages/mail` — Integration with Better Auth `send*` hooks

The integration between `packages/auth` and `packages/mail` is via the 4 `send*` callbacks configured in `packages/auth/src/auth.ts`. Currently those callbacks `console.log` — the wiring described here replaces each `console.log` with `void sendMail(...)`.

> **Why `void` and not `await`?** Better Auth's docs explicitly warn: "Avoid awaiting the email sending to prevent timing attacks." On Vercel, the `hono/vercel` adapter's `waitUntil` covers the gap if the request lifecycle would otherwise exit.

## The 4 hooks

### Hook 1 — `emailAndPassword.sendResetPassword` (`auth.ts:55`)

Better Auth signature:
```ts
sendResetPassword: async ({ user, url, token }, request) => void
```

DeesseJS wiring:
```ts
import { sendMail } from '@deessejs/mail'

sendResetPassword: async ({ user, url }) => {
  void sendMail({
    to: user.email,
    template: 'resetPassword',
    context: { url, name: user.name, expiresInMinutes: 60 },
    idempotencyKey: `reset:${user.id}:${hashToken(url)}`,
  })
}
```

**Template:** `resetPassword` (link-based)
**Props:** `{ url, name, expiresInMinutes: 60 }`
**Idempotency key:** `reset:<userId>:<hashToken(url)>` — same token = same mail, no duplicates on retry.

### Hook 2 — `emailVerification.sendVerificationEmail` (`auth.ts:63`)

Better Auth signature:
```ts
sendVerificationEmail: async ({ user, url, token }, request) => void
```

DeesseJS wiring:
```ts
sendVerificationEmail: async ({ user, url }) => {
  void sendMail({
    to: user.email,
    template: 'verifyEmail',
    context: { url, name: user.name, expiresInHours: 24 },
    idempotencyKey: `verify:${user.id}:${bucket(Date.now(), '1h')}`,
  })
}
```

**Template:** `verifyEmail` (link-based)
**Props:** `{ url, name, expiresInHours: 24 }`
**Idempotency key:** `verify:<userId>:<1hBucket>` — 1h window dedupes re-sends during the verification flow.

### Hook 3 — `magicLink.sendMagicLink` (`auth.ts:73`)

Better Auth signature:
```ts
sendMagicLink: async ({ email, url, token, metadata }, ctx) => void
```

DeesseJS wiring:
```ts
sendMagicLink: async ({ email, url }) => {
  void sendMail({
    to: email,
    template: 'magicLink',
    context: { url, expiresInMinutes: 10 },
    idempotencyKey: `magiclink:${email}:${bucket(Date.now(), '5min')}`,
  })
}
```

**Template:** `magicLink` (link-based)
**Props:** `{ url, expiresInMinutes: 10 }`
**Idempotency key:** `magiclink:<email>:<5minBucket>`

### Hook 4 — `emailOTP.sendVerificationOTP` (`auth.ts:85`)

Better Auth signature:
```ts
sendVerificationOTP: async ({ email, otp, type }) => void
// type ∈ 'sign-in' | 'email-verification' | 'forget-password'
```

DeesseJS wiring — **switch on `type` to pick the template**:
```ts
sendVerificationOTP: async ({ email, otp, type }) => {
  const templateId = ({
    'sign-in': 'otp-sign-in',
    'email-verification': 'otp-email-verification',
    'forget-password': 'otp-forgot-password',
  } as const)[type]

  void sendMail({
    to: email,
    template: templateId,
    context: { otp, expiresInMinutes: 10, type },
    idempotencyKey: `otp:${email}:${type}:${bucket(Date.now(), '1min')}`,
  })
}
```

**Templates:** 3 separate files (`otp-sign-in`, `otp-email-verification`, `otp-forgot-password`)
**Props:** `{ otp, expiresInMinutes: 10, type }`
**Idempotency key:** `otp:<email>:<type>:<1minBucket>`

## Helper: `hashToken` and `bucket`

```ts
// helpers in packages/auth/src/utils/idempotency.ts (new)
import crypto from 'node:crypto'

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16)
}

export function bucket(timestamp: number, windowSize: '1min' | '5min' | '1h'): number {
  const windows = { '1min': 60_000, '5min': 300_000, '1h': 3_600_000 }
  return Math.floor(timestamp / windows[windowSize])
}
```

These helpers are intentionally simple — they exist to make idempotency keys reproducible across retries.

## Type safety end-to-end

The chain that gives us autocomplete on `context` for each template:

```
mailTemplates = { resetPassword: ResetPassword, ... }       // registry.ts
  └─> MailTemplateId = keyof typeof mailTemplates          // derived union
       └─> SendMailInput<T> = { template: T, context: ComponentProps<typeof mailTemplates[T]> }
            └─> sendMail(input) → autocomplete on `template` AND `context`
```

When you type `sendMail({ template: 'magicLink', ... })` in your editor, `context` is typed as `{ url: string, expiresInMinutes: number, ... }` automatically. Same for the other 5 templates.

## The `void` rule — why we mean it

If you `await sendMail(...)` inside a Better Auth callback, you create two problems:

1. **Timing attack surface.** A slow Resend call delays the auth response. An attacker can measure the delay and infer whether an email is in the system.
2. **Lambda cold start cost.** On Vercel, awaiting a network call inside the auth handler blocks the response. The `hono/vercel` adapter's `waitUntil` is the standard way to fire-and-forget on serverless.

`void sendMail(...)` is the pattern. The compiler accepts the promise being unhandled, the function returns immediately, and the promise resolves in the background.

## Where this doc gets out of date

If Better Auth renames the hook signatures (e.g. adds a 3rd arg, renames a param), this doc needs updating **before** the auth package's `auth.ts` does. The current signatures are pinned to `better-auth@1.6.19` — see [`../auth/decisions/0001-security-baseline-1.6.19.md`](../auth/decisions/0001-security-baseline-1.6.19.md).
