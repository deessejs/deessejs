# Relations — Drizzle 0.x (per-table `relations()`)

How to define relations between tables in DeesseJS. Uses the **per-table** `relations(table, ...)` pattern (Drizzle 0.x). Each table that has relations exports them alongside its `pgTable` definition.

> **Version note.** Built on `drizzle-orm@^0.45.2`. We pin to 0.x because Better Auth's adapter does not yet support drizzle-orm v1 (see [issue #6766](https://github.com/better-auth/better-auth/issues/6766)). When the adapter ships v1 support, we migrate to the global `defineRelations(...)` API.

> **What's different vs v1.** Drizzle v1 introduced a global `defineRelations(schema, ...)` API with `from`/`to` keys and `through()` for many-to-many. We don't use it (incompat with Better Auth adapter). 0.x uses per-table `relations(table, ...)` with `fields`/`references`. Many-to-many is via junction tables explicitly in queries.

## The pattern

Each table file in `src/schema/<feature>/` exports:
1. The `pgTable(...)` definition
2. A `relations(table, ...)` call, named `<tableName>Relations`

```ts
// src/schema/users/users.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from './sessions'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  // one-to-many : a user has many sessions
  sessions: many(sessions),
}))
```

```ts
// src/schema/sessions/sessions.ts
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const sessions = pgTable('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  // many-to-one : a session belongs to one user
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
```

The relations are auto-discovered from the schema namespace via `export *`:

```ts
// src/schema/index.ts
export * from './users/users'    // exports `users` AND `usersRelations`
export * from './sessions/sessions'  // exports `sessions` AND `sessionsRelations`
```

The Drizzle client picks up the relations automatically when it reads `schema`:

```ts
// src/client/index.ts
import { schema } from '../schema'
import { drizzle } from 'drizzle-orm/postgres-js'

drizzle(env.DATABASE_URL, { schema })  // relations are part of `schema`
```

## Many-to-many

We use a **junction table** explicitly. The relation is defined twice — once on each "many" side, and the junction table itself is just a regular table.

```ts
// src/schema/projects/projects.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { usersToProjects } from './users-to-projects'

export const projects = pgTable('projects', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
})

export const projectsRelations = relations(projects, ({ many }) => ({
  usersToProjects: many(usersToProjects),
}));
```

```ts
// src/schema/projects/users-to-projects.ts
import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '../users/users'
import { projects } from './projects'

export const usersToProjects = pgTable(
  'users_to_projects',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId] })],
)

export const usersToProjectsRelations = relations(usersToProjects, ({ one }) => ({
  user: one(users, { fields: [usersToProjects.userId], references: [users.id] }),
  project: one(projects, { fields: [usersToProjects.projectId], references: [projects.id] }),
}));
```

Querying requires drilling through the junction in the typed query API. There is no `through()` helper in 0.x. This is more verbose than v1 but explicit.

## `fields` / `references` — the join syntax

The `one(table, { fields, references })` API:
- `fields`: an array of columns on **this** table (the side where the FK lives).
- `references`: an array of columns on the **other** table (the side being joined to).

Both arrays must have the same length. Order matters — they're paired index-wise.

```ts
// sessions has `userId`. users has `id`. Join: sessions.userId -> users.id.
one(users, {
  fields: [sessions.userId],
  references: [users.id],
})
```

Composite keys (rare) work the same way:
```ts
one(orders, {
  fields: [lineItems.orderId, lineItems.tenantId],
  references: [orders.id, orders.tenantId],
})
```

## Aliases — disambiguating two relations between the same tables

When the same two tables have multiple relations (e.g. `posts.authorId` → `users.id` AND `posts.reviewerId` → `users.id`), use `relationName` to disambiguate:

```ts
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
    relationName: 'post_author',
  }),
  reviewer: one(users, {
    fields: [posts.reviewerId],
    references: [users.id],
    relationName: 'post_reviewer',
  }),
}))
```

Without `relationName`, Drizzle errors because it can't disambiguate the join.

## Polymorphic / pre-filtered relations

**Not supported in 0.x.** v1 added `where: { field: value }` at the relation definition level. In 0.x, the same filtering happens at the **query** level:

```ts
// 0.x : filter at query time
const projects = await db.query.projects.findMany({
  where: (projects, { eq }) => eq(projects.archived, false),
  with: { tasks: true },
})
```

## Filtering by relation (v2 RQB feature)

**Not supported in 0.x.** v1 RQBv2 added `where: { posts: { content: { like: 'M%' } } }` syntax. In 0.x, you write a manual join or a subquery.

## Indexing for join performance

Indexes are not optional. Joins on relations are the hot path.

**One-to-one:** index the FK column on the **target** table (the one with the FK column).

```ts
export const profileInfo = pgTable('profile_info', {
  id: integer().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  metadata: jsonb(),
}, (t) => [
  index('profile_info_user_id_idx').on(t.userId),  // ← required
])
```

**One-to-many:** index the FK on the **many** side (the table with the FK column).

```ts
export const posts = pgTable('posts', {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull(),
}, (t) => [
  index('posts_author_id_idx').on(t.authorId),  // ← required
])
```

**Many-to-many:** index both FK columns individually **and** as a composite on the junction table.

```ts
export const usersToGroups = pgTable('users_to_groups', {
  userId: uuid('user_id').notNull().references(() => users.id),
  groupId: uuid('group_id').notNull().references(() => groups.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] }),
  index('utg_user_id_idx').on(t.userId),
  index('utg_group_id_idx').on(t.groupId),
  index('utg_composite_idx').on(t.userId, t.groupId),
])
```

## What goes where — quick reference

| You want to... | Do |
|---|---|
| Add a one-to-many relation | Define `many(...)` on the "one" side, `one(..., { fields, references })` on the "many" side. |
| Add a many-to-many relation | Create a junction table with composite PK, define `many(...)` from each side to the junction, `one(...)` from junction to each side. |
| Disambiguate two relations on the same tables | Use `relationName` on both `one(...)` calls. |
| Filter by relation in a query | Manual join or subquery (0.x limitation). |
| Index for join performance | FK column on the many side; composite + per-FK on junction tables. |
| Migrate to v1 (when Better Auth supports it) | Replace per-table `relations(table, ...)` with global `defineRelations(schema, ...)`. Use `from`/`to` instead of `fields`/`references`. Add `through()` for m2m. |

## References

- [Drizzle — Relations v0.x](https://orm.drizzle.team/docs/rqb) — the official v0.x docs (note: v1 docs at `/docs/rqb-v2` and `/docs/relations-v2`)
- [Better Auth issue #6766](https://github.com/better-auth/better-auth/issues/6766) — the upstream constraint that pins us to 0.x
- [`../database/decisions/0002-drizzle-v1-rc.md`](../database/decisions/0002-drizzle-v1-rc.md) — the version decision and the v1 migration plan
