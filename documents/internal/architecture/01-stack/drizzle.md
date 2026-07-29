# Drizzle ORM

## Decision

**Drizzle ORM** as the only ORM for every Postgres-backed app in the repo.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Drizzle is used by:

- Every Next.js app that has a database (template, web, docs, demo, lite, cloud).
- The CLI does **not** talk to a database directly — it goes through the SDK.

## What Drizzle gives us

1. **Type-safe schema as TypeScript.** No separate schema language, no codegen step beyond migrations.
2. **SQL-shaped query builder.** `db.select().from(users).where(eq(users.id, id))` reads like SQL but is fully typed.
3. **Edge-friendly.** Drizzle works on edge runtimes (Vercel Edge, Cloudflare Workers) without a TCP connection requirement.
4. **Drizzle Kit for migrations.** Generates SQL migration files from schema changes; reversible migrations supported.
5. **No runtime abstraction leak.** We write real SQL through Drizzle. No "magic" ORM behavior to debug.

## Why Drizzle (not Prisma, not Kysely, not raw SQL)

| Alternative | Why not |
|---|---|
| **Prisma** | Heavy runtime, generates a separate schema language, slower on edge runtimes. Schema drift between TS and Prisma schema is a known pain. |
| **Kysely** | Type-safe query builder, but no schema/migration story. We'd hand-write migrations. |
| **Drizzle + Kysely together** | Overkill. Drizzle covers both schema and queries. |
| **Raw SQL with `pg`** | Lose type safety on queries. Reimplement the query builder. |
| **TypeORM** | Decorator-heavy, less TypeScript-native, smaller community in 2026. |
| **MikroORM** | Identity-map pattern, more complex than we need. |

Drizzle wins on:

- **Schema in TypeScript** (matches our stack).
- **Edge compat** (Vercel, Cloudflare Workers).
- **Single tool** for schema + queries + migrations.
- **Active development** with strong typing story.

## Conventions

- **Every table is org-scoped.** The `orgId` mixin in `architecture/02-data-model/multi-tenancy.md` is the contract.
- **Schema files in `db/schema/<name>.ts`** per feature module. Exported from `db/schema/index.ts` (matching the modular contract: public surface only).
- **Drizzle Kit migrations in `db/migrations/`.** Generated, committed, reviewed by hand.
- **Zod schemas live next to Drizzle schemas** for input validation. Re-exported from `db/schema/<name>.ts`.
- **Migrations are reversible.** Every migration has an `up` and a `down` in the same file (or paired files).
- **CI runs the full migration + delete tests** on every PR that touches schema.

## Migrations workflow

1. Edit `db/schema/<feature>.ts`.
2. `pnpm drizzle-kit generate` produces the SQL migration in `db/migrations/`.
3. Read the generated SQL by hand. Never trust the generator.
4. Update the relevant `02-data-model/<feature>-schema.md` in the same PR.
5. Update ADRs in `10-decisions/` if the schema change introduces a new pattern.
6. CI runs the full test suite + delete tests on the migration.

## Performance

- Use `db.select({...})` projections, not `db.query.*` for hot paths.
- Add indexes via Drizzle's `index()` and `uniqueIndex()` schema helpers.
- For tenant isolation, the `orgId` column is always indexed and present in WHERE clauses.

## Cross-references

- [`../02-data-model/`](../02-data-model/) — the data layer architecture (multi-tenancy, schema per feature, migration strategy).
- [`../05-modular-contract/`](../05-modular-contract/) — how feature modules expose their schema (via `db/schema/<name>.ts`'s `index.ts`).
- [`../10-decisions/`](../10-decisions/) — ADR for the ORM choice (when written).
- [`../../product/features/02-orgs-and-rbac.md`](../../product/features/02-orgs-and-rbac.md) — the org-scoped data model.
