# RPC

## Question this doc answers

*What must go through RPC, and what must not?*

## Rule

**Any code path that touches server-owned data goes through an oRPC
procedure. There is no REST layer in this repo for templates.**

This is enforced by review, not by tooling. The cost of bypassing is
silent: an agent adds a `fetch` to `/api/templates`, the marketing
cards render stale data, and the next deploy ships a divergent
client and server. We catch it in review.

## What "server-owned data" means

Anything that lives in `packages/api`, `packages/database`, or external
systems fetched by the backend (GitHub, Resend). The marketing site,
the product, and the CLI are consumers. They do not own data.

## What is RPC in this repo

- **Procedures**: defined in `packages/api/src/router/`. Each procedure
  has an `input` (Zod), an `output` (Zod), a `handler` (async), and an
  error map (codes métier).
- **Router**: aggregated in `packages/api/src/router/index.ts` as
  `appRouter`. This is the source of truth for what the server exposes.
- **Wire**: `RPCLink({ url, fetch })` consumes the router and turns
  procedure calls into HTTP requests. Mounted at `/api/v1/rpc/*` on
  the server.
- **Client**: `createORPCClient(RPCLink({ url, fetch }))` produces a
  typed `RouterClient<typeof appRouter>`. Used in every consumer app.

## Decision tree

```
You want to fetch data from the server.
        │
        ▼
Is the data already exposed as a procedure on appRouter?
        │
   ┌────┴────┐
   Yes      No
   │        │
   ▼        ▼
Use it.   Add a procedure to packages/api/src/router/.
            │
            ▼
          Validate input/output with Zod (packages/contracts/).
            │
            ▼
          Delegate to services/. The handler stays thin.
            │
            ▼
          Update tests/contract/. Server-Side Client calls the
          procedure directly. Tests assert input/output shape.
```

If you find yourself writing `fetch("/api/...")` in a consumer app,
**stop**. Either the data is already exposed (use the procedure) or it
should be (add one).

## How consumers wrap the client

### `apps/web/src/lib/orpc.ts`

```ts
const link = new RPCLink({
  url: API_RPC_PATH,
  fetch: (request, init) => {
    const isrInit = {
      ...init,
      next: { revalidate: 600, tags: ["templates"] },
    }
    return globalThis.fetch(request, isrInit)
  },
})

export const orpc: RouterClient<typeof appRouter> = createORPCClient(link)
```

The `fetch` hook threads Next.js ISR directives onto the standard
`fetch` `init`. Next reads `init.next.revalidate` and `init.next.tags`
directly — there is no abstraction layer between RPCLink and Next's
data cache.

### `apps/cli/src/api/client.ts`

Same shape, different `fetch`. The CLI's `fetch` hook wraps
`fetchWithRetry` so transient failures and 429s are handled with the
existing retry pipeline. The 5-arg signature comes from
`@orpc/client/adapters/fetch/index.d.ts`.

### `apps/app/lib/orpc.ts`

Same shape, no custom `fetch`. The product is `unstable_cache`-aware at
the page level.

## Error format

Wire format: `{ defined, code, status, message, data }`. The
client decodes this into a real `ORPCError` instance. See
[`decisions/ADR-016-orpcerror-wire-format.md`](../decisions/ADR-016-orpcerror-wire-format.md).

Server-side: Hono middleware (rate-limit, notFound, onError) throws
`HTTPException` which the global `onError` maps to the wire shape.
Do not return a custom JSON envelope from any route — the wire format
is the contract.

## What does NOT go through RPC

- **Static assets**: favicon, fonts, public images.
- **Edge functions**: Hono handlers that don't go through `/api/v1/rpc`.
- **Webhook receivers**: the auth handler at `/auth/*` is not oRPC; it's
  Better Auth's HTTP API.
- **Health checks**: `/health` and `/ready` return JSON without going
  through the procedure stack.

## Where to put a new procedure

```
packages/api/src/router/
  user.ts          ← existing
  templates.ts     ← existing
  <new>.ts         ← new procedures
  index.ts         ← re-export and compose
```

Then add the procedure to the router in `index.ts`:

```ts
import { newRouter } from "./new.js"

export const appRouter = {
  templates: templatesRouter,
  user: userRouter,
  new: newRouter,   // ← here
}
```

That's it. The client picks it up via `RouterClient<typeof appRouter>`
type inference. No client changes needed.

## Anti-patterns

- A `fetch("/api/v1/templates")` in a consumer. Use `client.templates.list()`.
- A custom envelope (we deleted `envelope.ts` in the Phase 1 cleanup).
- Bypassing the router with a Hono route. Use `os.errors(NOT_FOUND)` etc.
  inside the procedure instead.
- A second transport mechanism. There's one server. There's RPC.
