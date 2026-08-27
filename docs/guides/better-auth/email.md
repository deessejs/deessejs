# Better-Auth: Email

Email verification and password reset via `@workspace/email`. See [`index.md`](./index.md) first and read [`hooks.md`](./hooks.md) before this guide.

---

## Architecture

```
packages/auth/src/auth.ts          — better-auth email callbacks
packages/email/src/index.ts        — sendAuthEmail() + templates export
packages/email/src/transport.ts     — createMailer() factory
packages/email/src/transports/      — ConsoleTransport + ResendTransport
packages/email/src/templates/       — React Email templates
```

The `@workspace/email` package is transport-agnostic. `packages/auth` never calls Resend directly.

---

## Email Verification

### Configuration

```ts
emailVerification: {
  sendOnSignUp: true,   // locked — see index.md
  sendOnSignIn: true,
  sendVerificationEmail: async ({ user, url }) => {
    void sendAuthEmail({
      to: user.email,
      subject: "Verify your email",
      react: templates.VerifyEmail({ url, userEmail: user.email }),
      tags: [{ name: "flow", value: "verify-email" }],
    })
  },
},
```

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `emailVerification` config options.

### sendOnSignUp Options

| Value | Behavior |
|---|---|
| `true` | Always sends on signup |
| `false` | Never sends on signup |
| `undefined` (default) | Sends on signup only if `requireEmailVerification: true` |

**Our choice:** explicit `true` (locked in `auth.ts:38`). More robust than relying on the `undefined` default, which depends on `requireEmailVerification` to trigger the send.

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options), `sendOnSignUp`, `sendOnSignIn` options.

### Verification Token

Default expiry: 3600 seconds (1 hour). Configurable:

```ts
emailVerification: {
  expiresIn: 3600,
  autoSignInAfterVerification: false, // require user to sign in manually
},
```

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `expiresIn`, `autoSignInAfterVerification`.

---

## Password Reset

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    void sendAuthEmail({
      to: user.email,
      subject: "Reset your password",
      react: templates.ResetPassword({ url, userEmail: user.email }),
      tags: [{ name: "flow", value: "reset-password" }],
    })
  },
  onPasswordReset: async ({ user }) => {
    // Optional: revoke other sessions after password change
  },
  revokeSessionsOnPasswordReset: false,
},
```

Default token expiry: 30 minutes. Configurable via `resetPasswordTokenExpiresIn`.

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `sendResetPassword`, `onPasswordReset`, `revokeSessionsOnPasswordReset`.

---

## The sendAuthEmail Wrapper

Always use `sendAuthEmail` (not `mailer.send` directly). It provides:

- A typed, ergonomic API
- Debug logging via `console.log`
- Fire-and-forget semantics (`void` the call)

```ts
import { sendAuthEmail, templates } from "@workspace/email"

void sendAuthEmail({
  to: user.email,
  subject: "...",
  react: templates.VerifyEmail({ url, userEmail: user.email }),
  tags: [{ name: "flow", value: "verify-email" }],
  // idempotencyKey: "...", // for Resend deduplication
})
```

---

## Fire-and-Forget Pattern

**Do not await** `sendAuthEmail` inside better-auth callbacks. The better-auth docs recommend fire-and-forget to prevent timing attacks:

> "Avoid awaiting the email sending to prevent timing attacks. On serverless platforms, use `waitUntil` or similar."

**Source:** [better-auth.com/docs/concepts/email](https://better-auth.com/docs/concepts/email), timing attack guidance.

In our Hono-based API, use `void`:

```ts
// ✅ Correct
void sendAuthEmail({ to: user.email, ... })

// ❌ Wrong — blocks the response, potential timing leak
await sendAuthEmail({ to: user.email, ... })
```

---

## Idempotency Keys

For Resend, pass an idempotency key to prevent duplicate sends on retries:

```ts
void sendAuthEmail({
  to: email,
  subject: "...",
  react: ...,
  idempotencyKey: user.id,  // Resend: 24h TTL, max 256 chars
})
```

Use the user ID for verification and password-reset emails.

**Source:** [better-auth.com/docs/infrastructure/services/email](https://better-auth.com/docs/infrastructure/services/email), email service reference.

---

## Transport Selection

Environment-driven via `MAIL_TRANSPORT`:

```ts
// .env
MAIL_TRANSPORT=console    # development (default)
MAIL_TRANSPORT=resend     # production
```

`createMailer()` in `packages/email/src/transport.ts` selects the transport at module load and exports a process-wide singleton.

---

## Console Transport (Dev)

Logs a grep-friendly format to stdout:

```
[mailer] ┌─ email ─────────────────────────────────────────
[mailer] │ to:        alice@example.com
[mailer] │ from:      DeesseJS <onboarding@resend.dev>
[mailer] │ subject:   Verify your email
[mailer] │ link:      https://example.com/verify?token=...   ← copy me
[mailer] │
[mailer] │ preview (first 15 lines):
[mailer] │   Verify your email
[mailer] │   Click the link below to confirm:
[mailer] │   https://example.com/verify?token=...
[mailer] └──────────────────────────────────────────────────
```

Copy the link from the terminal. No HTML preview in dev.

---

## Resend Transport (Prod)

Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the environment. The transport uses `{ data, error }` (never throws on API errors):

```ts
const { data, error } = await client.emails.send({ ... })
if (error) return { error: error.message }
return { id: data!.id }
```

**Source:** [better-auth.com/docs/infrastructure/services/email](https://better-auth.com/docs/infrastructure/services/email), email service docs.

---

## Templates

Two transactional templates ship with this template (single-tenant, no org-invitation template):

| Template | Trigger | Component |
|---|---|---|
| `VerifyEmail` | Email verification on signup | `@react-email/components` |
| `ResetPassword` | Password reset request | `@react-email/components` |

All use `BaseLayout` (Tailwind-styled via `@react-email/components/Tailwind`). Brand color: `#0070f3`.

To add a new template:
1. Create `packages/email/src/templates/my-template.tsx`
2. Export from `packages/email/src/templates/index.ts`
3. Add to the `templates` namespace export in `packages/email/src/index.ts`

> An `InvitationEmail` template is documented at [`org.md`](./org.md) for historical reference; it is not used in this repo.
