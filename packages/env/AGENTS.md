# packages/env

You own the environment contract: which variables exist, what they must look like, and which code may read them. Every runtime that boots validates against this package.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/schema.ts` | The server and the client schemas, and the validations that back them. |
| `src/server.ts` | The server environment, with the alias resolution and the production gate. |
| `src/client.ts` | The client environment and the URL helpers. |
| `src/loader.ts` | The server-only loader that reads the files from disk. |
| `src/index.ts` | The root export. |

The exports map is conditional on the runtime: `@workspace/env/server` resolves to the Node build, `@workspace/env/client` to the browser build.

## The server contract

| Variable | Rule |
|---|---|
| `DATABASE_URL` | Required in production. |
| `TEST_DATABASE_URL` | Historical alias for `DATABASE_URL`. |
| `BETTER_AUTH_SECRET` | At least 32 characters in production. |
| `AUTH_SECRET` | Historical alias for `BETTER_AUTH_SECRET`. |
| `BETTER_AUTH_URL` | Defaults to `http://localhost:3000`. |
| `ALLOWED_ORIGINS` | A comma-separated list, trimmed and emptied. |
| `MAIL_TRANSPORT` | `console` (default) or `resend`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | Required when the transport is `resend`. |
| `RATE_LIMIT_PER_MINUTE` | A positive integer, 100 by default. |
| `GITHUB_TOKEN` | Optional. Without it, the registry enrichment hits GitHub anonymously, at 60 requests an hour. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional. The GitHub sign-in button stays hidden without them. |
| `PARENT_DOMAIN` | Required in production, for the cross-subdomain cookies. |

Two aliases exist for historical reasons: `AUTH_SECRET` for `BETTER_AUTH_SECRET` and `TEST_DATABASE_URL` for `DATABASE_URL`. The resolution happens in the consumer, in `server.ts` and in `scripts/env-check.ts`, and both honour the same convention. Do not move that resolution into the schema: a Zod transform around a stricter object drops the optional markers in the inferred type.

## The client contract

Only the `NEXT_PUBLIC_*` variables are readable from the browser: the app name and description, and the four inter-app URLs.

**Each role maps to exactly one variable.** `webURL()` returns the marketing origin, `appURL()` the authenticated product origin, `docsURL()` the documentation origin, `apiBaseURL()` the API origin. Aliasing one role to another variable is forbidden. Compose with `new URL(path, base)`, never by concatenating strings, and never hardcode a trailing slash: `canonicalUrl` rejects it at parse time so the mistake surfaces locally.

## Invariants

- **The client file never imports the loader.** The loader reads `node:fs`, which Turbopack cannot bundle into a client chunk. The conditional exports map keeps them apart.
- **`runtimeEnvStrict` is a compile-time check.** Every key in the client schema has to be listed in `runtimeEnvStrict`, otherwise the build fails. Add the variable in both places.
- **Validation fires at module load.** The environment is eager: a missing required variable stops the process rather than failing later at the first use.
- **The production gate is in the consumer.** `server.ts` enforces what production requires, using the resolved value.

## Commands

```bash
pnpm build
pnpm typecheck
pnpm test        # vitest, with its own config in tests/vitest.config.ts
```

From the root, `pnpm env:check` validates that the required variables are present, with the same alias convention.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/auth](../auth/AGENTS.md)
- [packages/email](../email/AGENTS.md)
