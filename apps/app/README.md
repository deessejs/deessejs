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

## Shipped capabilities

The authenticated product supports organization workspaces, organization creation and invitations, and GitHub App connection and project import. Imported organization projects have project home pages. The app does not yet provide a dedicated member-management interface. See the [organization and project routes](../../apps/app/app/(protected)/(workspace)) and the [auth and API implementation](../../packages/api/README.md).

## Architecture

- `app/api/[[...route]]/route.ts` exposes the shared Hono API from `@workspace/api`.
- `lib/client.ts` exposes the browser clients under `client.auth` and `client.rpc`.
- `lib/auth-client.ts` configures the Better Auth browser client and its plugins.
- `lib/orpc.ts` creates the typed server client for API procedures and forwards the request cookie.
- `lib/orpc-browser.ts` creates the typed browser client for API procedures.
- `lib/fetch-auth-interceptor.ts` handles auth requests on Vercel preview deployments.
- `lib/settings-paths.ts` owns the account settings route constants.
- `lib/admin-auth.ts` owns the role check used by the administration area.

Browser components use `client.auth` for Better Auth operations and `client.rpc` for oRPC procedures. These namespaces are an ergonomic facade over two independent clients and transports. Server components use `lib/orpc.ts`, which forwards the request cookie. The target boundary is that app code does not import the auth singleton or database package. `lib/admin-auth.ts` and the device page still contain legacy direct session reads, and the sessions table imports branded token helpers from `@workspace/auth/types`; these are migration targets, not patterns to extend. New server-side auth reads should go through an app-owned HTTP client that forwards request headers to the exposed auth endpoint. Database access and server-side domain rules stay behind the server packages.

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

- **Uses**: [`@workspace/api`](../../packages/api/README.md), [`@workspace/contracts`](../../packages/contracts/README.md), [`@workspace/env`](../../packages/env/README.md), [`@workspace/ui`](../../packages/ui/README.md), [`@workspace/utils`](../../packages/utils/README.md)
- **Authentication**: the app-side client calls the endpoints served by [`@workspace/auth`](../../packages/auth/README.md) through `@workspace/api`.
