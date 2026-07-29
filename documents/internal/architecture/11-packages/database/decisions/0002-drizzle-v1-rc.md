# 0002. Drizzle ORM: ship 0.45.x, plan v1 migration

- **Status:** Accepted
- **Date:** 2026-06-19
- **Deciders:** founder, tech lead
- **Scope:** `packages/database`, `drizzle-orm` and `drizzle-kit` dependencies

## Context and problem statement

We need to pick a `drizzle-orm` major version to ship in `packages/database`. Two candidates:

1. **`drizzle-orm@1.0.0-rc.3`** — release candidate. Includes RQBv2 (global `defineRelations`, `from`/`to`, `through()`), JIT mappers + `.prepare()`, Zod integration (`drizzle-orm/zod`).
2. **`drizzle-orm@0.45.2`** — latest 0.x stable. Per-table `relations(table, ...)`, separate `drizzle-zod` package, mature and battle-tested.

The version choice has real consequences: it affects the perf profile, the dep surface, and what features the rest of the system can build on.

**Critical constraint discovered during analysis**: the Better Auth Drizzle adapter does **not** support `drizzle-orm@1.x` as of 2026-06-19. [Issue #6766](https://github.com/better-auth/better-auth/issues/6766) is open, assigned to a maintainer, with no resolution timeline. The adapter reads `db._.fullSchema` (a 0.x internal API) which doesn't exist in v1. Attempting to use v1 throws:

```
BetterAuthError: [# Drizzle Adapter]: The model "user" was not found in the schema object.
```

We cannot ship v1 today without breaking the auth layer.

## Considered options

### Option 1 — Ship `drizzle-orm@0.45.2` (chosen)

- Pros: Better Auth works out of the box. Stack is stable. No perf-critical JIT (we lose 25-30% latency gains on hot paths). Per-table `relations()` is more verbose but equivalent in power.
- Cons: We commit to a future migration. No JIT mappers (the headline perf feature of v1). `defineRelations` global API is not available.

### Option 2 — Ship `drizzle-orm@1.0.0-rc.3` and abandon Better Auth

- Cons: We lose `organization()`, `admin()`, `apiKey()`, `passkey()`, `twoFactor()`, `magicLink()`, OAuth providers, RBAC matrix, security fixes from the June 2026 advisory cycle. We'd reimplement 6+ months of upstream work. Inacceptable.

### Option 3 — Wait for Better Auth to support Drizzle v1

- Cons: Unknown timeline. Issue #6766 is assigned but no ETA. We block the entire product.

## Decision

**Ship `drizzle-orm@^0.45.2` and `drizzle-kit@^0.30.1`. Pin to exact versions in `package.json` (no caret), to match the security discipline established for `better-auth`.**

When Better Auth's adapter ships v1 support (issue #6766 closed), bump to `drizzle-orm@1.0.0` and migrate to v1 idioms (`defineRelations`, `from`/`to`, `through()`, JIT). Estimate: 1 day of work.

## Why

### The Better Auth adapter is a hard dependency

`packages/auth` is the load-bearing layer for spec 1-2-7. Reimplementing it is out of scope. Pinning to 0.x is the only path that keeps Better Auth working.

### The perf losses are recoverable, not permanent

JIT mappers (-25 to -30% latency) are valuable but not critical for v1 of DeesseJS. The product's success depends on shipping the wedge (modular contract, multi-tenant isolation, public REST) — not on squeezing every ms out of pg queries. When Better Auth supports v1, we recover the JIT perf without rewriting business logic.

### The 0.x stack is mature and battle-tested

`drizzle-orm@0.45.2` is the production stable line. Every API we'll use is documented, tested, and shipped in production by many users. No surprises, no RC quirks.

### The migration cost is bounded

When we migrate to v1, the changes are:
1. `package.json` version bump
2. `src/relations/<feature>/<table>.ts` rewrite: per-table `relations()` → global `defineRelations()`
3. `queries.md` adds the JIT section back
4. `relations.md` adds `from`/`to`, `through()`, polymorphic filters
5. The `experimental.joins: true` flag in Better Auth adapter (already there)

Estimated: ~1 day of work, ~200 lines of diff across the docs and code.

## Tradeoffs accepted

- **No JIT mappers.** All queries go through the regular mapper. Estimated +20-30% latency on pg-heavy paths.
- **Per-table `relations()`.** More verbose than v1's global API. ~10-20% more lines per table file.
- **`fields`/`references` syntax.** v1's `from`/`to` is more readable. We live with `fields`/`references` for now.
- **No `through()` for many-to-many.** Queries drill through the junction table manually.
- **No polymorphic / pre-filtered relations.** Filtering happens at query time, not relation definition time.
- **No `optional: false` on relations.** Nullable by default, like 0.x always was.
- **No Zod integration in `drizzle-orm`.** We use the separate `drizzle-zod` package (still supported in 0.45.2).

None of these are blockers. They are papercuts that we document.

## Why we might revisit

- **Better Auth ships v1 adapter support** (issue #6766 closed). Move to v1 within a sprint.
- **A competitor to Better Auth emerges that targets v1 first.** Unlikely; Better Auth is the most mature option for the SaaS template niche.
- **The perf gap becomes user-visible.** If a buyer complains about p95 latency on a 1000+ req/s workload, we consider a hot-path workaround (manual prepared statements for the 2-3 most-called queries).

## Implementation

### Today (0.45.x)

- `packages/database/package.json`: `drizzle-orm: ^0.45.2`, `drizzle-kit: ^0.30.1`
- `src/client/index.ts`: `drizzle(url, { schema })` — no JIT, no `relations` parameter
- `src/relations/`: does NOT exist as a directory (per-table relations live in each `pgTable` file)
- `src/schema/<feature>/<table>.ts`: exports both `pgTable(...)` and `relations(table, ...)` (per-table pattern)
- `src/schema/index.ts`: `export *` from each feature module (relations are auto-discovered)
- `drizzle-zod` is a separate dev dep for Zod schema generation

### Future (v1, when Better Auth supports it)

- Bump `drizzle-orm` to `1.0.0`, `drizzle-kit` to `1.0.0`
- Rewrite `src/relations/` as a single `defineRelations(schema, ...)` call
- Remove per-table `relations(table, ...)` from each table file
- Update `queries.md` to enable JIT (`.prepare()` + `jit: true` in drizzle config)
- Update `relations.md` for the new API (from/to, through, etc.)
- Update tests (the test pattern is mostly API-stable; small adjustments for `.prepare()` if used)
- Bump `packages/database/decisions/0002-drizzle-v1-rc.md` → mark as superseded, link to the v1 ADR

## References

- [Better Auth issue #6766 — Drizzle v1 support](https://github.com/better-auth/better-auth/issues/6766) — the constraint that pinned us to 0.x
- [Drizzle — Relations v0.x](https://orm.drizzle.team/docs/rqb)
- [Drizzle — Latest releases](https://orm.drizzle.team/docs/latest-releases) — version timeline
- [Drizzle v1.0.0-rc.1 changelog](https://github.com/drizzle-team/drizzle-orm/blob/beta/changelogs/drizzle-orm/1.0.0-rc.1.md) — the v1 features we're waiting for
- `packages/database/relations.md` — the per-table pattern we use today
- `packages/database/queries.md` — the query patterns we use today
