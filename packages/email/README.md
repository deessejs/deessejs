# `@workspace/email`

Every message DeesseJS sends: the transports that deliver them and the React Email templates that shape them.

## What's included

- **Two transports**: `console` for development, `resend` for production
- **The templates**: the verification, the password reset and the organization invitation
- **`sendAuthEmail`**: the helper the authentication callbacks use
- **`sendOrganizationInvitationEmail`**: the invitation message, owned here rather than in the auth package

## Usage

Send an authentication email:

```ts
import { sendAuthEmail, templates } from "@workspace/email"

const result = await sendAuthEmail({
  to: user.email,
  subject: "Verify your email",
  react: templates.VerifyEmail({ url, userEmail: user.email }),
  tags: [{ name: "flow", value: "verify-email" }],
})

if (!result.ok) {
  console.error(result.error)
}
```

Send an invitation:

```ts
import { sendOrganizationInvitationEmail } from "@workspace/email"

await sendOrganizationInvitationEmail({
  to: email,
  organizationName: "Acme",
  inviterName: "Robin",
  url,
  expiresAt,
})
```

## Exports

| Export | Import path | Contents |
|---|---|---|
| `.` | `@workspace/email` | The mailer, the send helpers, the templates |
| `./templates` | `@workspace/email/templates` | The templates on their own |

## The transports

`MAIL_TRANSPORT` selects one:

| Value | Transport | Behaviour |
|---|---|---|
| `console` | `ConsoleTransport` | The default. Logs to stdout, no infrastructure. |
| `resend` | `ResendTransport` | Production. Needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `RESEND_FROM_NAME`. |

## Commands

```bash
pnpm build
pnpm test
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

## Notes

- A send returns a result, it never throws. The callers are the authentication callbacks, which are fire-and-forget by design: a mail transport outage must not break the request that triggered the mail.
- The invitation message lives here, not in `@workspace/auth`. The auth plugin calls it and delegates.
- A template never imports from the application packages. A template that imports an application type cannot be rendered from a package that does not know the application.
- This package depends only on `@workspace/env`. Keeping it that way is what lets `@workspace/auth` import it without a cycle.

The conventions of this package are in [AGENTS.md](AGENTS.md).
