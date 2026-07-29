# Query patterns

How to read and write data through Drizzle, in the context of the data-access functions. The two reading APIs (`db.select()` and `db.query.X`), joins, pagination, filtering, sorting, and the `.prepare()` pattern for hot paths.

> **Version note.** Built on `drizzle-orm@^0.45.2`. We pin to 0.x because Better Auth's adapter does not yet support drizzle-orm v1 (see [issue #6766](https://github.com/better-auth/better-auth/issues/6766)). The 0.x API is stable and well-documented. When the adapter ships v1 support, we bump to `1.0.0` and gain JIT mappers (`.prepare()` becomes even more powerful).

> **No JIT mappers yet.** Drizzle v1's headline perf feature (JIT-compiled row mappers, -25 to -30% latency) is not available in 0.45.x. We document it in the [v1 migration plan](./decisions/0002-drizzle-v1-rc.md) for when we upgrade. For now, `.prepare()` is still useful (prepared statements at the Postgres level), just without the JIT mapper.

## Two reading APIs

Drizzle offers two ways to read data. They have different tradeoffs.

### `db.select()` — SQL-shaped, type-safe, **preferred for hot paths**

```ts
const rows = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
  .from(users)
  .where(eq(users.orgId, orgId))
  .limit(20)
```

**Pros:**
- Returns only the columns you ask for. Smaller payload, less TS surface.
- Joins are explicit and obvious.
- Plays well with the data-access functions: each query is a function.
- Predictable performance.
- Compatible with `.prepare()` (see below).

**Cons:**
- Joins require manual `leftJoin` / `innerJoin` calls.
- Relations are not inferred; you write them.

### `db.query.X.findMany({ with: {...} })` — relational, **for one-off nested reads**

Drizzle RQBv1 (0.x relations API). See [`relations.md`](./relations.md) for the full reference.

```ts
const rows = await db.query.users.findMany({
  where: (u, { eq }) => eq(u.orgId, activeOrgId),
  with: {
    memberships: {
      with: { org: true },
    },
  },
  limit: 20,
})
```

**Pros:**
- Relations declared per-table via `relations(table, ...)` are inferred.
- Nested `with` is concise.

**Cons:**
- Returns all columns by default unless you set `columns: { ... }`.
- Nested `with` can accidentally N+1 if not careful (Drizzle doesn't dedupe joins).
- The type surface is large.
- **Not compatible with `.prepare()`** — RQB queries are not prepared-statement-friendly.

**Rule of thumb:**
- **Hot paths, list views, anything that joins > 1 table** → `db.select()` with explicit joins, eligible for `.prepare()`.
- **One-off detail views, admin dashboards, deeply nested reads** → `db.query.X.findMany({ with: ... })`.

## `.prepare()` — prepared statements for hot paths

Drizzle's `.prepare()` API compiles the query once and lets you execute it with different parameters. Postgres reuses the prepared statement, saving the parse-and-plan cost on each call.

```ts
// In a data-access function:
import { sql, eq, desc } from 'drizzle-orm'
import type { Database } from '../client'
import { users } from '../schema/users'

export function makeListUsersStmt(db: Database) {
  // Built once, at module load
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.orgId, sql.placeholder('orgId')))
    .orderBy(desc(users.createdAt))
    .limit(sql.placeholder('limit'))
    .prepare('list_users_by_org')
}

export async function listUsers(stmt: ReturnType<typeof makeListUsersStmt>, orgId: string, limit: number) {
  return stmt.execute({ orgId, limit })
}
```

**When to use `.prepare()`:**
- **Hot paths.** Endpoints called >100 req/s or with p95 < 50ms. The parse-and-plan cost is amortized.
- **Static query shape.** The query is built once, parameters vary at call time. The prepared statement is tied to the shape.
- **SQL-shaped queries only.** `db.select()` works. `db.query.X.findMany()` does not (RQB is not prepared-statement-friendly).

**When NOT to use `.prepare()`:**
- Cold paths. The preparation overhead is paid at module load; not worth it.
- Queries with variable `from`/`join` (dynamic structure). `.prepare()` requires a fixed shape.
- RQB queries (`db.query.X.findMany`).

**Caveats:**
- The prepared statement is **session-scoped** in Postgres. If the connection pool recycles, the statement is regenerated on the new session. For connection pools with sticky sessions, this is a non-issue. For serverless drivers (Neon HTTP), the statement is re-prepared per cold start.
- The statement is **transaction-scoped** in 0.x too — using `.execute()` inside a `db.transaction()` block works, but the prepared statement lives only for the duration of the transaction. Use the regular `tx.select()` inside transactions for simplicity (see [`transactions.md`](./transactions.md)).
- The optional **statement name** (first arg to `.prepare()`) is good practice — it appears in Postgres logs for debugging.

## Joins

```ts
// In a data-access function:
import { sql, eq, and, desc } from 'drizzle-orm'

export async function listProjectsWithMemberCount(db: Database, orgId: string, limit: number) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      memberCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${projectMembers}
        WHERE ${projectMembers.projectId} = ${projects.id}
      )`,
    })
    .from(projects)
    .where(eq(projects.orgId, orgId))
    .orderBy(desc(projects.createdAt))
    .limit(limit)
}
```

For correlated subqueries (count, sum, max), use `sql<...>` template tags. The cast (e.g. `::int`) is mandatory when the type doesn't match the default `unknown`.

## Pagination (spec 7.7)

**Cursor-based** is the default. Stable under inserts/deletes, no offset drift.

```ts
import { and, eq, lt, desc, type SQL } from 'drizzle-orm'

export async function list(
  db: Database,
  orgId: string,
  { limit, cursor }: { limit: number; cursor?: string },
) {
  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.orgId, orgId),
        cursor ? lt(users.createdAt, cursor) : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(limit + 1)  // fetch one extra to know if there's a next page

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, -1) : rows
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].createdAt : null,
  }
}
```

**Offset-based** is also supported (some buyers ask for it). The shape is `{ items, total, page, pageSize }`.

```ts
export async function listOffset(
  db: Database,
  orgId: string,
  { page, pageSize }: { page: number; pageSize: number },
) {
  const offset = (page - 1) * pageSize
  const [items, [{ count }]] = await Promise.all([
    db.select().from(users)
      .where(eq(users.orgId, orgId))
      .limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(eq(users.orgId, orgId)),
  ])
  return { items, total: count, page, pageSize }
}
```

**API surface exposes both** (per spec 7.7). The buyer picks per endpoint.

**With `.prepare()`:**

```ts
const listUsersStmt = db
  .select()
  .from(users)
  .where(and(eq(users.orgId, sql.placeholder('orgId')), cursorWhere(users.createdAt, sql.placeholder('cursor'))))
  .orderBy(desc(users.createdAt))
  .limit(sql.placeholder('limit'))
  .prepare('list_users_by_org')

const rows = await listUsersStmt.execute({ orgId: orgId, limit: limit + 1, cursor })
// ... same slicing as above
```

## Filtering (spec 7.8)

Standard operators on each field: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `like`, `ilike`, `isNull`, `isNot`, `between`.

```ts
.where(
  and(
    eq(users.orgId, orgId),
    eq(users.role, input.role),
    gte(users.createdAt, input.since),
    inArray(users.status, input.statuses),
  ),
)
```

The data-access function exposes a typed `listFilters` Zod schema. Procedures convert Zod input → Drizzle conditions via a `buildWhereClause` helper. No raw filter strings.

## Sorting (spec 7.9)

Multi-column sort, explicit direction per field.

```ts
.orderBy(
  input.sortBy === 'name' ? asc(users.name) : desc(users.createdAt),
  asc(users.id),  // tie-breaker
)
```

Always add a tie-breaker (`id` or `createdAt`) to make pagination stable.

## Field selection (sparse fieldsets, spec 7.10)

Optional projection to reduce payload.

```ts
const fields = (input.fields?.split(',') ?? ['id', 'name', 'email']) as (keyof typeof users.$inferSelect)[]
.select(
  Object.fromEntries(
    fields.map(f => [f, users[f as keyof typeof users.$inferSelect]])
  )
)
```

Shipped in core endpoints (per spec 7.10, marked 🟡). Pattern: `?fields=id,name,email` query param, mapped to a Zod enum.

## Aggregations

```ts
const stats = await db
  .select({
    day: sql<string>`date_trunc('day', ${events.createdAt})::text`,
    count: sql<number>`count(*)::int`,
  })
  .from(events)
  .where(eq(events.orgId, orgId))
  .groupBy(sql`date_trunc('day', ${events.createdAt})`)
```

For heavy aggregations, prefer a materialized view or pre-aggregated table. Drizzle handles the SQL; the design decision (view vs on-the-fly) is in `02-data-model/`.

## Bulk operations

```ts
// Batch insert
await db.insert(users).values([
  { orgId, email: 'a@x.com', name: 'A' },
  { orgId, email: 'b@x.com', name: 'B' },
])

// Batch update
await db.update(users)
  .set({ role: 'member' })
  .where(inArray(users.id, ids))
```

For > 1000 rows, use a job (Trigger.dev) and chunk the writes inside a transaction. The API endpoint should not block on a 10k-row insert.

## What goes where — quick reference

| You want to... | Use |
|---|---|
| List a single table (hot path) | `db.select().from(t).where(...).prepare()` + `.execute(params)` |
| List a single table (cold path) | `db.select().from(t).where(...)` |
| Read a deeply nested detail | `db.query.X.findMany({ with: ... })` |
| Cursor pagination | `limit(N+1) + nextCursor` pattern, eligible for `.prepare()` |
| Offset pagination | `limit(N).offset(M) + count(*)` |
| Filter on multiple fields | `and(eq, gte, inArray, ...)` |
| Sort by a field with direction | `orderBy(asc(t.col))` or `desc(t.col)` |
| Aggregate | `sql<...>` template + `groupBy` |
| Bulk insert/update | `.values([...])` or `.where(inArray(...))` |
| Enable prepared statements (hot path) | `.prepare('statement_name')` at module load + `.execute({ params })` per call |
