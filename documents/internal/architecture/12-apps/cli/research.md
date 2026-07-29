# Senior CLI patterns — research synthesis

The research behind the DeesseJS init CLI architecture. Five reference CLIs were studied in their current (2026) source code on `main`/`canary`. The goal: identify the patterns that hold up across implementations, the ones that diverge, and the gaps each one leaves that we can fill.

## Reference implementations

| CLI | Source | Commit / version | Why it's relevant |
|---|---|---|---|
| `create-next-app` | `vercel/next.js` `canary` | `16.3.0-canary.57` | The "templates in a tarball" pattern; latest App Router options |
| `create-vite` | `vitejs/vite` `main` | `9.1.0` | The "templates in package" pattern; `@clack/prompts` integration; AI-agent detection |
| `create-t3-app` | `t3-oss/create-t3-app` `main` | `4709861f` | The "base + installer registry" pattern; matrix of add-ons |
| `shadcn` CLI | `shadcn-ui/ui` `main` | latest | The "no template, copy into existing project" pattern; preflight checks |
| `nuxi` (Nuxt) | `nuxt/cli` `main` | latest | `giget` integration done right; interactive picker with remote template catalog |
| `create-astro` | `withastro/astro` `main` | latest | `giget` with branch routing; AGENTS.md generation pattern |
| `giget` | `unjs/giget` `main` | latest | The de facto fetch primitive; zero-dep, offline cache, multi-provider |

## The three (plus one) archetypes

### Archetype A — Template shipped in the npm package

**`create-vite`** is the canonical example. Each template is a folder in the package (`packages/create-vite/template-react-ts/`, etc.). On `init`:

1. User picks a template via `@clack/prompts` (or `--template` flag)
2. CLI copies the folder to the target directory
3. CLI rewrites `package.json` (set `name` from the user's arg, merge scripts)
4. CLI optionally adds ESLint config, React Compiler config, etc. (post-processes specific files)
5. CLI runs `pnpm/npm install` if `--immediate`

**Tradeoffs**

- ✅ Zero network at runtime (after `npx` resolves the package)
- ✅ Deterministic: what you ship is what you get
- ✅ Fast: 5–10 seconds end to end
- ❌ Bump the package version to ship a template update (no independent iteration)
- ❌ Templates bloat the npm package size if you have many

### Archetype B — Template fetched from a tarball

**`create-next-app`** is the canonical example. Templates live as subfolders in the `vercel/next.js` repo. On `init`:

1. User picks options (TS/JS, App/Pages, Tailwind, ESLint, src/, import alias, etc.)
2. CLI composes a `template` string: `app-tw-empty`, `default-tw`, etc.
3. CLI downloads `https://codeload.github.com/vercel/next.js/tar.gz/canary` via `fetch` + `tar.x`
4. CLI extracts only the matching subfolder via a `filter` callback
5. CLI copies additional files (`gitignore`, `next-env.d.ts`) from local package assets
6. CLI retries the download 3× with `async-retry`

**Tradeoffs**

- ✅ Templates update independently of the CLI (the source of truth is the canary branch)
- ✅ Always ships the latest examples
- ❌ Network heavy (full repo tarball even if you only want one example)
- ❌ Brittle if the repo is renamed (the `rootPath` workaround in the source is a smell)

### Archetype C — Base + installer registry

**`create-t3-app`** is the canonical example. A `cli/template/base/` folder is the foundation, plus an `installers/` directory with one TypeScript file per add-on (`tailwind.ts`, `trpc.ts`, `prisma.ts`, `drizzle.ts`, `nextAuth.ts`, `betterAuth.ts`, `eslint.ts`, `biome.ts`).

Each installer implements the same interface:

```ts
interface Installer {
  name: AvailablePackages
  run: ({ projectDir, packageManager, packagesConfig, dbProvider, noInstall }) => void
}
```

On `init`:

1. User picks packages via `@clack/prompts` (multi-select)
2. CLI copies `cli/template/base/` to the target
3. CLI iterates the `installers` registry, calling `run()` for each selected package
4. Each installer adds dependencies to `package.json`, writes config files, updates `tsconfig.json`, etc.
5. CLI runs `installDependencies` at the end

**Tradeoffs**

- ✅ Composability: new add-ons are just one TS file in the registry
- ✅ Matrix testing trivial (the `--CI` flag turns the picker into a matrix of booleans)
- ✅ Versioning: the `dependencyVersionMap.ts` keeps all add-on versions in one place
- ❌ Installer code is tightly coupled to the base (template drift is easy)
- ❌ Hard for third parties to add their own installer (no public extension API)

### Archetype D — No template, copy into an existing project

**`shadcn`** is the canonical example. The `init` command doesn't create a project — it modifies the one you're in. It:

1. Detects the project (`getProjectInfo`: framework, Tailwind version, components path)
2. Runs a preflight check (`preflights/preflight-init.ts` — Node version, package manager, framework)
3. Backs up existing files (`components.json`, `tailwind.config.js`) and restores on exit
4. Fetches components from an HTTP registry (`https://ui.shadcn.com/r/styles/...`)
5. Patches `package.json`, `tsconfig.json`, `tailwind.config.js`, and writes `components.json`
6. Generates `AGENTS.md` (linked to `CLAUDE.md` via `fs.symlinkSync`)
7. Errors are caught centrally (`@/src/utils/handle-error`)

**Tradeoffs**

- ✅ Works on any existing project, not just one scaffolded by `shadcn`
- ✅ Component-level granularity (add a single component, not a whole project)
- ❌ No opinion on project structure (the user already has one)
- ❌ Heavy reliance on conventions (Tailwind, components.json, etc.)

## Primitives — who uses what in 2026

| Concern | `create-next-app` | `create-vite` | `create-t3-app` | `shadcn` | `nuxi` | `create-astro` |
|---|---|---|---|---|---|---|
| Arg parse | `commander` | `mri` | `commander` | `commander` | `citty` (commander-like) | hand-rolled |
| Prompts | `prompts` (legacy) | `@clack/prompts` | `@clack/prompts` | `prompts` (legacy) | `@clack/prompts` | `@astrojs/cli-kit` |
| Fetch | `fetch` + `tar` (manual) | none (in-package) | none (in-package) | HTTP registry | `giget` | `giget` (`@bluwy/giget-core`) |
| Install | `npm` (custom) | `cross-spawn` | `nypm` | n/a | `nypm` | external (user does it) |
| Git init | custom | custom | custom | n/a | custom | n/a |
| AI agent detect | ❌ | ✅ `@vercel/detect-agent` | ❌ | ❌ | ❌ | ❌ |
| Update check | ✅ `update-check` | ❌ | ❌ | ❌ | ❌ | ❌ |

**Takeaway**: `@clack/prompts` is the new standard for interactive prompts. `giget` is the de facto fetch primitive for any "templates are external repos" story. `nypm` is the de facto installer abstraction. The only outlier is `create-next-app`, which has not migrated to these (likely because of the tarball complexity in its own flow).

## Cross-cutting DX patterns

Every senior CLI implements these. The DeesseJS init CLI should match.

1. **Auto-fallback to non-interactive.** `interactive = argInteractive ?? process.stdin.isTTY`. Without a TTY, defaults are used. Every prompt must have a flag equivalent.
2. **Flag-mirror pattern.** Every interactive prompt has a CLI flag (e.g. `--tailwind`, `--trpc`, `--biome`). Critical for CI and for AI agents.
3. **Cancel handling everywhere.** After every prompt: `if (isCancel(x)) return cancel()`. No silent failures, no stack traces.
4. **3-way directory conflict.** Cancel / wipe / ignore. Nuxt's variant (override / different / abort) is more user-friendly.
5. **Outro block.** Vite-style `Done. Now run: cd X && pnpm install && pnpm dev`. Package-manager aware.
6. **`--no-install` + `--no-git`.** Always exposed. Never assume the user wants them.
7. **Package.json rewriting.** Set `name` from the arg, preserve the original indent (`(^\s+)/m.exec` capture pattern from Astro).
8. **Underscore-prefixed file rename.** `_gitignore` → `.gitignore` because npm publish strips dotfiles. (Only relevant for in-package templates.)
9. **Versioned experimental flags.** T3 uses `@experimental` JSDoc tags on CI flags. We can use the same pattern for `--deesse-*` flags that aren't stable yet.
10. **Self-update check.** `update-check` (Next.js) — warn the user if their CLI is older than the latest published.

## AI-agent friendliness

`create-vite` is the only reference that explicitly detects AI agents (`@vercel/detect-agent`). When the env is an agent, the CLI prints the non-interactive form upfront:

```
To create in one go, run: create-vite --no-interactive --template <name>
```

This is a 30-line addition that matters more than it looks. AI agents that run scaffolding commands will copy the suggested form verbatim. Without this hint, the agent has to guess the flags.

**Implication for DeesseJS**: ship this from day 1. The agent audience is the wedge for DeesseJS (per product positioning), and the CLI is the first thing the agent touches.

## The hybrid we're aiming for

`create-t3-app` is the closest reference for the base architecture (template + installers), but our templates are **external repos** (closer to Nuxt/Astro), not in-package files. So the hybrid is:

- **Template fetch**: `giget` (Nuxt/Astro style)
- **Post-process**: built-in tokens + small `transform.ts` per template (T3 style for the parts that vary)
- **Prompts**: `@clack/prompts` (Vite/T3/Nuxt standard)
- **Install**: `nypm` (Nuxt/T3 standard)
- **Arg parse**: `mri` (Vite style — lean, single command)
- **AI-agent detect**: `@vercel/detect-agent` (Vite style — agent-first wedge)

This is the closest match to the "DeesseJS as the agentic SaaS template" positioning. We get the determinism of in-package templates, the composability of an installer registry, and the freshness of tarball-fetched templates — all without re-implementing any of the hard parts.

See [`architecture.md`](./architecture.md) for the concrete proposal.
