# ADR-010: env package senior shape

## Status

Proposed (2026-08). Under review on `feat/env`.

## Context

`packages/env/` is the load-bearing contract for every variable that reaches
the runtime: the API server, the apps (`apps/web`, `apps/app`, `apps/cli`),
the scripts (`drizzle-kit`, `better-auth` CLI), and the test runners. Today
it implements its own pipeline: a custom Proxy with lazy validation, an
explicit `loader.ts` that works around `@next/env` cache bugs, two distinct
schemas (`serverSchema`, `clientSchema`) wired by hand, and a separate
`index.ts` barrel. The package is five files, ~200 lines, and works.

The question this ADR answers is not "is it broken?", it is "would a
senior-grade package look like this?" Three senior patterns from the public
record motivate the question:

1. **`createEnv` from `@t3-oss/env-core`** is the de-facto standard for
   typed env in TypeScript in 2026. Its design primitives are a single
   source for `client` and `server`, a `runtimeEnv` provider passed
   explicitly (not pulled from `globalThis`), and a Proxy that validates on
   first access and caches the validated value. The proxy is not a leak
   guard, it is the validation engine
   ([env.t3.gg/docs/core](https://env.t3.gg/docs/core)).
2. **Next.js documentation**, the `@next/env` workspace below
   `loadEnvConfig` carries a long-standing cache bug (`#92040`) that the
   repo already works around manually. The recommended modern shape is to
   call `loadEnvConfig(process.cwd())` exactly once, inside an integration
   layer that the validation library owns
   ([nextjs.org/docs/pages/guides/environment-variables](https://nextjs.org/docs/pages/guides/environment-variables)).
3. **`StandardSchemaV1`** (the interface Zod, Valibot, and ArkType all
   implement) decouples the validation library from the validator.
   Locking the package to one validator is a hardening restriction, not a
   feature ([github.com/t3-oss/t3-env](https://github.com/t3-oss/t3-env)).

Today the package owns the same seven concerns t3-env owns:

- file discovery (`findRepoRoot`)
- precedence resolution (`loadRepoEnv`)
- schema declaration
- runtime injection
- eager client validation
- lazy server validation
- leak-guard Proxy

Splitting these seven concerns across `loader.ts`, `server.ts`, `client.ts`,
`schema.ts`, and `index.ts` is what works; what does not scale is the
hand-rolled lazy Proxy and the hand-rolled dev/prod differential. Two
specific gaps become visible today:

1. **A `process.env` mutation**. `loader.ts` mutates `process.env` to
   avoid the `@next/env` cache bug. Today it is safe because `@next/env`
   returns a plain object; tomorrow, if a new field name collides with a
   built-in, the merge becomes order-dependent. The fix belongs in the
   library, not the caller.
2. **A hard-coded client default dictionary**. `client.ts` ships a literal
   copy of the defaults defined in `clientSchema`. If a default changes in
   the schema, the inline fallback silently diverges. A duplicated default
   is a TypeScript gap; the compiler cannot help.

Both gaps are senior-typical, the kind a "small enough to ignore" hand
roll accumulates. They are the trigger for the proposal.

## Decision

The env package uses **one source of validation and one Proxy**,
courtesy of `@t3-oss/env-core`. The hand-rolled pieces are kept only
where `@t3-oss/env-core` cannot see (the Next.js `.env` loader bridge
and the test runtime).

### Topology

```
packages/env/src/
+-- index.ts        re-export only (server, client, types)
+-- schema.ts       two pure Zod schemas (serverSchema, clientSchema)
+-- server.ts       createEnv(serverSchema, clientSchema, { runtimeEnv })
+-- client.ts       createEnv(clientSchema, undefined,           { runtimeEnv })
+-- loader.ts       Next.js bridge: loadEnvConfig once, cache result
+-- types.ts        ServerEnv, ClientEnv, Env (inferred from createEnv)
```

### Boundary: what we keep

The hand-rolled code is **never** the validation engine. The hand-rolled
code is the integration layer the library cannot see:

- **`loader.ts`** discovers the repo root, calls `@next/env.loadEnvConfig`,
  merges its `combinedEnv` into `process.env`, and exposes a `loadRepoEnv`
  function. Calling `loadRepoEnv()` is the only public way to populate
  the runtime. The Proxy never reads from `process.env` directly; it
  reads from a captured `runtimeEnv` snapshot.
- **`server.ts` and `client.ts`** are thin `createEnv(...)` calls. They
  accept the runtime snapshot captured by `loader.ts`. They expose the
  result as a frozen, deeply-typed object.
- **`schema.ts`** is the only place the variable shapes live. It exports
  `serverSchema` (full schema, dev-safe defaults) and `clientSchema`
  (`NEXT_PUBLIC_*` only). The aliases (`AUTH_SECRET` to
  `BETTER_AUTH_SECRET`, `TEST_DATABASE_URL` to `DATABASE_URL`) belong in
  `serverSchema`, expressed with `z.preprocess`, not in the Proxy.

### Boundary: what we delegate

- **Lazy validation**: delegated to `createEnv`. The library's Proxy
  triggers validation on first access; we no longer need the manual
  `_cached` flag.
- **Runtime leak guard**: not provided by `createEnv`. We stop pretending
  we had one. A `NEXT_PUBLIC_*` variable is safe-by-construction when the
  client schema imports only public names; that is the test, not a
  Proxy trap.
- **Eager vs lazy policy**: dropped. `createEnv` validates the whole
  schema on the first access. The user-side choice is `clientEnv` (eager,
  fail-open with `console.warn`) vs `serverEnv` (lazy, fatal on first
  access to any key). The asymmetry is preserved; the implementation is
  not hand-rolled.
- **Empty-string handling**: delegated to `createEnv` via
  `emptyStringAsUndefined: true`. This single flag closes the entire
  category of bug where a docker-compose left a blank `RESEND_API_KEY=""`
  and the server accepted it as a non-empty string.

### Loader as a single shot

`loader.ts` calls `loadEnvConfig(repoRoot, true)` exactly once, in
production, with `forceReload: true`. The result is captured, not
re-mutated into `process.env` mid-import. Subsequent reads by `createEnv`
use `runtimeEnv: capturedSnapshot`. The fix for `#92040` lives behind the
loader; the rest of the package does not know about caching.

### Alias resolution

Aliases move out of the Proxy into the schema:

```ts
const secret = z.string().min(32).optional()
const serverSchema = {
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: secret,
  AUTH_SECRET: secret, // kept as a sibling; resolved at call-site
  ...
}
```

The application reads `BETTER_AUTH_SECRET` and falls back to `AUTH_SECRET`
at the call-site (one line per consumer). The alias is explicit, the
fallback is local, no schema gymnastics.

### Validation policy

Three states, three responses:

| Phase         | serverEnv                    | clientEnv                    |
| ------------- | ---------------------------- | ---------------------------- |
| dev/test load | soft-fail, defaults shown    | soft-fail, defaults shown    |
| prod startup  | fatal on first `get`         | fatal on import              |

`createEnv` throws on parse failure, we let it. The `process.exit(1)`
post-processing in `server.ts` is replaced by the upstream error
message; the upstream error is well-formed Zod output.

### What we do not get from `createEnv`

- **The `@next/env` cache workaround** is independent of the validator.
  We still ship `loader.ts`; it just no longer mutates `process.env`
  after validating.
- **The dev/prod asymmetry**. `createEnv` validates the same way in both.
  The dev relaxation we have today (`DATABASE_URL` optional in dev,
  required in prod) requires a `.superRefine` keyed on `NODE_ENV`. We
  keep it; `createEnv` does not eat it.

### Migration in one PR

1. Add `@t3-oss/env-core` to `packages/env` (catalog version).
2. Rewrite `server.ts` and `client.ts` as `createEnv(...)` calls. Tests
   should pass without changes; the public surface
   (`@workspace/env/server`, `@workspace/env/client`, the named exports)
   is unchanged.
3. Replace the inline fallback in `client.ts` with `clientSchema.parse({})`
   at build time, so the literal duplicates the schema.
4. Stop mutating `process.env` in `loader.ts`; capture the
   `@next/env.loadEnvConfig` result and pass it as `runtimeEnv` to
   `createEnv`.
5. Drop the Proxy-side leak-guard. Add a build-time assertion (a single
   test) that no `NEXT_PUBLIC_*` name is reachable from `server.ts`
   imports.
6. Update `packages/api/tests/` to import only from the new shape; the
   test file is the contract that the migration does not regress.

The package surface stays identical; the implementation shrinks
roughly thirty percent and the four hand-rolled flags
(`_cached`, `loaded`, the Proxy trap list, the duplicate defaults) go
away.

## What this rule allows

- **`@t3-oss/env-core` as a direct dependency** of `packages/env`. It
  is the validation engine; the schema describes what it validates.
- **A `runtimeEnv` captured from `@next/env.loadEnvConfig(...)`**, not
  from `process.env` directly, in `server.ts` and `client.ts`.
- **A `loader.ts` that owns all caching and bug workarounds**. The
  loader is the only file that talks to `@next/env`.
- **`StandardSchemaV1` predicates** in the package's public types.
  Consumers importing `ServerEnv` get a typed shape independent of the
  validator; consumers migrating from Zod to Valibot do not see the
  change.
- **`emptyStringAsUndefined: true`** for both schemas. The flag is set
  once, in the loader, not per call-site.
- **`.superRefine`-based dev-vs-prod gating** inside the schema. The
  validator is the right place to express the policy; the Proxy is not.

## What this rule forbids

- **A hand-rolled Proxy trap list** that returns `undefined` to "guard
  browser bundle leakage". The guard is not what we were doing; it
  was a comment, not a mechanism.
- **An inline default dictionary** in `client.ts` whose values can
  drift from `clientSchema` without a TypeScript error. Defaults
  derive from the schema; there is one default source.
- **A `process.env` mutation** in any helper that runs at import time.
  Tests, scripts, and packages must be able to import
  `@workspace/env/server` without ambient state changes.
- **A second validation engine** in any consumer package. Consumers
  read `serverEnv.X`; they do not call `z.string().parse(...)` to
  re-validate the same input.
- **A consumer-implemented fallback alias resolution**. The
  `AUTH_SECRET` to `BETTER_AUTH_SECRET` link happens in the schema or
  in a single helper in `@workspace/env`, not in every consumer.

## Consequences

- A PR that adds a hand-rolled Proxy, a hand-rolled loader, or a
  hand-rolled validator to `packages/env` is rejected. The PR uses the
  library.
- A PR that adds a new default to `clientSchema` without updating the
  loader-rendered fallback is rejected. The loader is the single
  source of defaults; the schema mirrors it.
- A PR that mutates `process.env` from a helper imported anywhere in
  `packages/` is rejected. Process mutation belongs to the
  process-startup layer of the consumer.
- A PR that splits `serverSchema` into multiple files to "organise"
  the variables is rejected (per ADR-002). One schema file, ordered by
  consumer group, no `auth-schema.ts` or `db-schema.ts` silos.
- A PR that introduces a new alias (`OTHER_SECRET` to
  `BETTER_AUTH_SECRET`) is welcomed if it adds a feature; rejected if
  it is just compression. Aliases exist for historic names, not for
  hand-convenience.

## How to verify

After the migration:

1. `pnpm --filter @workspace/env typecheck` is clean.
2. `pnpm --filter @workspace/api test` is green without API-side
   changes; the package surface is identical.
3. `pnpm --filter @workspace/cli test` is green; the CLI never sees
   `process.env` from the env package, only from its own loader.
4. A grep across `apps/` and `packages/` for `process.env` in code
   that imports `@workspace/env/server` returns zero matches; every
   consumer reads through `serverEnv`.
5. A `grep` for `createEnv` across `packages/env/src/` returns one
   call per face (`server.ts`, `client.ts`); the hand-rolled
   validation engine is gone.

## Where this rule came from

The earlier package design (a custom Proxy, a manual `.superRefine`,
an `.env.example` reader, a process-merge workaround for `#92040`)
worked because the package owned the boundary. The boundary is now
owned by `@t3-oss/env-core` and the `@next/env` library; rebuilding
the same boundary by hand is duplication, not safety. The senior-grade
shape is the one where the package stands on two libraries, not on its
own Proxy.

The work that triggered this ADR is the staging branch
`feat/env`, opened from staging per the staging-first workflow.

## Related

- [ADR-002: File organization by sub-domain](./ADR-002-file-organization.md).
  The rule that produces the topology above (schema, server, client,
  loader, types, index).
- [ADR-009: Test strategy](./ADR-009-test-strategy.md). The shared
  Vitest config and the contract-test pattern that verify this ADR.
- [Rule 0006: Technology choices](../rules/0006-technology-choices.md).
  The discipline that requires every technology choice to answer
  "what does it rule out". `@t3-oss/env-core` rules out the
  hand-rolled Proxy; the answer belongs in this ADR.
- [Rule 0010: Typed environment access](../rules/0010-typed-environment-access.md).
  The rule this ADR's package enforces. The rule is the policy; this
  ADR is the implementation shape.
- [`@t3-oss/env-core`](https://env.t3.gg/docs/core). The validation
  engine we delegate to.
- [`@next/env` issue #92040](https://github.com/vercel/next.js/issues/92040).
  The cache bug `loader.ts` works around.
- [Next.js environment variables guide](https://nextjs.org/docs/pages/guides/environment-variables).
  The framework's own guidance on the `.env` precedence we depend on.
