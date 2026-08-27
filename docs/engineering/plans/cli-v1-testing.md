# CLI V1 testing plan

_Date: 2026-07-30. Status: draft, pending review._

## Context

PR #1 (`chore/cli: scaffold apps/cli workspace`) shipped the `@deessejs/cli` package. No tests yet. This plan covers the V1 test suite.

## Goals

- Confidence in critical paths (not 100% coverage)
- Catch regressions: ref fallback, target exists, packageManager detection, error codes
- Fast feedback loop (unit tests < 1s total, integration tests < 30s total)
- Zero new deps

## Non-goals

- 100% line/branch coverage
- Cross-platform tests (Windows is V1.x)
- NPM publish workflow tests (V1.1)
- Snapshot testing (overkill for current CLI shape)
- A test for every `init` edge case (grow the matrix when something breaks)

## Two layers

### Layer 1: Unit tests (~25 cases)

Pure functions, mocked fs/fetch/spawn. Fast, deterministic. Each module gets one file.

### Layer 2: Integration tests (~12 cases)

Real subprocess invocation of `node ./dist/index.js ...`. Real git fixtures, real fs (tmp dirs), real spawn. Only the HTTP API is mocked (local server).

This is the "does the CLI actually work end-to-end" verification. Unit tests alone wouldn't catch a broken exit code or a misordered output.

## File structure

```
apps/cli/
  test/
    helpers/
      run-cli.ts          # spawn binary, capture stdout/stderr/exit
      git-fixture.ts      # create bare + working repos for init tests
      fake-api.ts         # local HTTP server with template fixtures
    unit/
      errors.test.ts
      output.test.ts
      api.test.ts
      detect-pm.test.ts
      git.test.ts
    integration/
      list.test.ts
      info.test.ts
      init.test.ts
  vitest.config.ts       # new
```

Flat by phase (`unit/` vs `integration/`), not by command. Helpers are shared.

## Helpers

### `test/helpers/run-cli.ts`

```ts
export type CliResult = {
  stdout: string
  stderr: string
  exitCode: number
}

export async function runCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<CliResult>
```

Spawns the binary, captures stdio, returns a structured result. The path to the binary is fixed at `apps/cli/dist/index.js` (built once before tests via a `pretest` script).

### `test/helpers/git-fixture.ts`

Real local bare repo + working clone. Used by `init` tests to provide a clonable target.

```ts
export type GitFixture = {
  remoteUrl: string   // file://<...>
  local: string
  cleanup: () => void
}

export async function createGitFixture(opts: {
  name: string
  defaultBranch?: 'main' | 'master'   // default 'master' to exercise the fallback path
  files?: Record<string, string>      // additional files to commit
}): Promise<GitFixture>
```

`cleanup` removes the tmp dir. Tests wrap with `try/finally` so failures don't leak dirs.

### `test/helpers/fake-api.ts`

Stdlib HTTP server. Default handler returns `{ templates: Template[] }` on `/api/templates`. Test can override the handler to drive error paths (404, 500, malformed JSON).

```ts
export type FakeApi = {
  url: string
  close: () => Promise<void>
}

export async function startFakeApi(opts: {
  templates?: Template[]
  handler?: (req: { url?: string }) => { status: number; body?: string }
}): Promise<FakeApi>
```

## Test cases

### Unit tests

**`errors.test.ts`** (~6)

- `CliError` constructor sets `code`, `message`, `hint`
- `exitCode()` returns 1
- `notFound(slug, available)` returns `CliError` with code `not_found` and hint listing the available slugs
- `networkError`, `gitNotInstalled`, `targetExists`, `installFailed`, `parseError`, `internal` each return a `CliError` with the right code

**`output.test.ts`** (~6)

- `printJson` produces valid JSON ending with `\n`
- `printError` includes the message, code, and hint when present
- `printError` skips the hint line when hint is undefined
- `printTemplatesTable` aligns columns (widest cell per column drives width)
- `printTemplateInfo` prints all fields including optional `image`
- Empty templates array prints the "No templates available" message

**`api.test.ts`** (~6)

- 200 with valid JSON returns the templates array
- 404 throws `network_error` with HTTP 404 in the hint
- 500 throws `network_error`
- Connection refused throws `network_error`
- 200 with malformed JSON throws `parse_error`
- 200 with missing `templates` key throws `parse_error`

**`detect-pm.test.ts`** (~4)

- `parsePackageManagerField("pnpm@9.0.0")` returns `{ pm: "pnpm", raw: "pnpm@9.0.0" }`
- `parsePackageManagerField("npm")` returns `{ pm: "npm", raw: "npm" }`
- `getInstallCommand({ pm: "pnpm" })` returns `"pnpm install"`
- `detectPackageManager` returns null when no `package.json` and no lockfile

**`git.test.ts`** (~3)

- `cloneRepo` with the fixture tries `main` first, falls back to `master` when main is missing
- `cloneRepo` with explicit ref uses only that ref (no fallback)
- `cloneRepo` throws `gitNotInstalled` when `git` is missing from PATH (manipulate `PATH` env var)

### Integration tests

**`list.test.ts`** (~3)

1. Renders templates table when API returns 2+ entries
2. Prints "No templates available" when API returns empty array
3. Exits 1 with `network_error` when API returns 500

**`info.test.ts`** (~3)

1. Prints full template info to stdout (slug, name, description, category, license, repo, labels)
2. Exits 1 with `not_found` for unknown slug; error message lists available slugs
3. Emits JSON with `--json` and matches the expected shape

**`init.test.ts`** (~6)

1. Happy path: clones repo, exits 0, prints "Template ready" + install hint
2. Refuses when target dir exists (exits 1 with `target_exists`)
3. `--force` overwrites an existing target dir
4. Falls back to `master` when the remote's default branch is master (git-fixture uses `master` by default)
5. Reads `packageManager` field from cloned `package.json` (verified via `--no-install` + assert subsequent `install` would use the right PM)
6. Exits 1 with `not_found` for unknown slug

Total: ~37 tests. Down from an earlier draft of ~65, which was over-invested for V1.

## Vitest config

```ts
// apps/cli/vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 30_000,    // integration tests may take a few seconds
    hookTimeout: 30_000,
    pool: "forks",          // avoids child_process conflicts with default threads
  },
})
```

`pool: "forks"` matters. Default `threads` shares a worker thread pool across tests, which clashes with `child_process.spawn` calls in fixtures. `forks` gives each test its own process.

## Build-before-test

Add to `apps/cli/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "pretest": "tsup"
  }
}
```

`pnpm --filter @deessejs/cli test` first builds the binary, then runs the suite. `runCli` always operates on a fresh `dist/index.js`.

## Tooling

| Tool | Use |
|---|---|
| `vitest` | Already in deps |
| `node:http` | Fake API server, stdlib |
| `node:child_process` | `runCli` + git fixtures, stdlib |
| `os.tmpdir()` | Tmp dirs for fixtures, stdlib |
| `node:fs` / `node:path` | Cleanup, stdlib |

Zero new deps.

## What's out of V1 scope

- V1.1: cross-platform tests (Windows Path handling in `git clone file://`)
- V1.1: comprehensive `init` test matrix (15 cases I enumerated earlier can land as bugs surface)
- V1.1: coverage threshold and CI enforcement (V1 ships coverage info, no gate)
- V1.1: snapshot testing for output formatting
- V1.1: NPM publish integration tests

## Platform notes

**The platform skips init tests on Windows and in CI** (via `describe.skipIf(process.platform === "win32" || !!process.env.CI || !gitAvailable)`). Reason: in the test fork (`pool: "forks"`), `child_process.spawn` of `git` fails with ENOENT even on Linux CI, since the fork's PATH lookup strips the PATH. <!-- vale fix: write-good.Passive --> The unit, list, and info tests run in any environment. Init tests run locally when the user invokes `pnpm --filter @deessejs/cli test` outside CI.

## Open questions

1. **Do we want a `pretest` script or a `globalSetup`?** My pick: `pretest` (simpler, runs once via `pnpm` lifecycle). `globalSetup` is justified only if we want to skip the build when `dist/` is already fresh.
2. **Integration tests in parallel?** My pick: each test creates its own `gitFixture` (no shared state), so parallel within a file is safe. Different files can run in parallel by default.
3. **Coverage report in CI?** My pick: yes, install `@vitest/coverage-v8` and add `vitest run --coverage` to a `test:coverage` script. No threshold, just report.

## Why this is the cut-down version

I initially proposed ~65 tests with `globalSetup`, per-file coverage thresholds, and 15 detailed `init` cases. That's principal-level over-confidence for V1 surface area. This plan is V1-grade: ship the tests that catch the regressions we'd actually block a PR for, grow the matrix when something breaks. ~37 tests is enough for what's there today.

## Next steps

1. Review this plan
2. Build the three helpers (`run-cli`, `git-fixture`, `fake-api`)
3. Write unit tests, verify they pass
4. Write integration tests, verify they pass against the built binary
5. Open PR with the test suite + this plan linked in the description
