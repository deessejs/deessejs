# Architecture overview

## What is this repo?

The DeesseJS main app: a Next.js monorepo for the `deessejs` organization.
It powers three consumer-facing surfaces (`apps/web`, `apps/app`, `apps/cli`)
plus a shared backend (`packages/api`) and a contract layer
(`packages/contracts`).

## 30-second tour

```
apps/
  web/      Marketing site (deessejs.com).       Next.js 16, App Router.
  app/      Authenticated product (app.deessejs.com).  Next.js 16.
  cli/      Published CLI (@deessejs/cli).       Node ESM, tsup, vitest.

packages/
  api/      Shared backend (app.deessejs.com/api).  Hono + oRPC.
  auth/     Better Auth setup.
  contracts/  Wire-format contracts shared by all surfaces.
  database/ Drizzle ORM + Postgres.
  email/    React Email templates.
  ui/       shadcn/ui design system.
  env/      Zod-validated env loader.
  cookies/  Cookie consent UI.
  utils/    General utilities.
```

## Three layers, one backend

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│ apps/web│   │ apps/app│   │ apps/cli│
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     └─────────────┼─────────────┘
                   │ oRPC
                   ▼
            ┌──────────────┐
            │ packages/api │
            │   (Hono)     │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ packages/    │
            │ database     │
            └──────────────┘
```

All three apps consume `packages/api` via oRPC. There is no REST layer in
this repo for templates. If you find yourself reaching for `fetch` to
talk to the server, see [`rpc.md`](./rpc.md).

## Where does X go?

| You want to…                       | Put it in…                       |
| ---------------------------------- | --------------------------------- |
| Add a server-side endpoint         | `packages/api/src/router/`         |
| Add a server-side business rule    | `packages/api/src/services/`       |
| Add a server-side fetch (e.g. GH)  | `packages/api/src/services/`       |
| Add a Zod contract                 | `packages/contracts/src/vN/`       |
| Add a UI primitive                 | `packages/ui/src/components/`      |
| Add a marketing page               | `apps/web/src/app/`               |
| Add a typed RPC client             | `<app>/src/lib/orpc.ts`           |
| Add a CLI command                  | `apps/cli/src/commands/`          |

## Stack

- **Runtime**: Node 22+, TypeScript strict.
- **Framework**: Next.js 16 (App Router), Hono on the server side.
- **Auth**: Better Auth.
- **DB**: Drizzle + Postgres (pg-mem in tests).
- **Styling**: Tailwind v4 + shadcn/ui.
- **RPC**: oRPC + Zod (Standard Schema compatible).
- **Tests**: Vitest. Patterns per `docs/engineering/architecture/rules/test-mocking.md`.

## What lives where, exactly

- **`packages/contracts/`**: Zod schemas, single source of truth for wire shapes.
  Versioned by path (`v1/`, `v2/`). Every cross-process communication
  references a contract from here.
- **`packages/api/src/router/`**: oRPC procedures. Each procedure is a
  thin handler that delegates business logic to `services/`.
- **`packages/api/src/services/`**: business logic. Talks to the database,
  to GitHub, to Resend. Knows nothing about HTTP, oRPC, or RPC.
- **`packages/api/src/middleware/`**: Hono-level middleware. CORS, rate
  limit, session. Catches errors and shapes them as `ORPCError` (see
  `decisions/`).
- **`packages/ui/`**: visual primitives. No business logic, no data fetching.
- **`apps/<web|app|cli>/src/lib/orpc.ts`**: typed client wrapper. Adds ISR
  (web), retry (CLI), or nothing (app) on top of `createORPCClient`.

## Anti-patterns

- Reaching for `fetch` to talk to the server. Use oRPC.
- Putting business logic in a procedure handler. Put it in `services/`.
- Sharing `orpc.ts` between apps. Each app has its own wrapper.
- Mocking the global `fetch` to test RPCLink. See
  `docs/engineering/architecture/rules/test-mocking.md`.
- Reaching for `any` to silence TypeScript. Type the contract first.
