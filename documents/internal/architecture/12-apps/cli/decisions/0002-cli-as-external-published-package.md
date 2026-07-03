# 0002. CLI as an external published package (not a monorepo workspace)

- **Status:** Proposed
- **Date:** 2026-07-02
- **Deciders:** founder, tech lead

## Context and problem statement

The init CLI (`deesse init --template <url>`) needs to be published on npm so users can run it via `npx`. The question is **where it lives**:

- As a workspace package inside the main `deessejs/deessejs` monorepo (e.g. `apps/cli/` or `packages/cli/`), published as part of the monorepo's normal release flow.
- As a standalone repo (`deessejs/deesse`), published independently on npm with its own release cadence.

The monorepo already has 16 sub-packages. The CLI is functionally a separate concern: it doesn't consume any of the monorepo's `packages/*` code, it doesn't share a version with the template, and it serves an audience that never sees the monorepo (a user who runs `npx deesse init` is downloading the CLI, not the template).

The trade-off: monorepo = simpler operations (one CI, one release), standalone = independent cadence and zero coupling.

## Considered options

1. **Workspace package in `deessejs/deessejs`** — e.g. `apps/cli/` (alongside `apps/template/`, `apps/web/`, etc.). The CLI consumes nothing from the monorepo. Published as part of the monorepo's `pnpm -r publish` flow.
2. **Standalone repo `deessejs/deesse`** — Its own pnpm workspace, its own CI, its own npm package. Linked from the main repo only via documentation.
3. **Workspace package in `apps/template/`** — e.g. `apps/template/apps/cli-init/` (sibling to the buyer-facing `apps/cli/`). Lives inside the template product.

## Decision

**Option 2 — standalone repo `deessejs/deesse`.**

The CLI is published on npm as `@deessejs/cli` (or `create-deessejs` — see open question 1). The repo contains:

- `packages/cli/` — the CLI source
- `templates/` — the local catalog (`templates/starter.json`, `templates/minimal.json`, `templates/lite.json`)
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.json` — the workspace
- `.github/workflows/` — its own CI
- `README.md`, `CHANGELOG.md` — its own docs

No cross-repo imports. No `workspace:*` references. The CLI does not know about the main `deessejs/deessejs` repo beyond what users put in their templates.

## Why standalone (not workspace)

- **Independent release cadence.** The CLI can ship a patch (e.g. "fix `giget` error message for 404s") without bumping the template product. The template product has its own M0–M8 milestone sequence; the CLI has its own M0–M10 sequence (per [`../roadmap.md`](../roadmap.md)). Coupling them is a release tax with zero upside.
- **Zero coupling to the template's deps.** The template ships with 13 packages (`auth`, `ai`, `api`, `database`, etc.). The CLI consumes none of them. Putting it in the same workspace adds noise to its dep graph and forces CI to run the full matrix on every CLI change.
- **Smaller, faster CI.** The CLI's CI runs `pnpm typecheck && pnpm test` against a 4-package workspace. The main monorepo's CI runs the full matrix (16+ packages, 3 deploy targets, lint+typecheck+test+build). Decoupling is a 10× speedup on the CLI's own CI.
- **Cleaner npm provenance.** The CLI's npm page is `@deessejs/cli` with its own README, its own downloads badge, its own issue tracker. Users don't get confused by 16 other packages they don't need.
- **Mirrors the precedent.** Vercel ships `create-next-app` from a separate `vercel/next.js` monorepo path but with a dedicated release flow. Nuxt ships `nuxi` from a separate `nuxt/cli` repo. Astro ships `create-astro` from a path inside the monorepo but with a dedicated package. The pattern across the ecosystem is "CLI is a separate concern, ship it separately."

## Why not `apps/template/` (Option 3)

- The buyer-facing CLI in `apps/template/apps/cli/` is for the **buyer's end users**, talking to the **buyer's deployed service** via `@deessejs/sdk` (per [system ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md)). The init CLI is for **new DeesseJS adopters**, talking to **GitHub** via `giget`.
- They share no code, no audience, no dep graph. Putting them in the same `apps/cli/` folder would be confusing.

## Why not Option 1 (workspace package)

- The CLI's release cadence would be tied to the template's. A critical CLI bug fix would force a template release.
- The CLI's CI would run the full monorepo matrix on every change. 5×–10× slower.
- The CLI's dep graph would be polluted by the template's `packages/*` dependencies. Unused, but in the lockfile and the install path.

## Consequences

**Positive:**

- Independent release cadence (CLI patches ship without template bumps).
- Fast CI (small workspace, no monorepo matrix).
- Clean npm surface (one package, one README, one issue tracker).
- No dep coupling to the template.
- Mirrors the ecosystem precedent (Nuxt, Astro, Vercel).

**Negative:**

- Two repos to maintain instead of one. Each has its own CI, its own lockfile, its own release process.
- Cross-repo coordination is manual (a doc change in the template that affects the CLI requires a CLI release).
- Two sets of GitHub Actions secrets (npm token, etc.) to manage.

**Neutral:**

- The CLI's docs (this folder) live in the main `deessejs/deessejs` repo. The CLI source lives in `deessejs/deesse`. The split is: design decisions in the main repo, implementation in the CLI repo. This matches the precedent of `vercel/next.js` (framework + design) vs `vercel/create-next-app` (implementation).

**Why we might revisit:**

- If the CLI ever needs to consume a package from `apps/template/packages/*` (e.g. a shared types library), we may move it into the monorepo as `packages/cli-init/` and re-publish.
- If cross-repo coordination overhead becomes painful (e.g. 3+ PRs per feature spanning both repos), we may merge them.
- If the team grows and we need stricter code sharing between the template and the CLI, we may colocate them.

## References

- [`../README.md`](../README.md) — the proposed repo structure
- [`../roadmap.md`](../roadmap.md) — the CLI's own milestone sequence
- [System ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md) — the **buyer-facing** CLI (different CLI, Bun + single-binary, lives in `apps/template/apps/cli/`)
- [System ADR 0012](../../10-decisions/0012-template-as-pattern.md) — why each `apps/*` is its own DeesseJS instance
- [Nuxt CLI repo](https://github.com/nuxt/cli) — the reference for "CLI as a separate repo"
- [unjs/giget](https://github.com/unjs/giget) — one of the CLI's dependencies
