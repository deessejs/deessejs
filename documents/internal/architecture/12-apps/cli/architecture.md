# Architecture — `deesse init`

The proposed architecture for the DeesseJS scaffolding CLI. The high-level shape comes from [`research.md`](./research.md). This doc is the concrete spec: file layout, command flow, dependencies, error paths, and the boundaries between the CLI and the templates it fetches.

## Scope at MVP

The MVP has exactly one command, and that command is **agent-first**.

```
deesse init [dir] --template <url>
```

Where `<url>` is:

- A full GitHub URL: `https://github.com/deessejs/template-starter`
- A `gh:` shorthand: `gh:deessejs/template-starter`
- A `github:` shorthand: `github:deessejs/template-starter#main` (with branch)
- A subdirectory in a repo: `gh:deessejs/template-starter/apps/web`
- A registered name: `starter` (resolved via the local `templates/*.json` catalog)

Out of scope at MVP:

- Interactive picker (when `--template` is omitted) — **never ships**, per agent-first thesis. If `--template` is missing, the CLI errors with a usage hint, not a prompt.
- `deesse check` / `deesse update` / `deesse config` — v0.2+
- Template-side `transform.ts` hooks — v0.2+ (MVP uses a built-in token table)
- Private templates with `GIGET_AUTH` — v0.2+ (no private templates at MVP)

## Agent-first contract

The CLI's primary audience is an AI agent running it from a Bash tool. Every design decision below optimizes for that audience first, human second. Humans can read the same output; agents need it parseable.

### 1. Every option has a flag (no interactive prompts)

If the user is an agent and the agent didn't pass a flag, the CLI **errors**, not prompts. Example:

```
$ deesse init my-app
Error: --template is required (agent-first mode; pass --template=<url> or use a registered name)
Run `deesse init --help` for the full list of options.

Docs: https://docs.deessejs.com/cli/init
```

If a non-agent human runs the CLI and forgets a flag, they get the same error (because in 2026 the only "human in a terminal" use case is also testable, and "always error" is simpler than "sometimes prompt").

### 2. Detect-agent and bail to non-interactive

```ts
import { isAgent } from '@vercel/detect-agent'

if (await isAgent() && !process.env.DEESSE_NO_AGENT_HINT) {
  process.stderr.write(`
Detected AI agent environment.

To create in one go, run:
  deesse init my-app --template <url>

To suppress this message, set DEESSE_NO_AGENT_HINT=1.

`)
}
```

This is the Vite 6+ pattern. The hint fires once, at the top of stderr. Agents that already know the command don't need to read it.

### 3. `--json` mode for structured output

```bash
deesse init my-app --template gh:deessejs/template-starter --json
```

Prints to stdout (when `--json` is passed):

```json
{
  "ok": true,
  "template": {
    "name": "starter",
    "version": "0.3.0",
    "resolved": "github:deessejs/template-starter@v0.3.0"
  },
  "project": {
    "dir": "./my-app",
    "packageName": "my-app"
  },
  "packageManager": "pnpm@9.15.0",
  "steps": [
    { "name": "fetch", "status": "ok", "durationMs": 1240 },
    { "name": "manifest", "status": "ok", "durationMs": 12 },
    { "name": "post-process", "status": "ok", "durationMs": 89 },
    { "name": "install", "status": "ok", "durationMs": 18234 },
    { "name": "git", "status": "ok", "durationMs": 1023 }
  ],
  "nextSteps": ["cd my-app", "pnpm dev"]
}
```

On failure:

```json
{
  "ok": false,
  "error": {
    "code": "TEMPLATE_NOT_FOUND",
    "message": "Template \"starter\" not found in the registry",
    "hint": "Run `deesse init --help` to see the list of registered names, or pass --template=<full-url>"
  }
}
```

### 4. Exit codes are semantic

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (bad flag, missing template, validation failure) |
| 2 | Network/IO failure (404, timeout, corrupted tarball) |
| 3 | Template invalid (manifest schema error, version mismatch) |
| 4 | Post-process failure (token replacement failed, file removal failed) |
| 5 | Install failure (nypm returned non-zero) |
| 6 | Git failure (git not installed, git init failed) |

An agent can branch on the exit code without parsing the error message. The Vite CLI uses a single `1` for everything; we go finer-grained because agents benefit from it.

### 5. Stdout is parseable, stderr is human-friendly

- **`stdout`**: `--json` output only (when `--json` is passed). Empty when `--json` is not passed (the Vite-style outro goes to stderr).
- **`stderr`**: spinners, progress, "Downloading template…", "Installing dependencies…", errors, the outro block. Everything an agent doesn't need to parse.

This is the `12-factor` discipline applied to CLI output. Most CLIs do the opposite (logs to stdout, exit code = the truth). For agent-first tooling, we invert it.

### 6. `--help` is self-documenting and machine-parseable

```
deesse init --help
```

Output (sent to stdout, so an agent can pipe it):

```
deesse init — scaffold a new DeesseJS project from a template repository

Usage:
  deesse init [dir] [options]

Arguments:
  dir                            Target directory. Defaults to "." if --in-place, else
                                 "./<name>". Use --in-place to scaffold into the current
                                 directory (must be empty).

Required:
  -t, --template <url|name>      Template URL or registered name. Examples:
                                   https://github.com/deessejs/template-starter
                                   gh:deessejs/template-starter#v0.3.0
                                   starter (resolved via local registry)

Options:
  -f, --force                    Override existing files in target dir.
      --in-place                 Scaffold into the current directory instead of creating
                                 a new one. Target must be empty unless --force is set.
      --port <number>            Value for the {{port}} token. Default: 3000.
      --org <slug>               Value for the {{orgSlug}} token. Default: "acme".
      --no-install               Skip `pnpm/npm/yarn install` after post-process.
      --no-git                   Skip `git init` + initial commit.
      --offline                  Use cache only; fail if cache is missing.
      --prefer-offline           Use cache if present, else download. Default.
      --package-manager <pm>     Override detected package manager (npm|pnpm|yarn|bun|deno).
      --auth <token>             Bearer token for private templates. Overrides GIGET_AUTH.

Output:
      --json                     Print structured JSON to stdout. Errors still go to stderr.
      --quiet                    Suppress non-error output on stderr.

Other:
  -h, --help                     Show this help and exit.
  -V, --version                  Show version and exit.

Environment:
  GIGET_AUTH                     Bearer token for private templates (default: none).
  DEESSE_NO_AGENT_HINT           Suppress the agent-detection hint (default: not set).
  NO_COLOR                       Disable colored output.

Exit codes:
  0  success
  1  user error (bad flag, validation)
  2  network/IO failure
  3  template invalid
  4  post-process failure
  5  install failure
  6  git failure

Examples:
  # Agent-friendly one-liner
  deesse init my-app --template starter --json

  # Pin to a specific template version
  deesse init my-app --template gh:deessejs/template-starter#v0.3.0

  # Scaffold in place (must be empty)
  deesse init --in-place --template starter

  # Skip install (CI does it later)
  deesse init my-app --template starter --no-install

More: https://docs.deessejs.com/cli/init
```

The help is verbose by design. An agent can `deesse init --help > help.txt` and parse it once, or the runtime can `child_process.execSync('deesse init --help')` to extract the flags it needs.

### 7. Auto-fill from env when running as an agent

When `@vercel/detect-agent` detects an agent, the CLI reads additional env vars to auto-fill flags the agent might forget:

```
DEESSE_TEMPLATE          default for --template (if not passed)
DEESSE_PORT              default for --port
DEESSE_ORG               default for --org
DEESSE_PACKAGE_MANAGER   default for --package-manager
DEESSE_AUTH              default for --auth (overrides GIGET_AUTH)
```

This lets a coding-agent platform set env vars once and have every `deesse init` invocation inherit the defaults. The CLI does the same for non-agents too (env defaults are universal), but the naming convention is documented in the help to nudge agent platforms toward setting them.

### 8. E2E with a real agent

A nightly CI job:

1. Spawns Claude Code headless in a temp dir
2. Passes the prompt: "Scaffold a new DeesseJS project using `deesse init`. Use the `minimal` template."
3. Captures the bash invocations Claude made
4. Asserts: Claude ran exactly one `deesse init` with `--template=minimal` and `--json`. Output is valid JSON. Exit code is 0.
5. Asserts: the resulting project typechecks and builds.

If Claude gets confused (asks the user, prompts interactively, picks the wrong template), the CI is red. This is the canary: if a real agent can't use the CLI, no agent will.

This is the test that justifies the agent-first contract. Every other test (unit, integration, smoke) checks the CLI in isolation. The agent E2E checks the CLI in the hands of its primary user.

## Module layout

```
deessejs/deesse/                          (separate repo, see ADR 0002)
└── packages/cli/
    ├── src/
    │   ├── index.ts                      # entry — mri parse + dispatch
    │   ├── commands/
    │   │   └── init.ts                   # the only command at MVP
    │   ├── fetcher/
    │   │   ├── resolve-source.ts         # URL → giget input string
    │   │   ├── fetch.ts                  # giget wrapper + cache flags
    │   │   └── error-translate.ts        # giget errors → human messages
    │   ├── post-process/
    │   │   ├── manifest.ts               # read & validate template's manifest.json
    │   │   ├── package-json.ts           # set name, preserve indent
    │   │   ├── tokens.ts                 # {{projectName}} etc. replacement
    │   │   ├── files.ts                  # remove CHANGELOG/CONTRIBUTING/.codesandbox
    │   │   └── agents-md.ts              # generate AGENTS.md (with CLAUDE.md symlink)
    │   ├── install/
    │   │   └── install.ts                # nypm wrapper
    │   ├── git/
    │   │   └── git.ts                    # git init + add + initial commit
    │   ├── outro/
    │   │   └── outro.ts                  # Vite-style done message
    │   ├── ui/
    │   │   ├── prompts.ts                # @clack/prompts wrappers
    │   │   ├── spinner.ts                # download progress
    │   │   └── detect-agent.ts           # @vercel/detect-agent
    │   └── util/
    │       ├── pm.ts                     # detect package manager
    │       ├── paths.ts                  # target dir validation
    │       └── logger.ts                 # picocolors wrapper
    ├── test/
    │   ├── e2e/
    │   │   ├── fetch.test.ts             # real giget download from fixtures repo
    │   │   ├── post-process.test.ts
    │   │   ├── install.test.ts           # uses pnpm on a fixture
    │   │   └── full-flow.test.ts         # npx deesse init → app ready
    │   ├── fixtures/
    │   │   ├── template-minimal/         # minimal valid template
    │   │   └── template-with-tokens/     # template with manifest + tokens
    │   └── unit/
    │       ├── resolve-source.test.ts
    │       ├── tokens.test.ts
    │       └── ...
    ├── package.json
    ├── tsconfig.json
    ├── README.md                          # user-facing usage docs
    └── CHANGELOG.md
```

## Command flow

```
$ deesse init my-app --template https://github.com/deessejs/template-starter
```

### 1. Parse args

`mri` (Vite-style) gives a minimal, fast path:

```ts
const argv = mri(process.argv.slice(2), {
  string: ['template'],
  boolean: ['no-install', 'no-git', 'force', 'offline', 'prefer-offline'],
  alias: { t: 'template', f: 'force' },
})
```

### 2. Detect environment

- `process.stdin.isTTY` → interactive mode flag
- `@vercel/detect-agent` → print the non-interactive form upfront if the env is an agent
- `process.env.npm_config_user_agent` → package manager + version

If the env is an agent, print *before* doing anything else:

```
To create in one go, run: deesse init my-app --template https://github.com/deessejs/template-starter
```

This is the Vite pattern. Cheap, high-leverage.

### 3. Validate the target directory

Three checks, in order:

1. **Writeable** — `fs.access(dirname(root), fs.constants.W_OK)`
2. **Empty** — `fs.readdirSync(root).length === 0` (or contains only `.git`)
3. **Conflict resolution** — if not empty, 3-way prompt (override / different / abort) per Nuxt

If `argv.force` is set, skip the prompt and override.

### 4. Resolve the template source

```ts
function resolveSource(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input  // giget passes through
  }
  if (input.startsWith('gh:') || input.startsWith('github:')) {
    return input  // giget native
  }
  if (input.includes('/')) {
    return `gh:${input}`  // deessejs/template-starter → gh:deessejs/template-starter
  }
  // Bare name → look up the local catalog
  return lookupInCatalog(input)
}
```

The catalog is `templates/*.json` in the CLI repo. Each file is a giget-compatible source descriptor:

```json
{
  "name": "starter",
  "description": "Auth + DB + mail — the recommended starting point",
  "tar": "https://codeload.github.com/deessejs/template-starter/tar.gz/main",
  "defaultDir": "deessejs-starter",
  "url": "https://github.com/deessejs/template-starter"
}
```

This is the giget registry format verbatim — no translation needed.

### 5. Fetch

```ts
const { dir } = await downloadTemplate(source, {
  force: argv.force,
  cwd: process.cwd(),
  dir: targetDir,
  preferOffline: true,   // re-use the giget cache when present
  offline: false,
  install: false,         // we do install ourselves for better error handling
  auth: process.env.GIGET_AUTH,
})
```

`giget` handles:

- Tarball download from the right provider (GitHub, GitLab, Bitbucket, sourcehut, custom URL)
- Caching in `~/.cache/giget/<provider>/<name>/<version>.tar.gz`
- Offline mode (`--offline`/`--prefer-offline`)
- Auth via `Authorization: Bearer <token>` header
- Subdir extraction (`gh:deessejs/template-starter/apps/web` extracts only that subfolder)

Errors are caught and translated to human messages:

| `giget` error | CLI message |
|---|---|
| 404 from GitHub | `Template "{name}" not found. Check the URL or branch.` |
| Network failure | `Could not download the template. Check your connection or use --offline with a previously cached version.` |
| Tarball parse failure | `Template tarball is corrupted. Try again, or report an issue with the template URL.` |
| `Unsupported provider` | `Template URL uses an unsupported provider. Supported: github, gitlab, bitbucket, sourcehut, custom URL.` |

### 6. Post-process

This is where the manifest + token system does its work. See [`template-conventions.md`](./template-conventions.md) for the manifest schema.

```ts
async function postProcess(dir: string, manifest: Manifest) {
  // 1. Read the manifest (already validated in step 5)
  // 2. Rewrite package.json — set name, preserve indent
  // 3. Replace tokens listed in manifest.tokens (default: projectName, port, orgSlug)
  // 4. Remove files in manifest.remove (CHANGELOG.md, .codesandbox/, etc.)
  // 5. Generate AGENTS.md
  // 6. Symlink AGENTS.md to CLAUDE.md
}
```

**Token replacement is bounded.** Only the token names declared in the manifest are replaced. No generic regex sweep, no AST transform, no eval. If a template needs more, it ships a `transform.ts` (v0.2+).

**File removal is bounded.** The manifest declares a fixed list of paths to remove (no globbing, no `*` matches). This keeps the post-process auditable.

**AGENTS.md generation** is a hard-coded string template, not loaded from the manifest. The template can't customize this file (it would be hard to keep agents in sync if every template had its own version).

### 7. Install

```ts
if (!argv.noInstall) {
  await installDependencies({
    cwd: targetDir,
    packageManager: detectedPM,
    silent: false,
  })
}
```

`nypm` (same ecosystem as `giget`) handles the package-manager-specific commands:

- `pnpm install`
- `npm install`
- `yarn install`
- `bun install`
- `deno install`

Failure here is a soft error: print a warning, but don't abort. The user can `cd my-app && pnpm install` themselves.

### 8. Git init

```ts
if (!argv.noGit) {
  spawn.sync('git', ['init'], { cwd: targetDir, stdio: 'inherit' })
  spawn.sync('git', ['add', '-A'], { cwd: targetDir, stdio: 'inherit' })
  spawn.sync('git', ['commit', '-m', 'chore: scaffold from deessejs/template-{name}'], {
    cwd: targetDir,
    stdio: 'inherit',
    env: { ...process.env, GIT_AUTHOR_NAME: 'deesse', GIT_AUTHOR_EMAIL: 'cli@deessejs.com' },
  })
}
```

`GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` override ensures the first commit has a real identity even if the user hasn't set up git globally.

### 9. Outro

```
Done. Now run:
  cd my-app
  pnpm dev
```

The cd command is quoted if the directory name has spaces. The install/dev commands are package-manager aware.

## Dependencies

| Package | Version | Why |
|---|---|---|
| `mri` | `^1.2.0` | Lean arg parse (Vite pattern) |
| `@clack/prompts` | `^1.6.0` | Modern prompt UI (Vite/T3/Nuxt standard) |
| `giget` | `^2.0.0` | Tarball fetch + offline cache (Nuxt/Astro standard) |
| `nypm` | `^0.6.0` | Package manager abstraction (Nuxt/T3 standard) |
| `cross-spawn` | `^7.0.6` | Cross-platform subprocess (for git) |
| `picocolors` | `^1.1.1` | Tiny color library (Vite/Next.js pattern) |
| `@vercel/detect-agent` | `^1.2.0` | AI agent detection (Vite 6+ pattern) |
| `validate-npm-package-name` | `^5.0.0` | Validate directory names (Next.js pattern) |

Dev dependencies: `typescript`, `tsx` (for dev), `vitest` (for tests), `nock` (for fetch mocking), `@types/node`.

Total runtime dependency count: **8**. Total dev count: **~6**. Smaller than `create-next-app`, comparable to `create-vite`.

## Error paths

| Phase | Error | Behavior |
|---|---|---|
| Arg parse | Invalid flag | Print usage, exit 1 |
| Env detect | TTY missing + no `--no-interactive` flag | Fall back to defaults silently |
| Target dir | Not writable | Error, exit 1 |
| Target dir | Not empty + no `--force` | 3-way prompt (override / different / abort) |
| Source resolve | Unknown bare name | Error: "Unknown template 'X'. Run `deesse init --help` for the list." |
| Fetch | 404 | Error: template not found |
| Fetch | Network failure + no cache | Error: suggest `--offline` or check connection |
| Fetch | Corrupted tarball | Error: try again, file an issue |
| Manifest | Missing `manifest.json` | Error: template is not a valid DeesseJS template |
| Manifest | Invalid schema | Error: specific validation error |
| Manifest | `deesse` version too old | Error: "Template requires deesse >=X.Y.Z, you have A.B.C. Run `npx deesse@latest`." |
| Post-process | `package.json` missing | Error: template is malformed |
| Post-process | Token not replaced in any file | Warning: "Token {{port}} not used in any file" (not fatal) |
| Install | Non-zero exit | Warning: print install command, continue |
| Git | `git` not installed | Warning: skip git init, continue |
| Git | Non-zero exit | Warning: "git init failed. Run `cd my-app && git init` manually." |

## Testing strategy

| Level | Tool | What it covers |
|---|---|---|
| Unit | `vitest` | `resolveSource`, `tokens`, `packageJsonRewrite`, `manifest validate` |
| Integration | `vitest` + `nock` | Giget fetcher against recorded responses |
| E2E | `vitest` + temp dir | Full flow: download a fixture template, post-process, install in a temp pnpm workspace, typecheck, build |
| Smoke | npm `prepublishOnly` | `deesse init ./test-output --template <fixture-local-path>` and verify the result runs |

E2E tests run against a local fixture (`test/fixtures/template-minimal/`) — they do not hit GitHub. This keeps CI fast and deterministic.

A nightly CI job (or a separate workflow) hits the real GitHub URLs of the official templates to catch drift.

## What we don't build at MVP

- ❌ A picker (`deesse init` with no `--template` prompts the user). Deferred to v0.2.
- ❌ `deesse check` (validate a project is a valid DeesseJS template). Deferred to v0.3.
- ❌ `deesse update` (re-pull a template and smart-merge). Deferred to v0.3.
- ❌ Template-side `transform.ts` hooks. Deferred to v0.2.
- ❌ Private templates with `GIGET_AUTH`. Deferred to v0.2.
- ❌ `deesse diff` (compare local to upstream). Deferred to v0.4.
- ❌ Self-update check (`update-check`). Deferred to v0.4.

Each deferred item is documented in [`roadmap.md`](./roadmap.md) with a one-line rationale.
