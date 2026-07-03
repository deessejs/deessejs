# `apps/cli` — the DeesseJS init scaffolder (proposed, **agent-first**)

> **Status: proposed.** This app does not exist yet. The folder documents the plan, the research behind it, and the local ADRs. Nothing in here is shipped.

## TL;DR

This CLI's primary audience is **AI coding agents** (Claude Code, Cursor, Codex, and the next ones). Humans are a secondary audience who will occasionally run the same command.

The implications:

- **No interactive picker at MVP.** Agents cannot reliably fill in `@clack/prompts`. Every option has a flag.
- **Non-TTY by default.** The CLI never blocks on input. If `--template` is missing, it errors with a usage hint, not a prompt.
- **`--json` output mode** for structured results (success or failure).
- **Exit codes are semantic** — `0` success, `1` user error, `2` network/IO, `3` template invalid, `4` post-process failed.
- **Stdout is parseable.** All human-friendly messages go to stderr. An agent that greps stdout gets machine data only.
- **E2E tests run against a real agent** (Claude Code headless) on each official template. If Claude can't scaffold a template, the CI is red.

This is consistent with the DeesseJS positioning: agent-first SaaS template. The CLI is the first surface an agent touches.

## Two CLIs, two audiences

The CLI that scaffolds a new DeesseJS project from a template repository. It is **not** the buyer-facing CLI documented in `apps/template/apps/cli/` (see [system ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md)). The two CLIs serve different audiences:

| CLI | Audience | Purpose |
|---|---|---|
| **`apps/template/apps/cli/`** (existing) | The buyer's end users | Talk to the buyer's deployed service via `@deessejs/sdk`. Single-file Bun binary. |
| **`apps/cli/`** (this folder) | **AI agents** (primary), new DeesseJS adopters (secondary) | Pull a template repo from GitHub, post-process it, install deps, hand off a runnable project. Published on npm. |

The two CLIs share no code and no release cadence.

## What it does

A single command turns "I want to start a DeesseJS project" into a working local repo:

```bash
npx @deessejs/cli init my-app --template https://github.com/deessejs/template-starter
```

Internally:

1. Resolves the template source (any URL, GitHub shorthand, or registered name)
2. Downloads a tarball via `giget` (offline cache, multi-provider, auth-aware)
3. Extracts the template, post-processes the files (set `name` in `package.json`, replace `{{projectName}}` tokens, generate `AGENTS.md`)
4. Installs dependencies via `nypm` (pnpm/npm/yarn/bun/deno)
5. Initializes a git repo with a first commit
6. Prints a Vite-style outro block (`cd my-app && pnpm dev`)

## What lives here (when built)

The CLI will live in a **separate public repo** (`deessejs/deesse`), not in this monorepo. See [decision 0002](./decisions/0002-cli-as-external-published-package.md). The folder you are reading is the documentation home for the design.

```
deessejs/deesse/                            (separate repo)
├── packages/
│   └── cli/
│       ├── src/
│       │   ├── index.ts                    # entry point + mri arg parse
│       │   ├── init.ts                     # the init command
│       │   ├── fetcher.ts                  # giget wrapper
│       │   ├── post-process.ts             # file transforms
│       │   ├── tokens.ts                   # {{...}} token replacement
│       │   ├── install.ts                  # nypm wrapper
│       │   ├── git.ts                      # git init + first commit
│       │   ├── outro.ts                    # done message
│       │   └── agents-md.ts                # AGENTS.md generator
│       ├── test/                           # e2e: download each template
│       ├── package.json
│       └── README.md
├── templates/                              # the built-in templates (registry)
│   ├── minimal.json                        → gh:deessejs/template-minimal
│   ├── starter.json                        → gh:deessejs/template-starter
│   └── lite.json                           → gh:deessejs/template-lite
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Audience

| Role | What they touch |
|---|---|
| **AI coding agents** (primary) | The published CLI. They run `npx @deessejs/cli init` via `Bash(npx ...)`. They consume `--json` output. They never see interactive prompts. |
| **Human developers** (secondary) | The same CLI, in a terminal. They get a friendlier error message on stderr and a Vite-style outro block. |
| **Template authors** (us, later the community) | Push a repo to GitHub with a `manifest.json` at the root. No PR to the CLI required. |
| **DeesseJS core team** | Maintains the CLI repo, the template repos, and the registry (`templates/*.json`). |

## Surface

- **npm package**: `@deessejs/cli` (or `create-deessejs`, TBD per [decision 0002](./decisions/0002-cli-as-external-published-package.md))
- **Bin**: `deesse` (or `create-deessejs`)
- **One command at MVP**: `init [dir] --template <url>`
- **Distribution**: npm only (no binary needed — Node ≥ 22.12 is the only runtime requirement, well within the 2026 standard)

## Deploy

The CLI ships as a normal npm package. The release process:

1. Bump version in `package.json` + push a tag
2. CI publishes to npm via the standard `npm publish` flow with provenance
3. Tag triggers a smoke test on the E2E template set (download + install + typecheck + build)

No GitHub release artifacts needed (vs. the buyer-facing CLI which is a Bun single-binary).

## Conventions specific to this app

- **Zero dependencies on the monorepo.** The CLI is published as a standalone npm package. No `workspace:*` references. This keeps the release cycle independent of the template product.
- **Templates are external GitHub repos**, not files in this monorepo. The CLI consumes them via URL. This is the core architectural decision — see [decision 0001](./decisions/0001-giget-as-fetch-primitive.md).
- **Every template must declare a `manifest.json`** at the repo root. Schema in [`template-conventions.md`](./template-conventions.md). The CLI validates the manifest before extracting the tarball.
- **Post-process is bounded.** The CLI replaces only the tokens listed in the template's `manifest.json` (`projectName`, `port`, `orgSlug`, etc.). No generic AST transform, no eval. Anything more complex = the user edits it after scaffolding.
- **No "fix it later" hooks at MVP.** Template custom logic (e.g. a `transform.ts`) is a v2 feature. The MVP has a fixed replacement table.
- **Offline cache by default.** `giget` caches tarballs in `~/.cache/giget` and reuses them when the user is offline (or wants to be, via `--prefer-offline`). This matches the Nuxt and Astro behavior.
- **Agent-first DX.** Every option has a flag (no interactive prompts). Defaults are sane. `--json` output is parseable. Exit codes are semantic. Stdout is structured; logs go to stderr. The full contract lives in [`architecture.md`](./architecture.md#agent-first-contract).

## Cross-references

### System concerns

- [`../../01-stack/`](../../01-stack/) — the tech matrix (no new stack; the CLI reuses the established pattern: giget, nypm, clack)
- [`../../07-deployment/`](../../07-deployment/) — npm publishing flow

### System ADRs

- [ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md) — the **buyer-facing** CLI (Bun + single-binary). Different CLI, different scope.
- [ADR 0012](../../10-decisions/0012-template-as-pattern.md) — why each `apps/*` is its own DeesseJS instance. The scaffolding CLI is *outside* this system.

### Local docs

- [`research.md`](./research.md) — senior CLI patterns researched (create-next-app, create-vite, create-t3-app, shadcn, giget, Nuxt, Astro)
- [`architecture.md`](./architecture.md) — the proposed architecture in depth
- [`template-conventions.md`](./template-conventions.md) — the `manifest.json` schema and the rules every template repo must follow
- [`roadmap.md`](./roadmap.md) — the build sequence (skeleton → MVP → v0.2)

### Local ADRs

- [0001 — giget as the fetch primitive](./decisions/0001-giget-as-fetch-primitive.md)
- [0002 — CLI as an external published package](./decisions/0002-cli-as-external-published-package.md)
- [0003 — CLI stack: mri + clack + giget + nypm](./decisions/0003-cli-stack.md)

## Open questions (awaiting founder)

1. **npm package name + bin.** `@deessejs/cli` (scoped, bin `deesse`) vs. `create-deessejs` (unscoped, conventional, bin `create-deessejs`). Default rec: `create-deessejs` + alias `deesse`.
2. ~~**MVP scope.** Strict `init --template URL` only, or also interactive picker when `--template` is omitted.~~ **RESOLVED 2026-07-02**: agent-first means no interactive picker at MVP. Strict flag-only mode. If `--template` is missing, the CLI errors with a usage hint, not a prompt.
3. **Token replacement surface.** Built-in regex table for MVP, or expose a template-side `transform.ts` hook from day 1. Default rec: built-in only for MVP.
4. **Private templates.** Expose `GIGET_AUTH` env var at MVP for the `cloud` template, or defer to v0.2. Default rec: defer.
5. **Migration timing.** Migrate `apps/template` → `deessejs/template-starter` as part of MVP, or after MVP ships. Default rec: after MVP (M4 of the roadmap is its own milestone).
6. **Templates registry file.** Ship a JSON registry in the CLI repo (`templates/*.json`), or hard-code the supported templates in the source. Default rec: registry file (mirrors giget's own format).
7. **NEW — Agent-detection contract.** When the CLI detects an AI agent via `@vercel/detect-agent`, what should it do beyond printing the non-interactive form upfront? Auto-set sane defaults (e.g. `--no-install=false`, `--package-manager=detected`)? Or always require explicit flags? Default rec: auto-set defaults from env, override with explicit flags.
