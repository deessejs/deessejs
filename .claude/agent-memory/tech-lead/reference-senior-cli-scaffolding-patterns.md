---
name: reference-senior-cli-scaffolding-patterns
description: 2026 senior CLI patterns for scaffolding tools; 4 archetypes + primitive table + 10 DX patterns; from create-next-app, create-vite, create-t3-app, shadcn, nuxi, create-astro, giget
metadata:
  type: reference
---

Researched 2026-07-02 via `fresh` CLI against `main`/`canary` branches. Source: `documents/internal/architecture/12-apps/cli/research.md`.

## The 4 archetypes

| Archetype | Repr | Source of truth | Trade-off |
|---|---|---|---|
| **A — Template in package** | `create-vite` (9.1.0) | Folders in the npm package | Fast, deterministic; bumps the CLI to update a template |
| **B — Template from tarball** | `create-next-app` (16.3.0-canary.57) | Subfolder in the monorepo, fetched via `codeload.github.com` | Always fresh; network heavy; brittle on repo rename |
| **C — Base + installer registry** | `create-t3-app` | `cli/template/base/` + `cli/src/installers/*.ts` (one per add-on) | Composable; tight coupling; no public extension API |
| **D — No template, copy into existing** | `shadcn` CLI | HTTP registry of components, patched into user's project | Works on existing projects; heavy reliance on conventions |

## Primitives — the 2026 standard table

| Concern | Winner | Loser | Notes |
|---|---|---|---|
| Arg parse | `mri` (lean) or `commander` (sub-cmds) | `yargs` (heavy) | mri if 1 command, commander if more |
| Prompts | `@clack/prompts` | `prompts`, `inquirer` | cancel handling, spinner, group built in |
| Tarball fetch | `giget` (unjs) | manual `fetch`+`tar` | multi-provider, offline cache, auth, zero-dep |
| Install | `nypm` (unjs) | hand-rolled PM matrix | detects PM, calls the right command |
| AI agent detect | `@vercel/detect-agent` | roll-our-own | Vite 6+ pioneered this; ~5 LOC, high leverage |

## The 10 DX patterns every senior CLI has

1. **Auto-fallback non-interactive** — `interactive = argInteractive ?? process.stdin.isTTY`
2. **Flag-mirror** — every prompt has a CLI flag (CI + AI agent friendly)
3. **Cancel everywhere** — `if (isCancel(x)) return cancel()` after every prompt
4. **3-way dir conflict** — Nuxt: override / different / abort. Vite: cancel / wipe / ignore.
5. **Vite-style outro** — `Done. Now run: cd X && pnpm dev`. PM-aware.
6. **`--no-install` + `--no-git`** — always exposed
7. **package.json rewrite preserves indent** — `(^\s+)/m.exec` capture pattern from Astro
8. **Underscore-prefixed file rename** — `_gitignore` → `.gitignore` (only for in-package templates)
9. **Versioned experimental flags** — T3 uses `@experimental` JSDoc tags
10. **Self-update check** — `update-check` (Next.js)

## Closest precedents for "templates are external repos"

- **Nuxt** (`nuxt/cli` `main`): `giget` + remote catalog + 3-way dir conflict + interactive picker with spinner
- **Astro** (`withastro/astro` `main`): `giget` with branch routing + `getTemplateTarget(tmpl, ref)` for 3 cases (internal / third-party / starlight) + AGENTS.md generation + CLAUDE.md symlink
- **Volt** (Vite ecosystem): `giget` for starter templates

## Hybrid we're aiming for (DeesseJS init CLI)

- Template fetch: `giget` (Nuxt/Astro style)
- Post-process: built-in tokens + small `transform.ts` per template (T3 style for the parts that vary)
- Prompts: `@clack/prompts` (Vite/T3/Nuxt standard)
- Install: `nypm` (Nuxt/T3 standard)
- Arg parse: `mri` (Vite style — lean, single command)
- AI-agent detect: `@vercel/detect-agent` (Vite style — agent-first wedge)

## Where to look for details

- `documents/internal/architecture/12-apps/cli/research.md` — full pattern study
- `documents/internal/architecture/12-apps/cli/architecture.md` — how the stack is composed
- `documents/internal/architecture/12-apps/cli/decisions/0003-cli-stack.md` — the per-primitive decision
