# 0001. Tenant isolation: application-layer filter, not Row-Level Security

- **Status:** Accepted
- **Date:** 2026-06-19
- **Supersedes:** none (the earlier draft `0001-tenant-wrapper-vs-rls.md` described the same idea with a class-based wrapper; that framing has been retired in favor of plain functions).
- **Deciders:** founder, tech lead
- **Scope:** `packages/database` + `packages/api`

## Context and problem statement

DeesseJS is a multi-tenant SaaS template. Every org-scoped table has an `orgId` column. Every read and write must be filtered to the active org. A bug in this filtering is a **catastrophic data breach** — tenant A reading or writing tenant B's data.

Two serious options for enforcing tenant isolation:

1. **Application-layer filter** — every data-access function in `packages/database` takes `(db, orgId, ...args)` explicitly and injects `orgId` into every query. Procedures call the functions. Tests are in TS, per-function.
2. **Row-Level Security (RLS)** — Postgres-level policies that filter rows based on the current role / `current_setting('request.jwt.claims')`. Policies live in the schema, in SQL.

Drizzle supports both. RLS has explicit support via `pgTable.withRLS(...)` / `.enableRLS()` (v1 / 0.x), `pgPolicy()`, and provider-specific helpers (`drizzle-orm/neon`, `drizzle-orm/supabase`).

## Considered options

### Option 1 — Application-layer filter via data-access functions (chosen)

- One module per feature in `packages/database/src/<feature>.ts`.
- Each function takes `(db, orgId, ...args)` and injects `orgId` into every query.
- Procedures call the functions with `context.db` and `context.orgId`.
- Cross-tenant tests are normal Vitest + real Postgres tests.
- Lint rules prevent procedures from importing `drizzle-orm` directly.

### Option 2 — RLS only

- Every org-scoped table has `pgTable.withRLS(...)` and explicit `pgPolicy()` definitions (v1 syntax).
- A `createDrizzle` wrapper sets the JWT claims and the role on every transaction.
- Procedures call `db.query.X.findMany(...)` as if the table were single-tenant — RLS does the filtering.
- Tests need to set the role / JWT claims to exercise different tenants.

### Option 3 — Both (defense in depth)

- Functions as the primary mechanism, RLS as a backstop.
- RLS catches what the functions miss; the functions catch what RLS misconfigures.
- The complexity of both is paid.

### Option 4 — Neither (rely on developer discipline)

- Every query hand-writes `eq(t.orgId, $orgId)`.
- No enforcement, no test coverage. The wedge dies.

## Decision

**Option 1 (application-layer filter, functional style) for v1, with the option to add Option 3 (RLS as backstop) in v2.**

## Why

### Functions are testable per-procedure

A cross-tenant test for `findById(db, orgB, userInOrgA.id)` is a normal Vitest + real Postgres test. It runs in CI on every PR. It catches regressions at the unit boundary, not in production.

RLS tests require setting the role and the JWT claims. They are slower, harder to read, and exercise Postgres internals more than our code. A failure points at "the policy is wrong" — debugging happens in SQL with `EXPLAIN` and policy inspection.

### Functions play nicely with the modular contract

The DeesseJS wedge is "every feature is self-contained and deletable." Each data-access module is a per-feature file. Removing the feature removes the module. RLS policies, in contrast, are spread across the schema — deleting a feature leaves orphan policies in the migration history.

### Functions are debuggable in the language we work in

A cross-tenant bug surfaces as a TypeScript stack trace. The fix is in the function. RLS bugs surface as Postgres errors (`new row violates row-level security policy`) with a stack trace pointing at SQL. Fixing them means editing the schema and generating a migration.

### Functions keep the door open for non-Postgres adapters (later)

Drizzle supports SQLite, MySQL, and others. The functions are database-agnostic at the type level. RLS is Postgres-specific. If we ever need to support SQLite for a buyer's local dev, the functions travel; the RLS policies don't.

### Functions are Drizzle-version-agnostic

The functions rely on the public `db.select()/.insert()/.update()/.delete()` API, which has been stable since 0.x. Migrating between Drizzle versions does not require touching the functions. This is a structural property of the approach, not an accident — and it de-risks our v1 choice (see [`0002-drizzle-v1-rc.md`](./0002-drizzle-v1-rc.md)).

### No design patterns, no boilerplate

The original draft of this ADR proposed a `TenantRepo` class. We retired that approach: a class with `(db, orgId)` in the constructor hides state, requires construction, and produces ~50 small classes that all look the same. A module of plain functions is more direct:

```ts
// packages/database/src/users.ts
export async function findById(db, orgId, id) { ... }
export async function list(db, orgId, opts) { ... }
```

The `orgId` is always visible. TypeScript enforces it. The procedure calls `users.findById(ctx.db, ctx.orgId, id)` — explicit, no `context.repos.users.findById(id)` indirection.

### RLS is a v2 optimization, not a v1 necessity

RLS adds defense in depth. It catches the functions' bugs. But it also adds operational complexity (the JWT-claims wrapper, the policy audit trail, the role management). For a v1 template, the functions are the simpler, testable, debuggable choice. RLS can be added in v2 once the functions are stable and battle-tested.

## Tradeoffs accepted

- **No defense in depth in v1.** A function bug is a security bug. The mitigation is comprehensive per-function tests and code review. If we ship a function bug, the data is leaked.
- **The function can be bypassed.** A procedure that calls `db.select()` directly (bypassing the functions) has no tenant filter. The lint rules + the modular contract + code review are the safeguards. A bug here is a critical security incident.
- **No RLS-level "default deny".** A misconfigured table without `orgId` in the function is not protected at the DB level. Mitigation: the schema always uses `orgIdColumn()` (the typed builder), so every org-scoped table is required to have the column.
- **More boilerplate per table.** Each table needs its own module of functions. For ~50 tables in the spec corpus, this is ~50 small files. Each is 50-100 lines. No class boilerplate, no constructor. The cost is acceptable.

## Why we might revisit

- **Function bugs in production.** If we ship multiple cross-tenant leaks caused by function bugs (not by bypass), RLS becomes the backstop. Move to Option 3.
- **Compliance requirements.** Some compliance regimes (HIPAA, certain financial regulations) require defense-in-depth at the data layer. Adding RLS satisfies auditors.
- **Operational complexity manageable.** Once the JWT-claims wrapper is in place, RLS is mostly declarative. Worth the cost if the org scale grows.

## Consequences

**Positive:**
- The functions are testable per-feature. CI catches regressions.
- The modular contract is preserved — the function module is a per-feature file.
- The functions keep the door open for non-Postgres adapters in v2+.
- The functions are Drizzle-version-agnostic — bumps don't touch them.
- Debugging happens in TypeScript, not in SQL policy introspection.
- No design patterns, no factories, no classes. Plain functions, explicit parameters.

**Negative:**
- No defense in depth. A function bug is a production incident.
- The lint rules are load-bearing. If they're bypassed or removed, the functions can be skipped.
- ~50 small files of functions to maintain across the spec corpus. Each is simple; the count is the cost.

**Neutral:**
- RLS can be added later as a backstop. Not locked out.

## Implementation

- The data-access function pattern is documented in [`../tenant-isolation.md`](../tenant-isolation.md).
- The schema conventions (`orgIdColumn()`, `timestampColumns()`) are in [`../schema.md`](../schema.md).
- The cross-tenant test pattern is documented and runs in `tests/integration/<feature>.test.ts` for every org-scoped function.

## References

- [`../tenant-isolation.md`](../tenant-isolation.md) — the functional data-access pattern, the cross-tenant test, the lint rules
- [`../schema.md`](../schema.md) — the `orgIdColumn()` typed builder
- [`0002-drizzle-v1-rc.md`](./0002-drizzle-v1-rc.md) — the Drizzle v1 RC version decision
- [`../../../06-security/`](../../../06-security/) — security posture (this ADR is the data-layer expression of the security model)
- Drizzle RLS docs (researched 2026-06-19): https://orm.drizzle.team/docs/rls
- Spec 23.30 — multi-tenant test scenarios
- Spec 20.4 — tenant context middleware
