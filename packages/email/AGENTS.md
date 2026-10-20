# packages/email

You own every message the product sends: the transports that deliver them and the React Email templates that shape them. A mailer that lives in a feature package is a mailer that will drift.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/transport.ts` | The mailer factory, and the transport singleton it exports. |
| `src/transports/console.ts` | The development transport: logs to stdout, no infrastructure. |
| `src/transports/resend.ts` | The production transport. |
| `src/send-auth-email.ts` | `sendAuthEmail`, the fire-and-forget helper the auth callbacks use. |
| `src/invitation.tsx` | The organization invitation message. |
| `src/templates/` | The React Email templates and their layout. |
| `src/templates/partials/button.tsx` | The shared call-to-action partial. |
| `src/types.ts` | The transport contract. |

## The templates

| Template | Sent for |
|---|---|
| `reset-password.tsx` | The password reset link. |
| `verify-email.tsx` | The email verification link. |
| `organization-invitation.tsx` | The invitation to join an organization. |
| `layout.tsx` | The shell every template renders in. |

## Ownership boundary

`packages/email` is the only workspace that owns email delivery transports, provider clients and message templates. Other workspaces may have domain-specific adapters, such as auth callbacks, but those adapters must delegate sending here. Do not duplicate provider setup or templates in `packages/api` or `packages/auth`, and do not treat their domain-specific adapters as interchangeable. Keep the public interface here focused on sending and rendering email.

## Conventions

- **The transport is chosen by `MAIL_TRANSPORT`.** `console` is the default and logs to stdout, `resend` is the production path. The factory runs once at module load and exports a singleton.
- **The `from` address comes from the environment,** `RESEND_FROM_NAME` and `RESEND_FROM_EMAIL`.
- **A send returns a result, it does not throw.** The callers are the auth callbacks, and they are fire-and-forget by design: a failure must not break the request that triggered the mail. The auth package logs the failure through its own `logEmailFailure`. Keep the result shape stable: `{ ok: true }` or `{ ok: false, error }`.
- **The invitation message is owned here,** not in the auth package. The auth plugin calls it and delegates.
- **Templates are React components,** rendered to HTML by the transport. They never import from the application packages: a template that imports an application type cannot be rendered from a package that does not know the application.

## Commands

```bash
pnpm build
pnpm test
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
```

## Gotchas

- In development, `MAIL_TRANSPORT` defaults to `console`. A message that never arrives in an inbox during development is not a bug.
- This package depends only on `@workspace/env`. Keep it that way: it is the reason the mailer can be imported from the auth package without a cycle.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/auth](../auth/AGENTS.md)
- [packages/api](../api/AGENTS.md)
- [packages/env](../env/AGENTS.md)
