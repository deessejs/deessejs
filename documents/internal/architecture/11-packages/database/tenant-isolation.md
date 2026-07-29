# Tenant isolation

The data-access pattern that makes cross-tenant data access impossible-by-default. This is **the** security boundary of the system. Bugs here are catastrophic.

> **Version note.** Built on `drizzle-orm@^0.45.2`. The pattern is Drizzle-version-agnostic — it relies on the public `db.select()/.insert()/.update()/.delete()` API, which has been stable since 0.x. We pin to 0.x because Better Auth's adapter doesn't yet support v1 (see [issue #6766](https://github.com/better-auth/better-auth/issues/6766)). The data-access functions don't change when we migrate to v1 — see [`decisions/0002-drizzle-v1-rc.md`](./decisions/0002-drizzle-v1-rc.md) for the migration plan.

## The rule

> A data-access function that operates on a resource by ID returns `null` (not 404, not an error) when the resource does not belong to the active org. The existence of the resource stays opaque to non-members.

A `User` from org A is invisible to a query running with `orgId = B`. Not hidden behind a 403, not hidden behind a different error code — **not visible at all.**

## The pattern: functions, not classes

Every org-scoped table has a module of data-access functions (e.g. `packages/database/src/users.ts`). Each function takes `(db, orgId, ...args)` explicitly — no class, no factory, no DI. The `orgId` is required at every call site. It's verbose. It's explicit. It's the right tradeoff.

```ts
// packages/database/src/users.ts
import { and, eq, desc, lt } from 'drizzle-orm'
import type { Database } from './client'
import { users } from './schema/users'
import type { User, NewUser, UserPatch } from './schema/users'

export async function findById(
  db: Database,
  orgId: string,
  id: string,
): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .limit(1)
  return row ?? null
}

export async function list(
  db: Database,
  orgId: string,
  { limit, cursor }: { limit: number; cursor?: string },
): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(
      and(
        eq(users.orgId, orgId),
        cursor ? lt(users.createdAt, cursor) : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
}

export async function create(
  db: Database,
  orgId: string,
  input: NewUser,
): Promise<User> {
  const [row] = await db
    .insert(users)
    .values({ ...input, orgId })  // orgId stamped on insert, not from caller
    .returning()
  return row
}

export async function update(
  db: Database,
  orgId: string,
  id: string,
  patch: UserPatch,
): Promise<User | null> {
  const [row] = await db
    .update(users)
    .set(patch)
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .returning()
  return row ?? null
}

export async function deleteById(
  db: Database,
  orgId: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .returning({ id: users.id })
  return result.length > 0
}
```

**The `orgId` is stamped in two places**:
1. **Every `where` clause** — `eq(t.orgId, orgId)`.
2. **Every insert** — caller cannot override it. The function stamps `orgId` on the input.

**There is no third place.** No constructor, no factory, no ambient state. The `orgId` is a parameter, always visible, never hidden.

## How procedures consume data-access functions

```ts
// packages/api/src/core/users/procedures.ts
import * as users from '@deessejs/database/users'
import { os } from '@orpc/server'
import { z } from 'zod'

export const listUsers = os
  .input(z.object({ limit: z.number().int().min(1).max(100) }))
  .handler(async ({ input, context }) => {
    return users.list(context.db, context.orgId, { limit: input.limit })
  })

export const getUser = os
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const user = await users.findById(context.db, context.orgId, input.id)
    if (!user) throw new NotFoundError()  // not in this org
    return user
  })
```

The `context` is populated by the `auth-context` middleware in `packages/api`:
```ts
export type ApiContext = AuthContext & {
  db: Database
  orgId: string             // validated against the session
  // ... (requestId, ctxLog, scopes, etc.)
}
```

The `orgId` flows from session → middleware → context → data-access function. Every link in the chain is explicit.

## Why functions, not a class

- **Explicit parameters.** Every function call shows `(db, orgId, ...args)`. You cannot forget the `orgId` — it's a required argument. TypeScript catches the missing parameter at compile time.
- **No hidden state.** A class with `(db, orgId)` in the constructor has state. State can be mutated. State can leak. Functions don't have state.
- **Easier to test.** Each function is a unit. Pass in `db`, `orgId`, inputs, get an output. No mocking of a class with a constructor.
- **Easier to refactor.** Move a function from one module to another — no inheritance, no class hierarchy, no DI container.
- **Smaller surface.** A function has a name, a signature, and a body. A class has all of that plus constructor, instance, lifecycle, possible inheritance. The 50-table catalog of `TenantRepo` classes is replaced by 50 small modules of functions. Each module is 50-100 lines. No boilerplate.

## Cross-tenant safety tests (spec 23.30)

For every function that takes an ID, there is a test that:
1. Creates resource R in org A.
2. Calls the function with `orgId = B` and R's ID.
3. Asserts the result is `null` (or empty list, or `false` for deletes).

```ts
// tests/integration/users.test.ts
import { findById, list, update, deleteById } from '../src/users'

describe('users.findById — cross-tenant safety', () => {
  it('returns null when the user is in another org', async () => {
    const userInOrgA = await factories.user.create({ orgId: orgA })
    const result = await findById(db, orgB, userInOrgA.id)
    expect(result).toBeNull()
  })

  it('list does not return users from other orgs', async () => {
    await factories.user.create({ orgId: orgA })
    await factories.user.create({ orgId: orgB })
    const result = await list(db, orgA, { limit: 100 })
    expect(result.every((u) => u.orgId === orgA)).toBe(true)
  })

  it('update returns null when the user is in another org', async () => {
    const userInOrgA = await factories.user.create({ orgId: orgA })
    const result = await update(db, orgB, userInOrgA.id, { name: 'hacked' })
    expect(result).toBeNull()
    // also: user in org A is unchanged
    const after = await findById(db, orgA, userInOrgA.id)
    expect(after?.name).not.toBe('hacked')
  })

  it('deleteById is a no-op when the user is in another org', async () => {
    const userInOrgA = await factories.user.create({ orgId: orgA })
    const result = await deleteById(db, orgB, userInOrgA.id)
    expect(result).toBe(false)
    // user still exists
    const after = await findById(db, orgA, userInOrgA.id)
    expect(after).not.toBeNull()
  })
})
```

These tests are **mandatory per function** and run in the integration test suite with a real Postgres.

## The lint rules (in `packages/api`)

```js
// packages/api/eslint.config.js
'no-restricted-imports': ['error', {
  patterns: [
    {
      group: ['drizzle-orm', 'drizzle-orm/*'],
      message: 'Do not import drizzle-orm directly. Import data-access functions from @deessejs/database.',
    },
    {
      group: ['@deessejs/database/schema', '@deessejs/database/schema/*'],
      message: 'Do not import table definitions. Use the data-access functions.',
    },
  ],
}],
```

The rule is enforced in `packages/api/src/core/**` and `packages/api/src/middleware/**`. The data-access functions themselves (in `packages/database`) can import freely.

## What the functions do **not** do

- **They do not enforce RBAC.** RBAC is a separate concern. The data-access function enforces tenant scope; the procedure enforces permissions. Mixing them is a bug.
- **They do not log access.** The middleware logs the request; the data-access function is silent. Logging inside the function would couple it to a logger implementation.
- **They do not emit events.** Event emission (e.g. `user.updated`) happens in the procedure, not in the data-access function, so the procedure can decide what event shape to publish.
- **They do not call external services.** Stripe / Resend / Trigger.dev are called from procedures or jobs, not from data-access functions.

## Why this approach, not RLS (the v1 decision)

For the full rationale, see [`decisions/0001-application-layer-isolation-vs-rls.md`](./decisions/0001-application-layer-isolation-vs-rls.md). Short version:

- Functions are testable per-feature with normal TS tests.
- Functions play nicely with the modular contract — one module per feature, deletable.
- Functions are debuggable (TS stack trace points to the bug).
- RLS in v1 would couple us to Postgres-specific features and obscure the modular contract.
- RLS can be added in v2 as **defense in depth** on top of the functions, not as a replacement.

**v1 RLS API note.** Drizzle v1 changed the RLS API: `.enableRLS()` is deprecated in favor of `pgTable.withRLS(...)`, and `pgPolicy(...)` auto-enables RLS. This change does not affect our position (we ship functions-only in v1), but it is documented in [`schema.md`](./schema.md) for reference in case we add RLS in v2.

## What goes where — quick reference

| You want to... | Do |
|---|---|
| Add a new data-access function | New file in `packages/database/src/<feature>.ts`, e.g. `users.ts`. Function signature: `async function name(db, orgId, ...args)`. |
| Read a resource by ID from a procedure | `users.findById(ctx.db, ctx.orgId, input.id)` — null if not in org |
| List resources | `users.list(ctx.db, ctx.orgId, { limit, cursor })` — only the active org's data |
| Create a resource | `users.create(ctx.db, ctx.orgId, input)` — `orgId` stamped by the function |
| Update a resource | `users.update(ctx.db, ctx.orgId, id, patch)` — null if not in org |
| Delete a resource | `users.deleteById(ctx.db, ctx.orgId, id)` — false if not in org |
| Run admin/cross-tenant query | **Don't.** Use a dedicated admin endpoint with explicit auth check, no `orgId` from context. |
