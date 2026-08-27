# ADR-011, env package testing strategy

## Status

Proposed (2026-08).

## Context

`packages/env/` is the load-bearing contract for every environment
variable that reaches the runtime: the API server, the apps, the
scripts, and the test runners. Today the package has zero tests. Two
things masked the absence: (1) the earlier hand-rolled
validator had obvious single-line guards a reader could scan, and (2)
the rest of the monorepo exercised it through the consumers' own
test suites. Both masks dissolved as the package evolved.

Three concrete failures in recent commits made the absence load-bearing:

1. **The `node:fs` leak** (PR #49 fix, 4a79e71): Turbopack refused
   to bundle `client.ts` because it transitively imported
   `loader.ts`, which loads `node:fs`. The CI Build job caught it; a
   unit test would have caught it locally before the push.
2. **The alias regression** (PR #49 fix, 47789b9): a `z.preprocess`
   on individual fields can't see sibling fields, so the resolution
   `AUTH_SECRET → BETTER_AUTH_SECRET` lost every alias without warning. CI
   `Validate env` caught it; a five-case unit test would have caught
   it at the schema layer.
3. **The `default: null` exports-map regression**: a tentative fix
   broke the TypeScript resolver for `@workspace/env/server`. No
   test exists to verify the exports shape.

ADR-009 (test strategy) lays the shape: `tests/unit/`,
`tests/integration/`, `tests/contract/`, one shared Vitest config,
80/75 coverage gate. The shape is monorepo-wide; ADR-011 is the
package-level instantiation for `packages/env/`. Every test below
fits one of the three tiers and ties to one of the three failures.

## Decision

`packages/env/` ships five test files. Three are unit-tier and load-
bearing; two are integration-tier and surface the loader's filesystem
behaviour. The package organises the tests so each file answers one question,
not so each tests one thing; failures should localise to a single
file, and the file name should name what it covers, not the schema
it happens to exercise.

The five files, by priority:

### 1. `tests/integration/loader.no-process-env-mutation.test.ts`

Locks the contract from failure #1 above: importing `@workspace/env/client`
on a Node target must never pull `node:fs` into the module graph. The
test loads the compiled `dist/client.js` from a fresh Node subprocess,
stubs `require.resolve("@workspace/env/client")`, and asserts that the
loaded module's source contains neither `node:fs` nor `loadDotenvSnapshot`.
Any future refactor that reintroduces the import fails locally before
reaching the CI Build job.

The test is integration-tier because it needs the compiled `dist/`
artifact. It runs in a `beforeAll` that shells out to the package's
own build output, not to source. The shared `@workspace/vitest-config`
contract-test pattern from ADR-009 covers this.

### 2. `tests/unit/schema.server.alias.test.ts`

Locks the contract from failure #2 above: the schema's `.superRefine`
must accept either `BETTER_AUTH_SECRET` or `AUTH_SECRET` as a valid
32+ char secret in `NODE_ENV=production`, and reject when neither is
present. Five cases, no fixtures, just `serverSchema.safeParse(...)`:

  - `BETTER_AUTH_SECRET` set alone, ≥ 32 chars → success
  - `AUTH_SECRET` set alone, ≥ 32 chars → success
  - both set → success (canonical wins)
  - neither set, `NODE_ENV=production` → fail with the gate's path
  - neither set, `NODE_ENV=development|test` → success (dev gate permissive)

The test is unit-tier because it touches no filesystem, no network,
no `process.env`. It's the only place that asserts the alias
contract; if the schema changes, this test fails first.

### 3. `tests/unit/server.alias.test.ts`

Locks the consumer-side alias resolution that pairs with the schema
test: `getServerEnv()` must materialise `BETTER_AUTH_SECRET` to the
correct value when either name appears in the snapshot, and pass the
secret to the caller when both are unset. Three cases that exercise
the `loadDotenvSnapshot` mock to feed controlled snapshots. This test
catches regressions where the schema resolves correctly but the
consumer forgets the boundary resolution, a class of bug the schema
test can't see.

### 4. `tests/unit/server.leak-guard.test.ts`

Asserts the runtime guard in `server.ts`: materialising
`serverEnv` throws if any `NEXT_PUBLIC_*` key appears in the output.
This is the survivor of the deleted hand-rolled Proxy trap list; the
guard now runs one-shot at materialisation. A loop that injects a fake
key into the schema and asserts the throw covers the contract. The
guard's existence has documentation in `packages/env/src/server.ts`;
this test makes the documentation binding.

### 5. `tests/integration/loader.test.ts`

Surfaces the loader's filesystem behaviour. Uses `mkdtempSync` in
`os.tmpdir()` to create a fake repo root, writes `.env`,
`.env.local`, and `.env.test` files with overlapping keys, calls
`loadDotenvSnapshot`, and asserts the precedence:
`.env.local` wins when present and `NODE_ENV≠test`, `.env.test` wins
when `NODE_ENV=test`, `.env` is the floor. A second case checks that
the snapshot is a plain object that doesn't mutate `process.env` on
read.

The file is integration-tier because it depends on the host's
filesystem. It's also the only test that exercises `findRepoRoot` and
the `@next/env`-free path. Replacing this with a unit test would
mean mocking `node:fs` and the working directory, which is more
fragility than the value gained.

## What this rule allows

- **A `tests/` folder** at the root of `packages/env/`. The package
  has no tests today; introducing the folder is the first concrete
  change.
- **The `@workspace/vitest-config` shared preset** for every file.
  The `vitestConfig({ package: 'env' })` form is consistent with
  ADR-009's shared config; the test directory layout needs no per-package override beyond
  its own.
- **`vi.stubEnv` and `vi.unstubAllEnvs` for test isolation** when a
  test needs to set `process.env`. The shared config sets
  `unstubEnvs: true`, which autorestores between tests,
  the documented Vitest pattern for environment mutation.
- **A `@ts-expect-error` directive** in test files that exercise
  type-level guarantees (for example asserting that a server var carrying a
  client prefix is a compile-time error). Matches the pattern in
  `@t3-oss/env-core`'s smoke test.
- **Inline `expect(...).toMatchInlineSnapshot(...)` snapshots** for
  the schema shape, so a change that adds a field without listing it
  in `runtimeEnv`/`runtimeEnvStrict` surfaces immediately.

## What this rule forbids

- **A direct `process.env.X = ...` mutation in any test**. The
  contract is `vi.stubEnv`; ad-hoc mutation doesn't restore
  between tests and pollutes sibling tests.
- **Mocking `node:fs`** in unit tests. The loader's filesystem
  contract exposes in `tests/integration/loader.test.ts` against a
  real temp directory; mocking it elsewhere hides bugs at the loader
  boundary.
- **A custom error matcher for the `Validate env` script**. The
  CI job asserts the script's output, not this package's
  tests. Adding a snapshot here is duplicate verification.
- **Tests that exercise the `process.exit(1)` branch from
  `onValidationError`**. The branch exits, not throws; testing
  it requires a subprocess wrapper that adds more complexity than the
  branch carries. The contract test for `onValidationError` is
  separate: `tests/contract/server.createEnv.test.ts`, deferred to
  ADR-009's coverage roll-out (see "Future" below).
- **A coverage gate inside `packages/env/` separate from the
  monorepo-wide 80/75**. ADR-009's shared `@workspace/vitest-config`
  governs the package-level coverage. Adding a tighter
  threshold here creates a false sense of safety without the
  contract test layer to back it up.

## Consequences

- **Coverage for `packages/env/` rises from 0 to a non-zero number
  measured by the shared Vitest coverage gate**. The 80/75 lines/
  branches threshold from ADR-009 applies; if the package fails it,
  the gate fires. The expected coverage from these five files is
  about: `schema.ts` ~95% (every branch), `loader.ts` ~85% (the
  precedence branches hit), `server.ts` ~70% (the materialise
  path hits; the type-only `loadDotenvSnapshot` import side doesn't),
  `client.ts` ~60% (only the part that lives in the test
  surface).
- **A PR that adds a new env var without a test case fails review**:
  the schema's new field is a contract change; the contract test
  layer is where the new field's behaviour lives.
- **The CI Build job `Validate env` continues to catch the
  `node:fs`-leak class of bug** as a second line of defence. The
  unit test makes that class unlikely to reach CI at all; the CI
  guard is the safety net, not the primary signal.

## What this rule doesn't change

- **The schema files** (`packages/env/src/schema.ts`). Tests assert
  the schema's behaviour; they don't edit it.
- **The loader's `process.env` mutation on `loadRepoEnv`**. That
  mutation is the contract for nine legacy consumers; removing it
  is a separate ADR (mentioned as follow-up in ADR-010).
- **The `scripts/env-check.ts` validation script**. CI keeps
  running it; `packages/env/` tests don't duplicate that
  validation.
- **The contract-test pattern from ADR-009** for the wider monorepo.
  ADR-011 specialises ADR-009 for one package; ADR-009 remains the
  monorepo-level rule.

## Anti-patterns

- **A single large `tests/env.test.ts`** that covers loader, schema,
  and server in one file. Files in this package fail by topic, not
  by import graph: a loader regression and a server regression
  surface on their own.
- **Snapshot tests for the full `getServerEnv()` output**. The
  output is a frozen plain object; a snapshot locks the shape but
  obscures the schema's actual contract. Prefer per-field assertions.
- **Spying on `process.exit`.** Use `onValidationError` with a
  throwing callback and assert the throw, not the exit.
- **Re-importing `serverEnv` in every test**. Each test should call
  `getServerEnv()` so the memoisation cache stays fresh and the
  test exercises the real production path.

## Future work

Two extensions are out of scope for this ADR but worth flagging:

1. **`tests/contract/server.createEnv.test.ts`** reproduces the
   `@t3-oss/env-core` smoke test verbatim: type-level guarantees
   (`@ts-expect-error` on server vars with client prefix, on
   missing keys in `runtimeEnvStrict`), a `createFinalSchema`
   callback test, and a custom `onValidationError` round-trip. This
   file's contract is "engine-level guarantees" and is the
   contract-test counterpart to ADR-009. Land it in the next sprint
   alongside the coverage roll-out.
2. **A `tests/unit/csv.fuzz.test.ts`** using `zod-fast-check` to
   generate random CSV-shaped strings and assert the parser's
   idempotency. Low-priority, low-cost, marginal gain.

The next iteration of this ADR can incorporate
both without re-justifying the choices.

## How to verify

After the test files land:

1. `pnpm --filter @workspace/env test` runs in < 2 seconds (no
   filesystem-heavy setup beyond `mkdtempSync` for the loader
   integration test, which completes in < 100ms).
2. `pnpm turbo run test` continues to show all packages green; the
   new env tests add no regressions.
3. `pnpm exec prettier --check packages/env/tests` is clean.
4. The shared `@workspace/vitest-config` coverage threshold (80/75)
   holds for `packages/env/src/`. If not, the gate fails before
   merge.

## Where this rule came from

Three regression post-mortems in one branch: the `node:fs` leak, the
alias regression, and the `default: null` exports-map experiment.
Each cost a CI cycle and a hot-fix commit to recover. ADR-011 is
the response: every senior-grade package boundary in this repo has
a contract test layer, and `packages/env/` was the boundary that
didn't.

## Related

- [ADR-009: Test strategy](./ADR-009-test-strategy.md). The
  monorepo-level rule: shared Vitest config, three test
  directories, contract-test pattern, coverage gate. ADR-011 is a
  package-level instantiation.
- [ADR-001: oRPC is load-bearing](./ADR-001-orpc-is-load-bearing.md).
  The discipline of escalation-by-test: when an engine boundary is
  load-bearing, contract tests are non-optional.
- [ADR-002: File organization by sub-domain](./ADR-002-file-organization.md).
  The rule that test files take their names from the concept they cover,
  not the schema they happen to exercise. `loader.test.ts` covers
  the loader; `schema.server.alias.test.ts` covers the alias
  contract on the server schema.
- [ADR-010: env package senior shape](./ADR-010-env-package-senior.md).
  The implementation shape whose correctness this ADR verifies.
  ADR-010 documents the contract; ADR-011 binds it to tests.
- [`@t3-oss/env-core` smoke test](https://github.com/t3-oss/t3-env/blob/main/packages/core/test/smoke-valibot.test.ts).
  The reference for the contract-test pattern at the type level
  (`@ts-expect-error`) and the runtime level (`toMatchObject`,
  `toThrow`). Future work in this ADR reproduces it for the
  `createEnv` surface.
- [Vitest `vi.stubEnv` / `vi.unstubAllEnvs`](https://vitest.dev/guide/mocking).
  The pattern for safe environment mutation in tests. Used in
  `tests/unit/server.alias.test.ts` and any test that needs to
  set `process.env` without polluting sibling tests.
- [Rule 0006: Technology choices](../rules/0006-technology-choices.md).
  The discipline that requires every testing choice to answer
  "what does it rule out." `vi.stubEnv` rules out manual process
  mutation; the integration tier rules out mocking `node:fs`; the
  shared config rules out per-package Vitest overrides.
