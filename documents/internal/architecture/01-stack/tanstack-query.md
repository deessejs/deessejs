# TanStack Query

## Decision

**TanStack Query** (`@tanstack/react-query`) as the data-fetching and cache layer for client-side state that comes from oRPC calls.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

TanStack Query is used in **Client Components** for:

- **Mutations** triggered by user actions (form submissions, button clicks).
- **Queries** that re-fetch on focus, on interval, or on demand.
- **Optimistic updates** for snappy UX.
- **Cache invalidation** after mutations.
- **Parallel queries** that depend on multiple data sources.

TanStack Query is **not** used in:

- **Server Components** — they fetch directly via oRPC (no cache layer needed; the server is the cache).
- **Server actions** — they bypass the client entirely.
- **Forms** — that's TanStack Form.

## Why TanStack Query (not SWR, not Apollo, not raw `fetch` + `useState`)

| Alternative | Why not |
|---|---|
| **SWR** | Smaller community than TanStack Query. Less feature-rich (no devtools, fewer adapters). |
| **Apollo Client** | GraphQL-specific. We don't use GraphQL. |
| **Raw `fetch` + `useState` + `useEffect`** | We reinvent TanStack Query badly. Caching, dedup, retry, refetch — all gone. |
| **React Query (legacy)** | Same as TanStack Query; rebranded. |
| **TanStack Router loaders** | We use Next.js routing, not TanStack Router. |

TanStack Query wins because:

- **Pairs perfectly with oRPC.** Each oRPC procedure maps to a `useQuery({ queryKey, queryFn: orpc.foo.bar })`.
- **Devtools.** TanStack Query Devtools show the full cache, mutations, and pending queries.
- **Built-in features** we need: retry, refetch on focus, optimistic updates, infinite queries.
- **Industry standard.** Most React developers already know it.

## Pattern with oRPC

```ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc/client';

// Query
const { data, isLoading, error } = useQuery(
  orpc.projects.list.queryOptions({
    input: { orgId },
  })
);

// Mutation with invalidation
const queryClient = useQueryClient();
const createProject = useMutation(
  orpc.projects.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.projects.list.key() });
    },
  })
);
```

The `orpc.<feature>.<procedure>` accessor exposes `.queryOptions`, `.mutationOptions`, `.key`, etc. — designed for TanStack Query.

## Server Component vs Client Component

The boundary:

- **Server Component** (default): fetch directly via oRPC in the component body. No TanStack Query needed.
- **Client Component** (when you need interactivity): wrap the oRPC call in TanStack Query.

```tsx
// Server Component — no TanStack Query
async function ProjectsPage() {
  const projects = await orpc.projects.list({ orgId });
  return <ProjectList projects={projects} />;
}

// Client Component — TanStack Query
'use client';
function ProjectList() {
  const { data: projects } = useQuery(orpc.projects.list.queryOptions({ input: { orgId } }));
  return <ul>{projects.map(...)}</ul>;
}
```

## Features we use

- **Basic queries** with `queryKey`, `queryFn`, refetch on focus.
- **Mutations** with `onSuccess` / `onError` hooks.
- **Optimistic updates** for instant feedback on user actions.
- **Infinite queries** for paginated lists (per feature 7.7).
- **Query invalidation** on mutation success.
- **Suspense mode** for cleaner loading states.
- **Devtools** in dev only.

## Constraints

- **No fetching via TanStack Query in Server Components.** Use oRPC directly.
- **Every query has a `queryKey`.** No anonymous queries.
- **Mutations invalidate the relevant queries.** Don't manually refetch.
- **No duplicate fetches.** TanStack Query dedupes by queryKey — use this.

## Cross-references

- [`./orpc-hono-sdk.md`](./orpc-hono-sdk.md) — the oRPC pipeline that TanStack Query wraps.
- [`./tanstack-form.md`](./tanstack-form.md) — the form library, also TanStack.
- [`../03-web-app/server-client-boundaries.md`](../03-web-app/) — where to draw the boundary.
- [`../../product/features/07-api.md`](../../product/features/07-api.md) — API feature inventory.
