# CLI senior testing strategy

_Date: 2026-09-22. Status: draft, supersedes `cli-v1-testing.md` for any new test work._

## Context

`apps/cli` ships commands that touch four boundaries simultaneously: the user's filesystem (`~/.deessejs/`), an external Git binary, an oRPC server, and a Better Auth device-flow. The current test suite (`apps/cli/test/`) covers ~12 cases. It catches the regressions the team has already seen (chmod 0o600, Bearer header on /get-session, ref fallback) but it leaves four classes of bug untested:

1. **End-to-end against the real binary** — every `commands/*.test.ts` calls `loginCommand.parseAsync(...)` in-process. A regression that breaks the `index.ts` entry, the shebang banner, the `commander` registration order, or the `tsup` bundle would not surface until a user runs `npx @deessejs/cli`.
2. **The wire shape between CLI and API** — `fetchTemplates` is covered by Server-Side Client at the procedure layer; the **HTTP wire** (the `RPCLink` retry plugins, the `Retry-After` honouring, the `new URL(path, base)` composition, the absolute-URL requirement for `RPCLink.url` in Node) is not exercised end-to-end against a real server.
3. **Failure modes the user actually hits** — DNS failure mid-poll, GitHub 5xx cascading into a 502 on `templates.list`, the 30-minute device-code TTL expiring, an `ENOSPC` on `~/.deessejs/`, a `git clone` of a repo that exists but has neither `main` nor `master` branches. None of these are pinned.
4. **Mutation testing** — even with 100% line coverage, a test that asserts `expect(x).toBe(x)` would pass. StrykerJS finds those.

The goal is the same as the user's brief: **fermer les yeux**. When CI is green, the user-visible behaviour of `deessejs <cmd>` is guaranteed to match what the test matrix pinned, against the contracts that the suite exercises.

## Guiding principles

Three rules borrowed from the web research and adapted to this CLI:

1. **Tests resemble how the software is used.** The most senior layer is the subprocess invocation of the real `dist/index.js`. The least senior is mocking `node:fs` in-process. We invert the pyramid the user usually sees.
2. **Mock only what is outside the CLI's process boundary.** The filesystem, Git, and the package manager are inside the boundary; we use real temp dirs + a real local Git fixture + a real `pnpm` binary for `--no-install` paths and a stubbed one for install paths. The server is the only thing we replace, and only when it would otherwise hit GitHub in CI.
3. **The contract layer is shared with the server.** Every procedure that the CLI calls has a Server-Side Client test on the server side (`packages/api/tests/contract/`). Every wire shape the CLI decodes has a contract test on the client side (`apps/cli/test/contract/`). Drift between the two is the same class of bug as a Zod schema drifting from its consumer — and it shows up here, in `apps/cli/src/api/index.ts:normaliseError`.

## The pyramid (top-down — most senior first)

```
┌────────────────────────────────────────────────────────────────┐
│  L4  E2E subprocess  — spawn dist/index.js, real shell         │  ← 5-10 cases, slow, gated
├────────────────────────────────────────────────────────────────┤
│  L3  Integration     — real HTTP fixture, real Commander       │  ← 30-40 cases, fast
├────────────────────────────────────────────────────────────────┤
│  L2  Contract        — Server-Side Client + oRPC wire fixtures │  ← 20-30 cases, fast
├────────────────────────────────────────────────────────────────┤
│  L1  Unit            — pure functions, isolated env, no I/O    │  ← 30-40 cases, fastest
└────────────────────────────────────────────────────────────────┘
```

The pyramid is **inverted in priority**: L4 catches the largest class of bug for the least effort (one `--help` test catches broken registration, broken shebang, broken bundle, broken exit code, broken arg parsing). L1 catches the smallest class but runs first in feedback.

## Layer 4 — Subprocess E2E (`test/e2e/`)

### What it is

For every public command and the most important `--json` outputs, spawn the actual `dist/index.js` binary in a temp directory and assert on stdout/stderr/exit-code.

### Helper (`test/helpers/run-cli.ts`)

```ts
import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export type CliResult = {
  stdout: string
  stderr: string
  exitCode: number
  clean: { stdout: string; stderr: string }   // ANSI-stripped, normalised
}

const BUNDLE = resolve(__dirname, "..", "..", "dist", "index.js")

export async function runCli(
  args: string[],
  options: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeoutMs?: number
  } = {},
): Promise<CliResult> {
  const child = spawn("node", [BUNDLE, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
  })
  // ... promisified capture, timeout, exit-code assertion
}

export function makeSandbox(): string {
  return mkdtempSync(join(tmpdir(), "deessejs-e2e-"))
}

export function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
```

`NO_COLOR=1` is defence-in-depth against `picocolors` emitting ANSI codes that would break snapshot equality. `cleanup` is mandatory in `afterEach` — orphaned temp dirs leak disk on the CI runner.

### Cases (initial)

| # | Command | What it pins |
|---|---|---|
| E1 | `deessejs --help` | Registration, exit 0, stdout lists every subcommand |
| E2 | `deessejs --version` | Reads injected version from `dist/index.js` |
| E3 | `deessejs list --json` against a fixture server | JSON shape matches `TemplatesListResponseV1` |
| E4 | `deessejs info saas-starter --json` | Same |
| E5 | `deessejs init saas-starter --no-install` against a fixture server + local git fixture | Clones, exits 0, JSON payload matches |
| E6 | `deessejs init saas-starter --no-install` when the target dir already exists | Exits non-zero, stderr contains `target_exists`, JSON `ok: false` with `code: "target_exists"` |
| E7 | `deessejs init saas-starter --no-install --force` when the target dir exists | Exits 0, dir is overwritten |
| E8 | `deessejs auth status --json` with no auth.json | Exits 0, JSON `ok: false, reason: "no_session"` |
| E9 | `deessejs auth logout --json` with no auth.json | Exits 0, JSON `ok: true, reason: "no_session"` |
| E10 | `deessejs init nonexistent-slug --no-install` | Exits 1, JSON `ok: false, code: "not_found"`, hint lists available slugs |

These run after the bundle is rebuilt (`pretest` already does this), and they use the local fixture HTTP server, not the real API.

### Golden snapshot rules

- Always run with `NO_COLOR=1`.
- Strip ANSI codes from captured stdout/stderr (`strip-ansi`).
- Replace ISO timestamps with `<TIMESTAMP>`, absolute paths with `<HOME>`, the installed version with `<VERSION>`.
- Snapshot only the **shape** of the output (substring assertions + `toMatchInlineSnapshot` for the JSON path), not the exact byte-for-byte string.

### Gating

E2E is the only layer that should require the bundle. L1-L3 must run from source via vitest's loader. We split the test script:

```jsonc
// apps/cli/package.json
"test": "vitest run --exclude='**/e2e/**'",
"test:e2e": "vitest run test/e2e",
"test:all": "pnpm test && pnpm test:e2e"
```

The CI matrix runs both. A developer running `pnpm test` locally gets fast feedback (L1-L3); release branches run `test:all`.

## Layer 3 — Integration (`test/integration/`)

This is the layer that already exists (`auth/login`, `auth/logout`, `auth/status`). It is the right place to:

- Drive the real `loginCommand` against the fake Better Auth server (`test/integration/fakes/better-auth.ts`).
- Drive `init` against a real local Git fixture (see Layer 4 helper for fixture construction).
- Drive `list` / `info` against a real HTTP fixture with controllable failure modes (timeout, 5xx, malformed JSON).

### What to add

| # | File | New cases |
|---|---|---|
| I1 | `list.test.ts` | empty array, network error, slow first byte (timeout), retry-after honoured |
| I2 | `info.test.ts` | network error, 502 from upstream GitHub (cascaded as `TEMPLATES_FETCH_FAILED`) |
| I3 | `init.test.ts` | `--ref develop` happy path, `--force`, `target_exists`, ref fallback (`main` → `master`), packageManager field detection, no packageManager field |
| I4 | `init.test.ts` (cont) | install failure: stub the package-manager binary to exit non-zero, assert `install_failed` CliError and that the spinner prints the failure |
| I5 | `init.test.ts` (cont) | `git` not on PATH: assert `git_not_installed` |
| I6 | `auth/login.test.ts` (cont) | polling loop hits the 30-minute timeout boundary by passing a fake `expiresBy` < 1s in the future (mock `Date.now`) |
| I7 | `auth/login.test.ts` (cont) | user denies: assert `cli_device_denied` and that auth.json is **not** written |
| I8 | `auth/login.test.ts` (cont) | device flow succeeds with a slow first poll (200 ms delay on /device/token) — exercises the polling interval |
| I9 | `auth/status.test.ts` (cont) | malformed auth.json: assert exit 0 and the "no session" message |
| I10 | `auth/logout.test.ts` (cont) | server returns 200 and the file is cleared; server returns 500 and the file is cleared anyway (already covered, see `apps/cli/test/integration/auth/logout.test.ts:115`) |

### Fixtures

**`test/helpers/git-fixture.ts`** — creates a real bare + working repo in a temp dir, returning `file://` URL for `git clone`. Per the existing plan (`docs/engineering/plans/cli-v1-testing.md:79`), this is what we add. The fixture should:

- Default to `master` so the fallback path is exercised.
- Allow `--ref` overrides.
- Optionally seed a `package.json` with a `packageManager` field, and/or a lockfile, to exercise detection.
- Clean up the tmp dir on `afterEach`.

**`test/helpers/fake-api.ts`** — local HTTP server. The current test suite uses inline `http.createServer` in `test/integration/fakes/better-auth.ts` for the device-flow endpoints. We need a separate fixture for the templates endpoint with controllable failure modes (status, body, delay). Single fixture file, multiple "behaviours" settable per test.

**`test/helpers/stub-pm.ts`** — replaces the package-manager binary on PATH for the duration of a test (writes a tiny shell script that exits with the requested code). Used by I4.

## Layer 2 — Contract (`test/contract/`)

The most important layer for "fermer les yeux", because it pins the wire shape between CLI and API, and the wire shape between CLI and Better Auth.

### Two sub-layers

**2a — Server-Side Client (procedures)**

For every oRPC procedure the CLI consumes, exercise it via `call(appRouter.procedure, ...)`. Tests live in `packages/api/tests/contract/` (already exists for `templates-list.test.ts`). Mirror file names on the CLI side for symmetry:

```
apps/cli/test/contract/
├── templates-list.wire-shape.test.ts   # mirrors packages/api/tests/contract/templates-list.test.ts
├── templates-list.errors.test.ts       # TEMPLATES_FETCH_FAILED, ORPCError mapping
├── cli-error-codes.test.ts             # the closed list from ADR-010 — pin that nothing
│                                       #   accidentally widens the public surface
└── auth.device-flow.wire-shape.test.ts # device/code, device/token, get-session response shapes
```

**2b — HTTP wire shape (RPCLink)**

Pin the wire behaviour that the Server-Side Client cannot see (per `docs/engineering/plans/orpc-client-migration.md:269`):

- `RPCLink.url` is absolute. Regression: `API_RPC_PATH` alone raises `TypeError: Invalid URL` on every command. Pin with a test that constructs the link with the production `resolveBaseURL()` and asserts the URL is absolute.
- `RetryAfterPlugin` honours `Retry-After: <seconds>`. Spin up an HTTP fixture that returns 429 + `Retry-After: 1`, then 200, and assert the call eventually succeeds with exactly one retry.
- `ClientRetryPlugin` retries on `TypeError` (DNS failure). Stop the fixture mid-test, call `fetchTemplates`, assert it retries exactly 3 times then throws `network_error`.
- The `fetchTemplates` version probe (`maybeWarnAboutOutdatedCli`) is best-effort: failures are swallowed silently. Pin that a server returning 500 on `/version` does NOT throw and does NOT block the templates call.

### Tools

For 2a, use `@orpc/server`'s `call` (already imported in `packages/api/tests/contract/templates-list.test.ts`). For 2b, use a local HTTP fixture (`node:http`) bound to `127.0.0.1`. **No `vi.stubGlobal("fetch", ...)`** — per `docs/engineering/plans/orpc-client-migration.md:272`, that pattern bypasses RPCLink entirely and was the root cause of the broken-cast regression. If we need to fake `fetch`, we do it inside `RPCLink`'s `fetch` option, never via global stub.

## Layer 1 — Unit (`test/unit/`)

Pure functions, mocked I/O. The current 6 files stay; we add the gaps:

| # | File | What it pins |
|---|---|---|
| U1 | `errors.test.ts` (cont) | The closed-list of `CliErrorCode` is exhaustive (per ADR-010). Iterate the enum and assert each factory returns the expected code. Add `cli_device_denied` and `cli_device_expired`. |
| U2 | `output.test.ts` (cont) | Empty `templates` array on `printTemplatesTable`. Already covered. |
| U3 | `output.test.ts` (cont) | `printError` with empty hint doesn't print the "Hint" line. Already covered. |
| U4 | `detect-pm.test.ts` (cont) | All four lockfile fallbacks (pnpm, bun, yarn, npm), unknown `packageManager` field value (e.g. `"@yarnpkg/sdks"`), corrupt `package.json`. |
| U5 | `git.test.ts` (cont) | The git-not-installed probe runs only after both `main` and `master` failed (mock the spawn sequence and assert call order). |
| U6 | `api.normalise-error.test.ts` (already exists) | Extend: assert that a thrown `Error` with `message: "fetch failed"` becomes `network_error`, not `parse_error`. Already covered. |
| U7 | `api.resolve-base-url.test.ts` (new) | `DEESSEJS_API_URL` with trailing slash, with `path` query, with `ftp:` protocol, with empty string. Each asserts the right throw or normalised result. |
| U8 | `cli-self-version.test.ts` (already exists) | The drift check is fine. Extend with: invalid semver (e.g. `"v1.2.3"`) — the function should still return the injected string; the version probe (`compareSemver`) is the one that handles malformed input. |
| U9 | `version-check.test.ts` (new) | `compareSemver` table: equal, less, greater, malformed on either side (returns 0 — "unknown: don't warn"), pre-release tag handling. |
| U10 | `cache.test.ts` (already exists) | Extend with: write-then-corrupt, write-then-rename-fail (Windows path), file in directory that doesn't exist (the `ensureCacheDir` path). |
| U11 | `polling-errors.test.ts` (new) | `mapPollingError` for every code in the Better Auth enum (`authorization_pending`, `slow_down`, `expired_token`, `access_denied`, `invalid_grant`, `invalid_client`) plus an unknown code — assert each returns the right `CliError` or `null`. |
| U12 | `auth-store.test.ts` (new) | `readAuth` on missing file → null; on malformed JSON → null; on valid JSON → parsed. `writeAuth` on existing file → overwrites atomically (no torn writes — pin the `tmp + rename` pattern). `clearAuth` on missing file → no-op. |
| U13 | `init.spawn.test.ts` (new) | The `spawn` wrapper used by `init` never throws on non-zero exit by default; `reject: true` opts into throwing. Cross-spawn behaviour for `.cmd` shims on Windows is exercised by `child_process.spawn('pnpm.cmd', ...)`. |

### Rule for unit tests

No real I/O. No real time. No real network. No `setTimeout` longer than the test timeout. **Anything that touches the filesystem uses `mkdtemp` + cleanup.** Anything that touches the network uses an `http.createServer` bound to `127.0.0.1` (this is integration, not unit — but the boundary between L1 and L2 is fuzzy; the rule is "no external service and no async I/O outside the test's own setup").

## Cross-cutting tools

### `vi.stubEnv` everywhere we touch `process.env`

The shared vitest config sets `unstubEnvs: true` (per ADR-011). Every test that sets `DEESSEJS_API_URL`, `HOME`, `USERPROFILE`, `NODE_ENV`, or `VERCEL_AUTOMATION_BYPASS_SECRET` uses `vi.stubEnv(...)` and never mutates `process.env` directly. This rules out test pollution between siblings in the same file.

### `pool: "forks"` for any test that calls `child_process.spawn`

Per the existing config (`apps/cli/vitest.config.ts:22`), `pool: "forks"` is already set. Pin this in writing so future contributors don't switch to `threads` for performance and discover the `ENOENT` regression (`docs/engineering/plans/cli-v1-testing.md:198`).

### `NO_COLOR=1` in subprocess env

Defence in depth against `picocolors`. Belt-and-braces with `strip-ansi` in helpers.

### A single fixture-per-test pattern

Every test that touches the filesystem creates its own tmp dir. `mkdtempSync` with a per-file prefix (`deessejs-cli-<file-name>-`). Cleanup in `afterEach`. Two tests in the same file MUST NOT share a tmp dir.

## Fault injection (new layer)

Per the user's brief, "test in real conditions". Real conditions include the server being down, the network being slow, and the user's filesystem being read-only. We add a **fault-injection helper** that any test can opt into.

### `test/helpers/fault-inject.ts`

```ts
export type FaultProfile = {
  /** Drop the request entirely (TCP RST). */
  dropConnections?: boolean
  /** Sleep N ms before responding. */
  delayMs?: number
  /** Return this status code on the first N requests, then 200. */
  failFirst?: { status: number; count: number; body?: string }
  /** Return garbage instead of JSON on the first N requests. */
  malformedFirst?: { count: number }
  /** Hang indefinitely (timeout test). */
  hang?: boolean
}

export async function withFault(
  profile: FaultProfile,
  run: () => Promise<void>,
): Promise<void> { ... }
```

Profiles we use:

| Profile | What it tests |
|---|---|
| `delayMs: 10000` against the version probe | The templates call does not block on the probe. |
| `failFirst: { status: 502, count: 1 }` on templates | `RetryAfterPlugin` retries once, eventually succeeds. |
| `failFirst: { status: 500, count: 5 }` on templates | `ClientRetryPlugin` exhausts retries, surfaces `network_error` with the original error in `hint`. |
| `hang: true` on /device/token | The polling loop's `TOTAL_TIMEOUT_MS` boundary trips correctly. |
| `malformedFirst: { count: 1 }` on templates | The normaliser converts the parse failure into `parse_error`, not `network_error`. |
| Drop the connection mid-poll | The CLI sees `TypeError`, retries per the plugin config. |

## Mutation testing

Add StrykerJS to the matrix. Threshold: `mutationScoreThresholds.high: 80, low: 70, break: 60`. Run on every PR that touches `apps/cli/src/`.

Config sketch (`apps/cli/stryker.config.json`):

```json
{
  "$schema": "https://stryker-mutator.io/schema/stryker.config.json",
  "packageManager": "pnpm",
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts"
  },
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "thresholds": { "high": 80, "low": 70, "break": 60 }
}
```

What we expect to find (and the test we add for each):

1. `mapPollingError` returning `null` for an unmapped code (covered by U11).
2. `normaliseError` returning `network_error` on a generic `Error` (would currently slip through — pin by extending U6).
3. `resolveBaseURL` accepting `ftp:` (covered by U7).
4. The chmod path in `writeAuth` swallowing errors silently (silent chmod failure could leave the file world-readable — covered by adding a U12 test that asserts chmod failure throws).
5. `cloneRepo`'s "all refs failed, git not installed" probe (covered by U5).

## CI gate

The test matrix:

| Job | Runner | Trigger | Command | Gate |
|---|---|---|---|---|
| L1-L3 unit + integration + contract | `ubuntu-latest`, Node 24 | every PR | `pnpm --filter @deessejs/cli test` | required |
| L4 e2e (subprocess) | `ubuntu-latest`, Node 24 | every PR | `pnpm --filter @deessejs/cli test:e2e` | required |
| Stryker mutation | `ubuntu-latest`, Node 24 | PRs touching `apps/cli/src/**` only | `pnpm exec stryker run` | threshold 80 high / 70 low |
| Publish verify | `ubuntu-latest`, Node 24 | every PR | existing `cli-publish-verify.yml` | already required |
| Cross-platform matrix | `windows-latest`, `macos-latest`, Node 24 | nightly + release branches | `pnpm test` (L1-L3 only; e2e excluded on Windows for now) | soft |

The cross-platform matrix is soft for now because Windows breaks `git clone file://` in subprocess contexts (per the existing V1 plan's "platform notes" at `docs/engineering/plans/cli-v1-testing.md:237`). When we fix that (separate ticket), cross-platform becomes required.

## What this rules out

Per the user's feedback rules — every choice must answer "what does it rule out":

- **E2E at the top of the pyramid** rules out "the binary works in unit tests but breaks when shipped" — the most common CLI failure class (broken shebang, broken registration, broken bundle).
- **Subprocess invocation of the real `dist/index.js`** rules out "we tested the source but the bundle is broken" — the bug class that bit 1.1.0 (the missing `dist/` in the published tarball, per `apps/cli/CHANGELOG.md:75`).
- **Server-Side Client for procedures + HTTP fixture for wire** rules out "we tested the procedure but the wire contract drifted" — the bug class that bit `@orpc/client` cast regression in `docs/engineering/plans/orpc-client-migration.md:46`.
- **Fault-injection helper** rules out "we tested the happy path but not the user's real conditions" — DNS failures, slow networks, 5xx from GitHub upstream.
- **Mutation testing** rules out "we have 100% line coverage but the assertions are meaningless" — Stryker finds `expect(x).toBe(x)` patterns.
- **`pool: "forks"` documented as load-bearing** rules out "someone switches to threads for speed and breaks child_process" — a real regression that already bit us.
- **`vi.stubEnv` everywhere** rules out "we set process.env.HOME and it leaks into the next test" — the bug class that bit the original `auth/status` test setup.

## Anti-patterns (forbidden)

- **`vi.stubGlobal("fetch", ...)`** to test RPCLink. The mock sits below RPCLink, bypasses it, and was the root cause of the cast regression. Use a local HTTP fixture instead.
- **Snapshot tests of `process.stdout.write` byte-for-byte.** Strip ANSI, normalise paths, replace timestamps. The `output.test.ts` already follows this pattern (`apps/cli/test/unit/output.test.ts:22`); we extend it.
- **Coverage as a gate (alone).** Coverage < 80% is a smell; mutation score > 80% is the real signal. We keep coverage reports but don't gate on them.
- **In-process Commander tests as the only layer.** Every existing `commands/*.test.ts` calls `command.parseAsync(...)` in-process. They stay (they catch logic regressions fast), but E2E subprocess tests are mandatory for the same code paths.
- **Mocking `node:fs`.** The real-fs rule from ADR-011 §"What this rule forbids" applies here too. `mkdtempSync` + cleanup is the pattern.
- **Test that asserts `expect(err.code).toBe(1)` without asserting the stderr text.** Exit-code-only tests catch the wrong regressions. Always pair with a stderr/stdout substring assertion (or, for the JSON paths, an exact-JSON parse).
- **A test that depends on `Date.now()` without mocking it.** The device-flow TTL boundary (I6) is the only place we currently cross this line; mock `Date.now` or use `vi.useFakeTimers` for that one test.

## Migration roadmap

Six PRs, each independently shippable and each leaving CI green:

1. **PR A — Helpers + Layer 1 extension (U7-U13).** Adds `runCli`, `makeSandbox`, `git-fixture`, `fake-api`, `stub-pm`, `fault-inject` helpers. Adds the new unit tests. **No behaviour change.**
2. **PR B — Layer 2 contract tests.** `templates-list.errors.test.ts`, `cli-error-codes.test.ts`, `auth.device-flow.wire-shape.test.ts`, plus the RPCLink wire tests.
3. **PR C — Layer 3 integration extension (I1-I10).** The new `list.test.ts`, `info.test.ts`, `init.test.ts`.
4. **PR D — Layer 4 e2e (E1-E10).** Subprocess invocation of the real bundle. New `test:e2e` script and CI job.
5. **PR E — Stryker mutation testing.** Add the config, the CI job, the threshold. First run will surface survivors; fix them in this PR.
6. **PR F — Cross-platform + Windows fix.** Tackle the `git clone file://` regression on Windows. Move cross-platform from "soft" to "required" in the matrix.

Each PR lands behind the existing `cli-publish-verify.yml` and `ci.yml`; we don't add a new gate until PR D (which adds `test:e2e` to the matrix) and PR E (which adds the mutation job).

## Open questions for review

1. **Where does the `mock-and-run.js` entry point go?** Per the Smashing article's "Mocking external dependencies" section, some teams add a parallel entry that wires in mocks before the real entry. We don't need it (the fake-api and fake-auth-server are per-test fixtures), but a contributor might be tempted. **Decision: forbid it; document why.**
2. **Snapshot files in `apps/cli/test/__snapshots__/` or inline?** Inline (`toMatchInlineSnapshot`) is faster and keeps the assertion co-located; files make diffs larger but are easier to skim. **Recommendation: inline for E2E (small payloads), files for any future output-shape tests.**
3. **Stryker threshold.** 80 high / 70 low is the ADR-009 default for the monorepo. CLI is smaller and more linear than `packages/env`; 80/70 is achievable on first run. **Decision: adopt the ADR-009 threshold.**
4. **Do we run the e2e suite on `staging`?** Per ADR-021, `staging` is the integration branch. Running e2e on every push to `staging` (not just on PRs) gives an earlier signal of "this is what users will get on @canary". **Recommendation: add `push: branches: [staging]` to the e2e job, separate from the PR-required gate.**

## How to verify

After all six PRs land:

1. `pnpm --filter @deessejs/cli test` runs in < 5 seconds (L1 + L2 + L3).
2. `pnpm --filter @deessejs/cli test:e2e` runs in < 30 seconds (L4).
3. Stryker run completes in < 2 minutes; mutation score ≥ 80 high / ≥ 70 low.
4. `pnpm exec prettier --check apps/cli/test apps/cli/src` is clean.
5. Every CI job green on `staging` for 5 consecutive pushes (so we know the matrix is stable, not lucky).
6. A deliberate regression (e.g. remove `chmodSync` from `writeAuth`) is caught by at least one test in CI, on the PR that introduces it.

## Why this is the senior version

The existing `cli-v1-testing.md` is V1-grade: ship what catches the regressions you can already name, grow the matrix when bugs surface. This plan is V2-grade for the same surface area: ship a pyramid that catches the regressions you **can't** name yet, because the matrix exercises real binaries against real failure modes against real contracts.

The user-visible behaviour stays the same. The confidence changes.

## Related

- `docs/engineering/plans/cli-v1-testing.md` — the V1 plan this supersedes for new test work.
- `docs/engineering/plans/orpc-client-migration.md` — the oRPC testing patterns (Server-Side Client + MSW) we adopt for Layer 2.
- `docs/engineering/architecture/decisions/ADR-009-test-strategy.md` — the monorepo-level test strategy (80/75 coverage, three tiers, contract test layer). This plan instantiates it for `apps/cli`.
- `docs/engineering/architecture/decisions/ADR-010-env-package-senior.md` — the closed-list-of-error-codes pattern that drives U1.
- `docs/engineering/architecture/decisions/ADR-011-env-testing-strategy.md` — the `vi.stubEnv` + `mkdtempSync` patterns we adopt.
- `packages/api/tests/contract/templates-list.test.ts` — the reference for Server-Side Client tests.
- `apps/cli/test/integration/auth/login.test.ts` — the reference for fake-auth-server style.
- `apps/cli/CHANGELOG.md` — the regression history that justifies the matrix (1.1.0 missing `dist/`, 2.0.1 / 2.1.0 404s, chmod 0o600 on CI).
- oRPC testing recipe: <https://orpc.dev/docs/recipes/testing-and-mocking>
- Smashing Magazine: <https://www.smashingmagazine.com/2022/04/testing-cli-way-people-use-it/>
- StrykerJS: <https://stryker-mutator.io/docs/>
