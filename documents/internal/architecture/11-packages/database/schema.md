# Schema patterns

How `pgTable` is defined per feature, how Zod schemas are derived (via the v1 `drizzle-orm/zod` integration), and the conventions for indexes, constraints, and column types.

> **Version note.** Built on `drizzle-orm@1.0.0-rc.3`. In v1, the Zod integration moved from the separate `drizzle-zod` package into `drizzle-orm` itself — one less dep, one less peer to validate. See [`decisions/0002-drizzle-v1-rc.md`](./decisions/0002-drizzle-v1-rc.md). **The `pgTable` schema declaration is unchanged between 0.45.x and v1** — all the patterns in this file work identically in both versions. The only schema-adjacent v1 change is in the relations API (RQBv2), documented in [`relations.md`](./relations.md).

## Per-feature schema files

Schemas live in `packages/database/src/schema/<feature>/`. One folder per feature module, exported from `packages/database/src/schema/<feature>/index.ts` (the modular contract — public surface only).

```
packages/database/src/schema/
├── _columns.ts               # orgIdColumn(), timestampColumns(), softDeleteColumn()
├── _zod-refinements.ts       # shared Zod refinement helpers
├── users/
│   ├── index.ts              # exports: users table, Zod schemas
│   ├── users.ts              # the pgTable definition
│   └── columns.ts            # feature-specific column builders
├── orgs/
├── billing/
└── ...
```

## The `pgTable` pattern

```ts
// packages/database/src/schema/users/users.ts
import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { orgIdColumn, timestampColumns } from '../_columns'

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: orgIdColumn(),                     // mandatory on every org-scoped table
    email: text().notNull(),
    name: text().notNull(),
    ...timestampColumns(),                    // createdAt + updatedAt, both with timezone
  },
  (t) => [
    // Indexes live in the second arg, not inline
    uniqueIndex('users_org_email_unique').on(t.orgId, t.email),
    index('users_org_id_idx').on(t.orgId),
  ],
)
```

**Rules:**
- Every org-scoped table has `orgId: orgIdColumn()` (a typed column builder from `_columns.ts`).
- Every table has `createdAt` and `updatedAt` with timezone, set via `timestampColumns()`.
- Indexes go in the second argument as a returned array, not inline. This makes them greppable.
- Composite uniques use `uniqueIndex(...).on(col1, col2)`. Plain uniques use `.unique()` on the column.
- Foreign keys use `.references(() => otherTable.id, { onDelete: 'cascade' | 'restrict' | 'set null' })`.
- **Column names are written in snake_case directly** in the schema (e.g. `createdAt: timestamp('created_at', ...)`). We do not use the `casing` config — the v1 rework moved casing to `d.snakeCase.table(...)` and we don't need it.

## Reusable column builders

Centralize the columns that repeat across tables in `packages/database/src/schema/_columns.ts`:

```ts
// _columns.ts
import { uuid, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const orgIdColumn = () =>
  uuid('org_id')
    .notNull()
    .references(() => orgs.id, { onDelete: 'cascade' })
    .$type<OrgId>()  // branded type

export const timestampColumns = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})

export const softDeleteColumn = () => ({
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
```

**Branded types for IDs.** `OrgId`, `UserId`, `ProjectId` are branded TS types. Drizzle's `$type<>()` lets us type the column. This catches "passing a userId where an orgId is expected" at the type level.

## Drizzle-Zod — auto-derived schemas (v1 integrated)

In v1, the Zod integration lives at `drizzle-orm/zod`. No more separate `drizzle-zod` package.

```ts
// packages/database/src/schema/users/index.ts
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { users } from './users'

// Base schemas (auto-derived from column types)
export const UserSelectSchema = createSelectSchema(users)
export const UserInsertSchema = createInsertSchema(users)
export const UserUpdateSchema = createUpdateSchema(users)

// Refined schemas (extend with business rules)
export const CreateUserInput = UserInsertSchema.pick({ email: true, name: true })
  .extend({
    email: z.string().email().max(255),
    name: z.string().min(1).max(100),
  })

export const UpdateUserInput = UserUpdateSchema
  .pick({ name: true })
  .extend({
    name: z.string().min(1).max(100),
  })
```

**Rules:**
- The base `UserSelectSchema` / `UserInsertSchema` / `UserUpdateSchema` are **auto-derived**. Do not hand-write them.
- Business rules (`.email()`, `.min(1)`, `.max(100)`) live in the **refined** schemas (e.g. `CreateUserInput`). They are the public input contract for oRPC.
- The refined schemas are what the procedures import. The base schemas are used internally (e.g. to validate DB reads in dev).
- The refined schemas also feed OpenAPI generation. The `.email()` example appears in the docs and the playground.

**Migration from 0.x:** if a feature module is migrated from `drizzle-zod` to `drizzle-orm/zod`, the only change is the import path. The function signatures are identical.

## Column type cheatsheet

Drizzle column → inferred Zod type. Use this table when you add a new column to make sure the Zod output is what you want.

| Drizzle column | Generated Zod |
|---|---|
| `text()` | `z.string()` |
| `text({ enum: [...] })` | `z.enum([...])` |
| `varchar({ length: N })` | `z.string().max(N)` |
| `uuid()` | `z.string().uuid()` |
| `integer()` | `z.number().int()` |
| `bigint({ mode: 'number' })` | `z.number().int()` (within safe integer range) |
| `bigint({ mode: 'bigint' })` | `z.bigint()` |
| `boolean()` | `z.boolean()` |
| `timestamp({ withTimezone: true })` | `z.date()` (or `z.coerce.date()` with factory) |
| `jsonb()` | `z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.any()), z.array(z.any())])` — refine with a custom schema |
| `pgEnum(...)` | `z.enum([...])` |
| `pgGeometry(...)` | depends on shape |

For complex types (jsonb, enums with refinements), use the `createSchemaFactory` pattern with a custom Zod instance (see [Drizzle Zod docs](https://orm.drizzle.team/docs/zod)):

```ts
import { createSchemaFactory } from 'drizzle-orm/zod'
import { z } from 'zod'  // or '@hono/zod-openapi', or the oRPC Zod instance

const { createInsertSchema } = createSchemaFactory({
  zodInstance: z,
  coerce: { date: true },  // optional: coerce dates from strings
})
```

## RLS — informational only (v1 syntax note)

We do not use RLS in v1 (see [`decisions/0001-tenant-wrapper-vs-rls.md`](./decisions/0001-tenant-wrapper-vs-rls.md)). The syntax is documented here for reference in case we add it as defense-in-depth in v2.

**v1 syntax** (current Drizzle 1.0.0-rc.3):
```ts
import { pgTable } from 'drizzle-orm/pg-core'

export const users = pgTable.withRLS('users', { /* columns */ })
// or
export const users = pgTable('users', { /* columns */ }, (t) => [
  pgPolicy('policy-name', { /* ... */ }),
])
// RLS is auto-enabled when the first policy is added.
```

**0.x syntax** (deprecated, kept for migration awareness):
```ts
export const users = pgTable('users', { /* columns */ }).enableRLS()
```

In v1, `.enableRLS()` is deprecated; `pgTable.withRLS(...)` is the canonical way to declare a table as RLS-enabled without policies (default-deny). Policies added via `pgPolicy(...)` auto-enable RLS.

## Migrations

```bash
# Generate a migration from a schema change
pnpm --filter @deessejs/database db:generate

# Apply pending migrations
pnpm --filter @deessejs/database db:migrate

# Open Drizzle Studio (dev only)
pnpm --filter @deessejs/database db:studio
```

The generated SQL is **committed**, never edited. If the generator produces something wrong, the fix is in the schema definition, not in the SQL.

**v1 note on migrations folder structure.** Drizzle v1 reorganized the migrations folder: `journal.json` was removed; SQL files and snapshots are grouped into per-migration folders; `drizzle-kit drop` is gone. If we ever inherit a 0.x migration history, run `npx drizzle-kit up` to migrate it to the new layout. The first migration we generate in this project will use the v1 layout natively.

**Workflow:**
1. Edit `packages/database/src/schema/<feature>/<table>.ts`
2. Run `pnpm db:generate` — produces `packages/database/src/migrations/NNNN_<name>/migration.sql` + `snapshot.json`
3. Read the SQL by hand. Confirm it does what you expect.
4. Commit schema + migration in the same PR.
5. CI runs the full test suite + delete tests on the migration.

## What goes where — quick reference

| You want to... | Edit |
|---|---|
| Add a new column to a table | `schema/<feature>/<table>.ts` + generate migration |
| Add a new index | `schema/<feature>/<table>.ts` (second arg) + generate migration |
| Add a new business validation rule | `schema/<feature>/index.ts` (refined schema) |
| Add a new table | `schema/<feature>/<new-table>.ts` + `_columns.ts` if reusable + generate migration |
| Add a new Zod refinement pattern | `schema/_zod-refinements.ts` (shared utilities) |
| Use a custom Zod instance (e.g. for OpenAPI) | `createSchemaFactory({ zodInstance })` in `schema/<feature>/index.ts` |
