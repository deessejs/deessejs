# `packages/mail` — Conventions

The rules every contributor to `packages/mail` follows. Mirrors the pattern of [`../cache/conventions.md`](../cache/conventions.md).

## Template naming

| Rule | Why |
|---|---|
| Template files live in `packages/mail/src/templates/` | Single folder is the registry source of truth |
| Filename = `<purpose>.tsx` in kebab-case | Matches `mailTemplates` key (e.g. `reset-password.tsx` → `resetPassword`) |
| Default export + named export | Default for the registry map; named for tests |
| `Template.PreviewProps` static is required | The `email dev` preview server uses it for sample data |
| Templates wrap content in `<Wrapper>` | Single edit site for brand chrome |
| No raw HTML strings, no inline `<style>` | Tailwind classes via `<Tailwind>` only |
| No business logic in templates | Templates are pure functions of props — no DB calls, no API calls |

## MailTemplateId

The string union derived from `keyof typeof mailTemplates`. Adding a new template is a 3-step commit:

1. Create the `.tsx` file with the template + `PreviewProps`.
2. Add it to the `mailTemplates` map in `registry.ts`.
3. (If triggered by Better Auth) add the wiring in `packages/auth/src/auth.ts` and the docs in [`integrations.md`](./integrations.md).

The `MailTemplateId` type updates automatically from step 2.

## Provider switch semantics

```ts
MAIL_PROVIDER env var:
  'resend'   → ResendMailer (requires RESEND_API_KEY)
  'console'  → ConsoleMailer (logs to stdout)
  'noop'     → NoopMailer (returns { id: 'noop' })

unset:
  RESEND_API_KEY set → ResendMailer
  RESEND_API_KEY unset → ConsoleMailer
```

The auto-detect path lets dev work without env config. The explicit override (for tests) is `MAIL_PROVIDER=noop`.

**Never `new Resend(...)` at module top-level.** Always go through `getResendClient(apiKey)` — the lazy singleton in `client.ts`. A top-level `new Resend()` would crash any import of the package when the env var is missing.

## Idempotency keys

Resend deduplicates sends with the same `idempotencyKey` within a 24h window. The format:

```
<scope>:<id>:<bucket|hash>
```

| Scope | Pattern | Bucket window | Example |
|---|---|---|---|
| Password reset | `reset:<userId>:<tokenHash16>` | n/a (hash is unique per token) | `reset:user_abc:a1b2c3d4e5f6g7h8` |
| Email verification | `verify:<userId>:<bucket>` | 1h | `verify:user_abc:482391` |
| Magic link | `magiclink:<email>:<bucket>` | 5min | `magiclink:alice@x.com:5774321` |
| OTP (any type) | `otp:<email>:<type>:<bucket>` | 1min | `otp:alice@x.com:sign-in:28937234` |

`tokenHash16` = first 16 chars of `sha256(token)`. The bucket helpers live in `packages/auth/src/utils/idempotency.ts` (see [`integrations.md`](./integrations.md#helper-hashtoken-and-bucket)).

The bucket window should be smaller than the link/code expiry. If the link expires in 60min, the bucket window is ≤ 1h. Otherwise, a legitimate resend within the expiry window gets blocked.

## Subject lines

Subjects are **not** in the templates. They live in the `mailTemplates` map alongside the components, or in a separate `subjects.ts` file. Pattern:

```ts
// src/registry.ts
export const subjects = {
  resetPassword: 'Reset your DeesseJS password',
  verifyEmail: 'Verify your DeesseJS email',
  magicLink: 'Your DeesseJS sign-in link',
  'otp-sign-in': 'Your DeesseJS sign-in code',
  'otp-email-verification': 'Your DeesseJS verification code',
  'otp-forgot-password': 'Reset your DeesseJS password',
} as const
```

This keeps templates pure (no business copy in JSX) and makes subject A/B tests possible without touching JSX.

## The `void sendMail` rule

**Never `await sendMail(...)` in a Better Auth callback, a procedure handler, or a server action.** Use `void sendMail(...)` and let the promise resolve in the background.

If you need the result (e.g. to log a tracking ID), capture it in a `.then(...)`:

```ts
void sendMail(input).then(({ id }) => {
  console.log({ id, template: input.template }, 'mail sent')
})
```

But the `await` form is forbidden in auth callbacks. See [`integrations.md`](./integrations.md#the-void-rule--why-we-mean-it).

## ESLint enforcement

The package boundary is enforced by ESLint:

```js
// packages/mail/eslint.config.js
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['resend', 'resend/*'],
    message: 'Import Resend via @deessejs/mail only. Use the Mailer interface.',
  }],
}]
```

This rule lives ONLY in `packages/mail/eslint.config.js`. Other packages can import `from '@deessejs/mail'` freely.

## Logging

The `console` provider logs the full payload (minus the React node, which is replaced by `'<ReactNode>'` to avoid massive logs). The `resend` provider does not log — Resend's dashboard is the source of truth for sent mails.

For prod observability, see [M0-deferred-work.md § "Bounce + open tracking"](./M0-deferred-work.md).

## Testing

- Every template has a snapshot test (HTML output).
- Every template has a unit test for the `PreviewProps` static.
- The provider switch is tested with all 3 providers.
- `sendMail()` is tested with each provider, asserting the right `react:` element was passed.

See [`../08-testing/`](../../08-testing/) for the system strategy.
