# apps/cli: @deessejs/errors and @deessejs/fp integration plan

_Date: 2026-07-30. Status: Phase 1 FAILED on upstream issue. Stopped per plan §"If any exit criterion fails, file the upstream issue with a repro and stop."_

## Phase 1 outcome (2026-07-30)

Phase 1 spike ran. Both packages install via public npm, type-check passes, tsup builds cleanly. The tsup exit criterion passes. The runtime test exit criterion **fails**.

**Failure:** `@deessejs/fp@1.0.0` ships ESM with extensionless relative imports (`from './result/constants'`). Node ESM (used by Vitest) requires explicit `.js` extensions. Bundlers (tsup) are tolerant, so production builds work, but tests can't load the package.

Upstream issue filed: https://github.com/deessejs/fp/issues/356

**Status:** Stopped. Phase 2 onwards blocked until upstream fixes the extensionless imports.

## Context

`@deessejs/errors` and `@deessejs/fp` are the org's internal libraries, in early life, evolving only based on the org's needs (see [AGENTS.md#internal-packages](../../AGENTS.md)). The team needs a first concrete integration site to test the libs in the setup and to surface real frictions upstream.

`apps/cli` is the likely first candidate. It already ships a hand-rolled `CliError` ([apps/cli/src/errors.ts:13](../../../apps/cli/src/errors.ts)) and three near-identical try/catch blocks across commands. Both are natural migration targets: errors for the class hierarchy, fp's `Result.tryCatch` for the action pipelines.

This plan covers a pre-flight validation plus a two-phase integration of errors then fp into apps/cli. It doesn't cover other apps (web, app, docs, packages/auth); those stay out of scope until apps/cli ships a validated integration.

## Goals

- Check that `@deessejs/errors` and `@deessejs/fp` install, type-check, and bundle cleanly in the setup (pnpm catalog strict, tsup, Node 18.18).
- Confirm apps/cli as the first integration target with the user.
- Migrate `src/errors.ts` to use `error({...})` from @deessejs/errors while keeping the public surface stable for consumers.
- Replace the three repeated try/catch blocks with `Result.tryCatch` pipelines where they fit.
- Open at least one real upstream issue before this plan flips to "done," exercising the AGENTS.md "file upstream, not workaround" rule.

## Non-goals

- Migrating other apps in this plan (apps/web, apps/app, apps/docs, packages/auth).
- Automonitoring upstream versions or proposing bumps (per AGENTS.md).
- Silent local workarounds for upstream quirks.
- Refactoring the test suite (covered by [cli-v1-testing.md](./cli-v1-testing.md)).
- Breaking changes to the CLI surface (commands and flags stay backwards-compatible).

## Phases

### Phase 1: Pre-flight spike (~15 min)

Check the libs work in the setup before committing to a migration.

Scope:

- Create a one-off file at `apps/cli/src/__spike__/errors-fp.ts` (gitignored, removed at the end of the phase).
- Exercises: `error()`, `raise()`, `is()`, `causes()` from errors. `ok()`, `err()`, `Result.tryCatch()`, `match()` from fp.
- Runs the spike through tsup to confirm bundler compatibility.
- Runs vitest on it (with both libs temporarily added as deps).

Exit criteria:

- Both packages install via public npm with pinned versions.
- TypeScript types align with `apps/cli/tsconfig.json` (extends `@workspace/typescript-config/base.json`).
- ESM bundling works through tsup (no peer dep warnings, no resolver errors).
- At least one runtime test passes for `error()` plus `is()`.
- At least one runtime test passes for `Result.tryCatch()` plus `match()`.

If any exit criterion fails, file the upstream issue with a repro and stop. Don't proceed to Phase 2.

### Phase 2: Decide target

Present the spike outcome to the user. Decision points:

- apps/cli confirmed as first integration target? (recommended: yes).
- Pinned versions to start with for `@deessejs/errors` and `@deessejs/fp`. User provides the exact numbers.
- Branch name: `chore/cli-integrate-deessejs-errors`. fp on a separate branch afterward (`chore/cli-integrate-deessejs-fp`).

Exit: explicit user sign-off before any code change in apps/cli.

### Phase 3: Integrate @deessejs/errors

Per-command order (least surface first):

1. Add `@deessejs/errors` to pnpm catalog with the pinned version.
2. Rewrite [apps/cli/src/errors.ts](../../../apps/cli/src/errors.ts):
   - Replace the `CliError extends Error` class with `const CliError = error({ name: "CliError", inherits: [...] })`.
   - Build sub-errors via `inherits:` (`NotFoundError`, `NetworkError`, `GitError`, etc.) so `is(err, NetworkError)` works.
   - Keep the existing public factories (`notFound`, `networkError`, `gitNotInstalled`, etc.) as wrappers around the new types. The consumer surface stays the same.
3. Migrate `commands/info.ts` first as smoke test (simplest command, no side effects, no git).
4. If clean, migrate `commands/list.ts` (similar shape).
5. Migrate `commands/init.ts`. Main payoff: [apps/cli/src/utils/git.ts:43](../../../apps/cli/src/utils/git.ts) becomes `GitError().from(...)`, so the `attempts` chain survives instead of getting swallowed by the generic `internal()` re-wrap in [apps/cli/src/commands/init.ts:159](../../../apps/cli/src/commands/init.ts).
6. Update `output.ts:printError()` plus every `err.name === "CliError"` catch (three sites) to use `is(err, CliError)`.

Exit criteria:

- apps/cli behaviour unchanged from a user's perspective (`--json` output byte-identical, error messages slightly improved).
- `git.ts:43` no longer throws a raw `Error`; it throws a structured `GitError` with a `ref` field.
- Every `name === "CliError"` check replaced with `is(...)`.
- vitest green (after [cli-v1-testing.md](./cli-v1-testing.md) lands).

### Phase 4: Integrate @deessejs/fp

After errors is stable:

1. Add `@deessejs/fp` to pnpm catalog with the pinned version.
2. Refactor `commands/info.ts`:
   - `Result.tryCatch(() => fetchTemplates(...))` → `flatMap(...)` for the find → `match({ ok, err })` for output.
3. Refactor `commands/list.ts`: same pattern.
4. Refactor `commands/init.ts` (trickier because of side effects plus `process.exit`):
   - Keep outer try/catch for exit semantics.
   - Use `Result` for the inner pipeline: fetch → find → resolve dir → detect pm.
   - Wrap `ora` spinners around the `match` block, not individual Result calls.
5. Keep byte-identity (or close to) for `--json` output.

Exit criteria:

- All three commands use `Result.tryCatch` for their main pipeline.
- Side effects preserved (spinners, `process.exit`, fs writes all still work).
- JSON shapes unchanged or documented improvement (issue if a shape must change).
- vitest green.

### Phase 5: Issue workflow (continuous, not a separate phase)

Per AGENTS.md policy: every friction becomes one upstream issue. Examples:

| Friction type | Where filed |
|---|---|
| API shape awkward for the team's usage | `github.com/deessejs/errors` or `/fp` issue |
| TypeScript types too loose or too strict | upstream issue |
| Missing helper (for example, flatten causes into one string) | upstream issue |
| Bundler or peer dep surprise | upstream issue if reproducible there |
| Real bug in upstream behaviour | upstream issue with minimal repro |

Log the first real issues in PR descriptions. After this plan ships, decide whether to maintain a dedicated `docs/engineering/upstream-issues.md` log based on volume.

## Order rationale (errors before fp)

- Errors first: smaller blast radius, gets the upstream feedback loop running sooner.
- Errors has a clear, isolated migration target (one file: `src/errors.ts`).
- fp refactor is larger and depends on errors being stable (consistent `CliError` types throughout the Result pipelines matter).

## Open questions

1. **apps/cli as target, or scratch repo first?** Confirmed 2026-07-30: apps/cli. Small, standalone, with natural migration targets. A scratch repo adds infra for no payoff.
2. ~~What pinned versions of errors and fp?~~ **LOCKED 2026-07-30**: `@deessejs/errors@^1.1.1` (latest as of 2026-06-05, public npm), `@deessejs/fp@^1.0.0` (latest as of 2026-06-09, public npm). Both 1.x. Both on `registry.npmjs.org`, no private registry.
3. **PR scope: one PR or three?** Recommendation: one PR per phase (errors PR, fp PR). Each targets staging per AGENTS.md.
4. **Do upstream issues gate the apps/cli PR?** Recommendation: no. File them as they happen, link in the PR description, don't block on upstream fixes.
5. **When to expand to other apps?** Recommendation: not before apps/cli has used errors plus fp for one real release cycle. Decision criteria for expansion come in a follow-up plan.
6. **Update AGENTS.md after this plan ships?** Recommendation: no. The `### Internal packages (@deessejs/*)` rule is already correct. Lessons from this plan feed back into personal digital assistant memory, not project docs.

## Next steps

1. Review this plan; adjust if needed.
2. Land [cli-v1-testing.md](./cli-v1-testing.md) first or in parallel. Refactor confidence depends on test coverage.
3. Phase 1: pre-flight spike.
4. Phase 2: explicit user sign-off on target plus versions.
5. Phase 3 then Phase 4: two PRs against staging.
6. Phase 5: collect upstream issues as they happen.
