# Roadmap — `deesse init` build sequence

The path from "nothing exists" to "v1.0". Each milestone is a self-contained deliverable that can ship independently.

> **Note: agent-first.** The primary audience for every milestone below is an AI coding agent (Claude Code, Cursor, Codex). Every deliverable is tested against a real agent before being marked done. M0–M7 ship as v0.1.0; everything after is post-MVP.

## Milestones

| # | Milestone | Deliverable | Effort | Blocks |
|---|---|---|---|---|
| **M0** | Skeleton + agent detection | `deessejs/deesse` repo with `packages/cli/` scaffold, CI, `@vercel/detect-agent` wired in, agent hint on stderr | 1.5 days | nothing |
| **M1** | First fetch | `deesse init --template <url>` works end-to-end on a hardcoded test repo (no manifest validation yet) | 2 days | M0 |
| **M2** | Manifest + tokens | Manifest validation, built-in token replacement, file removal, `AGENTS.md` generation | 2 days | M1 |
| **M3** | Install + git + outro | `nypm` install, git init + first commit, Vite-style outro | 1 day | M1 |
| **M4** | First public template | Fork `apps/template` → `deessejs/template-starter`, add `manifest.json`, verify it scaffolds correctly | 2 days | M2 + M3 |
| **M5** | Catalog | `templates/*.json` registry, `--template <name>` resolution via the catalog | 1 day | M4 |
| **M6** | Agent-first contract | `--json` output mode, semantic exit codes, `--help` self-doc, env-based defaults, stdout/stderr discipline | 2 days | M5 |
| **M7** | Agent E2E + `v0.1.0` release | Nightly CI runs Claude Code headless on each template; first npm release; deessejs.com docs | 2 days | M6 |
| **M8** | More templates | `template-minimal`, `template-lite` (re-scope of `apps/lite`) | 2 days | M7 |
| **M9** | v0.2 features | `GIGET_AUTH` for private templates, `transform.ts` hook, `--offline`/`--prefer-offline` flags, multi-target `--in-place` | 3 days | M7 |
| **M10** | v1.0 | `deesse check`, `deesse update` (smart-merge), `deesse diff`, self-update check | 5 days | M8 + M9 |

Total: **~23 days of focused work**, can be parallelized across M4 (template fork) and M5/M6 (CLI + agent contract).

## M0 — Skeleton + agent detection

**Output**: an empty `deessejs/deesse` repo with a working `pnpm dev` loop on `packages/cli/`, and `@vercel/detect-agent` wired in (prints the agent hint on stderr).

- Create the repo (separate from the main `deessejs/deessejs` repo, per [decision 0002](./decisions/0002-cli-as-external-published-package.md))
- `pnpm-workspace.yaml`, root `package.json`, root `tsconfig.json`
- `packages/cli/` with `package.json` (bin: `deesse`), `src/index.ts` that:
  - Detects agent via `isAgent()` from `@vercel/detect-agent`
  - Prints the agent hint to stderr (suppressible via `DEESSE_NO_AGENT_HINT=1`)
  - Prints "deesse CLI v0.0.0" to stdout and exits 0
- Minimal `vitest` config
- GitHub Actions CI: typecheck, unit tests, lint
- README explaining the repo's purpose (links back to this docs folder)

**Why agent detection is in M0, not later**: it's the routing primitive for every other milestone. Every subsequent milestone asks "what does this do when an agent runs it?" — having the detection in place from day 1 means that question gets answered consistently, not bolted on at M6.

## M1 — First fetch

**Output**: `deesse init my-app --template https://github.com/some/repo` downloads the tarball and extracts it.

- Add `giget` and `mri` to dependencies
- Implement `src/fetcher/resolve-source.ts` and `src/fetcher/fetch.ts`
- Implement `src/index.ts` arg parse + the fetch call
- No manifest validation, no post-process, no install, no outro. Just: download → extract → done.
- Manual smoke test: `node dist/index.js init /tmp/test --template https://github.com/some/small-repo`

**Why this is its own milestone**: the fetch + extract is the highest-risk part. It needs to work in isolation before the rest can build on it.

## M2 — Manifest + tokens

**Output**: the CLI reads `manifest.json`, validates it, replaces declared tokens, removes declared files, generates `AGENTS.md`.

- Implement `src/post-process/manifest.ts` (validation)
- Implement `src/post-process/tokens.ts` (replacement)
- Implement `src/post-process/files.ts` (removal)
- Implement `src/post-process/agents-md.ts` (generation + CLAUDE.md symlink)
- Implement `src/post-process/index.ts` (orchestrates the four above)
- Unit tests for each
- Test against a fixture template in `test/fixtures/`

**Why manifest validation is M2, not M1**: fetching a template that has no manifest should still work at M1. M1 is the "raw tarball" case. M2 makes the contract enforceable.

## M3 — Install + git + outro

**Output**: the CLI installs deps, initializes git, prints the done message.

- Add `nypm` to dependencies
- Implement `src/install/install.ts`
- Implement `src/git/git.ts` (with `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` override)
- Implement `src/outro/outro.ts` (package-manager aware)
- Soft-fail on install errors (print warning, continue)

**Why install is separate from M2**: post-process and install/git are independent concerns. Either can be tested in isolation. Splitting them keeps the milestones tight.

## M4 — First public template

**Output**: `deessejs/template-starter` exists on GitHub and scaffolds a working DeesseJS project.

- Fork `apps/template/` to `deessejs/template-starter`
- Add `manifest.json` at the root
- Strip the `apps/template/`-specific workspace glue (the buyer-facing CLI, the `pnpm-workspace.yaml` if it's a single-app now, the `documents/` folder, etc.)
- Verify it scaffolds cleanly via the M3 CLI
- Smoke test: `pnpm install` → `pnpm typecheck` → `pnpm build` in the scaffolded output

**Why M4 is a separate milestone**: the first public template is its own decision point. It's where "the contract works in production" gets validated. If `apps/template` can't be forked cleanly, the contract needs adjustment before M5.

## M5 — Catalog

**Output**: `deesse init --template starter` resolves via the local `templates/*.json` catalog.

- Create `templates/starter.json` pointing to `deessejs/template-starter`
- Implement `src/commands/init.ts` resolution: bare name → catalog lookup → giget source
- Smoke test: `deesse init my-app --template starter` and `deesse init my-app --template https://github.com/deessejs/template-starter` produce the same result

## M6 — Agent-first contract

**Output**: the CLI is fully usable by an AI coding agent without human intervention.

This milestone is **not polish**. It's the load-bearing work that makes the CLI a viable tool for its primary audience. The full contract is in [`architecture.md#agent-first-contract`](./architecture.md#agent-first-contract).

- `--json` output mode — structured success and failure objects to stdout
- Semantic exit codes (0/1/2/3/4/5/6) per the table in `architecture.md`
- `--help` self-documenting — includes flag list, exit codes, env vars, and 4+ examples
- Env-based defaults (`DEESSE_TEMPLATE`, `DEESSE_PORT`, `DEESSE_ORG`, `DEESSE_PACKAGE_MANAGER`, `DEESSE_AUTH`) wired through every flag
- Stdout/stderr discipline — `--json` mode = JSON on stdout, everything else on stderr. Default mode = empty stdout, all output on stderr.
- `--quiet` flag — suppresses non-error output on stderr (for CI logs)
- 3-way dir conflict (override / different / abort) — Nuxt pattern
- Package-manager detection via `npm_config_user_agent` + translation matrix (like Vite's `getFullCustomCommand`)
- Cancel handling — if a future prompt is added, every prompt has `if (isCancel(x)) return cancel()`

The `architecture.md` error table is the source of truth for the JSON shape. Tests assert against it.

## M7 — Agent E2E + `v0.1.0` release

**Output**: the first npm release, validated by a real AI agent, documented on deessejs.com.

This milestone **combines** what was previously two milestones (Polish + release) because the agent E2E test is the validation gate for v0.1.

- Bump version, push tag, CI publishes to npm with provenance
- Nightly CI job spawns Claude Code headless in a temp dir, prompts: "Scaffold a new DeesseJS project using `deesse init`. Use the `minimal` template."
- Capture Claude's bash invocations
- Assert: Claude ran exactly one `deesse init` with `--template=minimal` and `--json`. Output is valid JSON. Exit code is 0.
- Assert: the resulting project typechecks and builds.
- If Claude gets confused (asks the user, picks the wrong template, retries), CI is red
- Smoke test on the real npm release (`npx @deessejs/cli init` against a fixture)
- Update `deessejs.com` docs with the install command
- Add a "Get started" page in `apps/docs/`

**This is the MVP**. Everything after M7 is post-MVP.

**Why agent E2E is in M7, not earlier**: it's expensive (Claude Code invocation, real network, real installation). Running it on every commit would slow CI to a crawl. The nightly schedule is the sweet spot — runs once a day, catches regressions, doesn't block PRs.

## M8 — More templates

**Output**: `template-minimal` and `template-lite` exist and scaffold correctly.

- `template-minimal`: bare-bones Next.js + Hono bridge, no auth, no DB. The "what's the minimum DeesseJS looks like" demo.
- `template-lite`: re-scope of `apps/lite/` (per memory: demo-first incremental build). The OSS subset.

## M9 — v0.2 features

The first round of post-MVP features. The exact priority depends on what users actually ask for.

> **Note**: the previously-planned "interactive picker" is **permanently deferred**. The CLI is agent-first; an interactive picker would actively hurt the primary audience. If a human wants to browse templates, they visit `deessejs.com/templates` instead.

- **`GIGET_AUTH` for private templates**: read from env var, pass to `giget`
- **Template-side `transform.ts` hook**: per-template, optional, executed by the CLI after the built-in post-process. Lets templates do custom file edits (e.g. removing a GitHub Actions workflow that doesn't apply, swapping a Tailwind preset).
- **`--offline` / `--prefer-offline`** flags: already supported by `giget`, just need to expose
- **Multi-target `--in-place`**: scaffold into the current directory (already in M6, but expanded in M9 to handle non-empty dirs with a `--force-merge` mode)

## M10 — v1.0

- **`deesse check`**: validate a project is a valid DeesseJS template (manifest present, tokens valid, etc.)
- **`deesse update`**: re-pull the template, smart-merge (3-way merge on `package.json`, take upstream on `apps/`, take local on `{{tokens}}` substitutions)
- **`deesse diff`**: compare local to upstream
- **Self-update check** (`update-check`): warn if CLI is older than latest

## What we explicitly defer past v1.0

- `deesse add` (shadcn-style add-a-component, but for templates)
- A web UI for browsing templates (humans can use `deessejs.com/templates`)
- A paid template marketplace
- A hosted registry (replacing the local `templates/*.json` with an HTTP endpoint)
- A VSCode extension for scaffolding from the editor
- **Any interactive prompt at runtime.** The CLI is agent-first; UX investments for humans go on the web, not in the terminal.

These are not in the v0–v1 scope. Each would be its own ADR if pursued.

## Open risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `giget` breaks against GitHub's rate limits | Medium | Medium | `--prefer-offline` + `GIGET_AUTH` for CI |
| The `manifest.json` schema doesn't cover a real use case | Low | High | v0.2 adds `transform.ts` hook for escape hatch |
| `apps/template` can't be forked cleanly | Medium | High | M4 is a separate milestone to catch this early |
| Template authors skip the manifest | Low | Medium | CLI error message is specific and points to the schema |
| The CLI grows scope creep (config, plugins, etc.) | High | Medium | Roadmap explicitly defers these to v0.2+; new ADRs required to add |
| Token replacement is too limited for some templates | Medium | Low | v0.2 hook + the manifest's flexibility on `tokens` array |
| **An agent can't figure out the CLI** (picks wrong flag, prompts interactively, gives up) | Medium | High | M7's Claude Code headless E2E is the canary. If it fails, the agent-first contract is incomplete. |
| **`@vercel/detect-agent` misses a new agent** (e.g. a future one) | Medium | Low | The hint is informational, not a routing gate. Agents that miss detection still get parseable output (--json, exit codes). The contract holds. |
| **The JSON output schema drifts** between releases | Low | High | Version the JSON shape: `{"version": "0.1.0", "ok": true, ...}`. Breaking changes require a major bump. |
| **Claude Code E2E becomes flaky** (network, rate limits, agent behavior change) | Medium | Medium | The test is in nightly, not on PRs. If it fails 3 nights in a row, investigate; if it fails 1 night, treat as flake. |
