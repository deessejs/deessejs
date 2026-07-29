# `packages/mail` — Internal structure

File-by-file contract. Each file has one responsibility. The provider/registry/wrapper separation is what keeps the package testable and the buyer-customizable surface narrow.

## `src/`

### `src/index.ts`

Public surface. Re-exports `sendMail`, `mailTemplates`, the `MailTemplateId` union, `BaseMailProps`, the `Mailer` interface, and `getMailer`. Nothing else.

### `src/config.ts`

The non-secret configuration: `from` address, default `replyTo`, brand name. Lives in the repo (cleartext) because it's not a secret. The secret (API key) lives in env.

```ts
export const config = {
  from: 'noreply@deessejs.dev',
  replyTo: 'support@deessejs.dev',
  brand: 'DeesseJS',
} as const
```

### `src/env.ts`

Zod schema for env validation. Loaded via `loadEnv()` (lazy, not at module top-level — mirrors `packages/database/src/client/env.ts`).

```ts
const envSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().email().optional(),
  MAIL_REPLY_TO: z.string().email().optional(),
  MAIL_PROVIDER: z.enum(['resend', 'console', 'noop']).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env { ... }
```

### `src/client.ts`

Lazy singletons for each provider's client. The Resend client is constructed on first call, not at module load.

```ts
let _resend: Resend | undefined
export function getResendClient(apiKey: string): Resend {
  if (!_resend) _resend = new Resend(apiKey)
  return _resend
}
```

Why: a `new Resend()` at top-level crashes any import of the package in a context where `RESEND_API_KEY` is missing (dev, tests). Lazy = no crash, no env pollution.

### `src/provider/types.ts`

The `Mailer` interface that every provider implements. This is the **only** seam the rest of the package knows about.

```ts
export interface MailerSendInput {
  to: string
  subject: string
  react: React.ReactElement
  text?: string
  replyTo?: string
  idempotencyKey?: string
}

export interface MailerSendResult {
  id: string
}

export interface Mailer {
  send(input: MailerSendInput): Promise<MailerSendResult>
}
```

### `src/provider/index.ts`

`getMailer()` — switches on `MAIL_PROVIDER` env. Mirrors `packages/cache/src/clients/client.ts` exactly.

```ts
export function getMailer(): Mailer {
  const env = loadEnv()
  switch (env.MAIL_PROVIDER) {
    case 'noop': return new NoopMailer()
    case 'console': return new ConsoleMailer()
    case 'resend': return new ResendMailer(env)
    default: return env.RESEND_API_KEY ? new ResendMailer(env) : new ConsoleMailer()
  }
}
```

### `src/provider/resend.ts`

`ResendMailer` — implements `Mailer` via `resend.emails.send({ react: ... })`. Single place that imports `from 'resend'`.

### `src/provider/console.ts`

`ConsoleMailer` — logs the payload as JSON for local dev. No network.

```ts
export class ConsoleMailer implements Mailer {
  async send(input: MailerSendInput): Promise<MailerSendResult> {
    console.log('[mail:console]', JSON.stringify({ ...input, react: '<ReactNode>' }))
    return { id: `console-${crypto.randomUUID()}` }
  }
}
```

### `src/provider/noop.ts`

`NoopMailer` — returns `{ id: 'noop' }`. For unit tests.

### `src/render.ts`

Pure utilities. `renderHtml(template, props)` calls `await render(<Template {...props} />)` from `react-email`. `renderText(html)` calls `toPlainText(html)`. Used for the snapshot tests and the M2 plain-text fallback (see M0-deferred-work.md).

### `src/send.ts`

`sendMail<T>()` — the single public function. Steps:

1. Look up the template component in `registry.ts`.
2. Call `getMailer()` to get the active provider.
3. Resolve `subject`, `replyTo`, `from` from the config + the template registry.
4. Call `provider.send({ to, subject, react: <Template {...} />, idempotencyKey, ... })`.
5. Return `{ id }` or throw.

### `src/registry.ts`

The single map of all template IDs to React components. Used by `sendMail()` for type-safe lookup AND by `apps/email-preview/` to list every template in the preview UI.

```ts
import { ResetPassword } from './templates/reset-password'
// ... other imports

export const mailTemplates = {
  resetPassword: ResetPassword,
  verifyEmail: VerifyEmail,
  magicLink: MagicLink,
  'otp-sign-in': OtpSignIn,
  'otp-email-verification': OtpEmailVerification,
  'otp-forgot-password': OtpForgotPassword,
} as const

export type MailTemplateId = keyof typeof mailTemplates
```

### `src/types.ts`

The `SendMailInput<T>` generic type. Autocomplete on `template` and `context`:

```ts
export interface SendMailInput<T extends MailTemplateId> {
  to: string
  template: T
  context: ComponentProps<typeof mailTemplates[T]>
  idempotencyKey?: string
  replyTo?: string
}
```

### `src/templates/Wrapper.tsx`

The shared layout. Every template wraps its body in `<Wrapper preview="...">`. The `Wrapper` owns:

- `<Html lang="en" dir="ltr">`
- `<Head><Font fontFamily="Inter" .../><Tailwind config={{ presets: [pixelBasedPreset], theme: { extend: { colors: { brand: '#007291' } } } }}>`
- `<Section className="bg-background p-4"><Container className="rounded-lg bg-card p-6">{Logo}{children}</Container></Section>`
- Closing tags

Single edit site for brand chrome (logo, colors, fonts, footer).

### `src/templates/components/PrimaryButton.tsx`

The CTA button reused by `reset-password`, `magic-link`, and `verify-email`. Wraps `<Button>` from `react-email` with brand classes.

### `src/templates/<name>.tsx`

The 6 templates. Each is a `.tsx` file with:

- A typed `Props` interface
- A `function Template(props: Props)` exported as both named and default export
- `Template.PreviewProps = { ... }` static for the `email dev` preview
- The body wrapped in `<Wrapper>`

Pattern (see [`conventions.md`](./conventions.md) for full rules):

```tsx
import { Heading, Text } from 'react-email'
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
      <Text>Click below to reset your password. The link expires in {expiresInMinutes} minutes.</Text>
      <PrimaryButton href={url}>Reset password</PrimaryButton>
    </Wrapper>
  )
}
export default ResetPassword

ResetPassword.PreviewProps = {
  url: 'https://deessejs.dev/reset?token=demo',
  name: 'Alex',
  expiresInMinutes: 60,
}
```

## `tests/`

### `tests/send.test.ts`

`sendMail()` integration tests. Each provider is tested:

- `console` provider — assert `console.log` was called with the expected payload.
- `noop` provider — assert return value is `{ id: 'noop' }`.
- `resend` provider — uses a mock Resend client (injected via `vi.mock`), asserts the right `react:` element was passed.

### `tests/registry.test.ts`

- Every `MailTemplateId` is in the `mailTemplates` map.
- Every registered template has a `PreviewProps` static.
- No two templates share the same ID.

### `tests/render.test.ts`

- `render(<Template PreviewProps />)` produces non-empty HTML.
- `toPlainText(html)` produces non-empty plain text (M2+).

### `tests/templates.test.ts`

- Snapshot per template — rendered HTML compared to committed `.snap` file.
- Catches unintended style changes during refactors.

## `package.json` scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `email dev -p 3005` | Preview dev server |
| `build` | `email build` | Production build of `email dev` artifacts |
| `typecheck` | `tsc -p tsconfig.json --noEmit` | Type-only check |
| `test` | `vitest run` | Unit + integration + snapshot |
| `test:watch` | `vitest` | Watch mode |
| `lint` | `eslint src tests` | ESLint (forbids direct `resend` imports outside `provider/resend.ts`) |

## ESLint rule (the package boundary)

```js
// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['resend', 'resend/*'],
        message: 'Import Resend via @deessejs/mail only. Use the Mailer interface.',
      }],
    }],
  },
}
```

Same pattern as `packages/cache`'s ban on `@upstash/redis` imports.
