# Typed clients

## Question this doc answers

*Where does the typed oRPC client live, and who can consume it?*

## Rule

**Each consumer app has its own `src/lib/orpc.ts` wrapper.** No shared
client package. The router type (`appRouter`) is the only thing
imported across the consumer/server boundary.

## Why each app has its own wrapper

The wrapper carries app-specific concerns:

- **`apps/web`** needs Next.js ISR directives (`next: { revalidate, tags }`).
- **`apps/cli`** needs retry/backoff via `fetchWithRetry`.
- **`apps/app`** uses `unstable_cache` at the page level, so the
  wrapper has no custom `fetch`.

If we shared the wrapper, we'd have to thread three different
"concerns" into one generic interface. Each app's wrapper is ~30
lines; that's cheaper than the abstraction.

## Canonical shape

```ts
// apps/<web|app|cli>/src/lib/orpc.ts
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import { API_RPC_PATH } from "@workspace/api/base-path"
import { appRouter } from "@workspace/api/router"

const link = new RPCLink({
  url: API_RPC_PATH,
  fetch: (request, init) => {
    // App-specific fetch hook. ISR, retry, env, anything.
    return globalThis.fetch(request, init)
  },
})

export type ORPCClient = RouterClient<typeof appRouter>
export const orpc: ORPCClient = createORPCClient(link)
```

`API_RPC_PATH` is exported by `@workspace/api/base-path` (defined in
`packages/api/src/base-path.ts`). Renaming the API prefix means
editing the constant and moving the Next.js catch-all directory in
`apps/app/app/api/[[...route]]/route.ts`. Nothing else.

## What goes in the fetch hook

Things that are **client-specific** and **don't change procedure
behavior**:

- ISR directives (web only).
- Retry, backoff, rate-limit handling (CLI only).
- Auth token injection (auth-aware apps).
- Logging or tracing hooks.

Things that **do NOT** go in the fetch hook:

- Business logic.
- Procedure routing.
- Response shape changes (you'd break the contract).

If you find yourself needing to do something in the fetch hook that
affects what the procedure returns, **add it to the procedure**.

## Anti-patterns

- Sharing `orpc.ts` between apps via `@workspace/api-client` or
  similar. The whole point is that each app wraps differently.
- Calling `appRouter.X()` directly from a consumer app's `page.tsx`
  or `commands/`. Use the typed client.
- Mocking `globalThis.fetch` to test the fetch hook. See
  `docs/engineering/architecture/rules/test-mocking.md`.
- Putting the wrapper in `packages/`. The wrapper is a consumer
  concern, not a contract.

## How to test

- **Procedure contract** (input/output shape, error shapes): call
  `appRouter.X()` directly via the Server-Side Client pattern. No HTTP.
  See `test/contract/`.
- **Wrapper behavior** (ISR, retry, auth header): a real
  `http.createServer` fixture in `test/http/`, or MSW with
  `@dansnow/orpc-msw` for component tests.
- **End-to-end**: run the actual app against a deployed staging
  instance. We don't unit-test "the world is wired correctly" — we
  smoke-test it.

## Adding a new procedure to the client

You don't. The client is typed off `appRouter`. When you add a
procedure to `packages/api/src/router/<new>.ts` and register it in
`router/index.ts`, the consumer's `RouterClient<typeof appRouter>`
type picks it up automatically. The call site types `orpc.<new>.X()`
with full input/output inference.

If TypeScript complains, the contract is broken. Fix the contract, not
the client.
