# packages/auth

You own the authentication layer: the Better Auth configuration, every plugin, and the rules that decide who may do what. When a question comes back about sessions, roles, invitations or email verification, the answer is in this package.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/auth.ts` | The canonical configuration. The only place the auth instance is built. |
| `src/host-allowlist.ts` | `HOST_ALLOWLIST` and `isHostAllowed()`, shared with the CORS layer of the API. |
| `src/organization/plugin.ts` | The organization plugin and its hooks. |
| `src/organization/policy.ts` | The slug and name validation. |
| `src/organization/invitation.ts` | The invitation delivery, delegated to `packages/email`. |
| `src/types.ts` | The public type surface. |

## Plugins

Five entries, and the order matters:

1. `deviceAuthorization`, for the CLI login flow.
2. `bearer`, so a stateless CLI can present a session token in an `Authorization` header.
3. `admin`, which adds `role`, `banned`, `banReason` and `banExpires` to the user, and `impersonatedBy` to the session.
4. `organization`, configured in `src/organization/plugin.ts`.
5. `nextCookies()`, always last. It is a Next.js integration requirement.

## Invariants

- **`AUTH_BASE_PATH` is `/api/v1/auth` and it must match the Hono mount** in `packages/api`, which serves `/auth/*` under the same prefix. The value is duplicated on purpose: `@workspace/api` depends on `@workspace/auth`, so importing it back would create a cycle. Change both sides together. A mismatch makes every auth URL return 404 in production while the middleware still runs.
- **The schema is generated.** `pnpm auth:generate` rewrites `packages/database/src/schema/auth.ts`. Never edit that file by hand.
- **The email callbacks never throw.** `sendResetPassword` and `sendVerificationEmail` are fire-and-forget: they dispatch the mail and report a failure through `logEmailFailure`. The forgot-password flow has to keep its always-succeed behaviour.
- **The synthetic user carries the admin fields.** `customSyntheticUser` gives a fabricated sign-up response the same shape as a real one. Without the `role` field, the presence of `role` on a response would become an account-enumeration signal.
- **`requireEmailVerificationOnInvitation` is true in production.** The resolver refuses to start the process when the variable is `false` and `NODE_ENV` is `production`. There is no opt-in variable, and any value other than `true` or `false` is rejected.
- **The host allowlist is shared, not copied.** `isHostAllowed()` is consumed by the API's CORS middleware as well.

## The organization plugin

- `allowUserToCreateOrganization` requires a verified email.
- The creator becomes the `owner`.
- Invitations expire after 48 hours.
- The `beforeCreateOrganization` hook validates the name and the slug, rejects unverified accounts, and rejects any metadata, because the metadata is not editable at creation.
- **Reserved slugs live in `src/organization/policy.ts`.** They cover the top-level route segments, so an organization can never shadow `/account` or `/admin`, plus a few product namespaces. Extend that set there, never in a route.

## Commands

```bash
pnpm auth:generate   # regenerate the Drizzle schema
pnpm test            # vitest
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint
pnpm build
```

The tests live in `tests/`: the email flows, the providers, the session, and the organization behaviour.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/api](../api/AGENTS.md)
- [packages/database](../database/AGENTS.md)
- [packages/email](../email/AGENTS.md)
- [packages/env](../env/AGENTS.md)
