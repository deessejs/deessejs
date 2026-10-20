# apps/app

The authenticated DeesseJS product: dashboard, account settings, administration and authentication screens. This is the application users reach after signing in.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter app dev
```

The development server uses port 3000 by default. The root `pnpm dev` command starts all configured applications and packages through Turbo.

## Routes

- `(protected)` contains `/home`, `/account/settings` and `/admin`.
- `(unprotected)` contains login, signup, password recovery, email verification and `/device`.
- `/device` is the approval screen for the CLI device authorization flow.

The route guard is `proxy.ts`. It resolves the session through the API and applies the email verification check to protected routes.

## Architecture

- `app/api/[[...route]]/route.ts` exposes the shared Hono API from `@workspace/api`.
- `lib/orpc.ts` creates the typed client for API procedures.
- `lib/auth-client.ts` configures the browser Better Auth client and its plugins.
- `lib/fetch-auth-interceptor.ts` handles auth requests on Vercel preview deployments.
- `lib/settings-paths.ts` owns the account settings route constants.
- `lib/admin-auth.ts` owns the role check used by the administration area.

Business operations should go through the API client. Keep database access and server-side domain rules in their owning packages.

## Commands

```bash
pnpm dev
pnpm test
pnpm test:run
pnpm typecheck
pnpm lint
```

The tests live in `tests/`; they cover the route guard and settings path constants.

## Related

- **Uses**: [`@workspace/api`](../../packages/api/README.md), [`@workspace/auth`](../../packages/auth/README.md), [`@workspace/contracts`](../../packages/contracts/README.md), [`@workspace/env`](../../packages/env/README.md), [`@workspace/ui`](../../packages/ui/README.md), [`@workspace/utils`](../../packages/utils/README.md)
