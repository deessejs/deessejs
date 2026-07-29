---
name: changesets
description: Changesets versioning and release workflow for this monorepo
metadata:
  type: learning
  updated: 2026-07-15
---

# Changesets: Versioning and Release Workflow

## Current State of This Repo

**Changesets is not yet integrated into this monorepo.** All packages are currently `private: true` (see `packages/*/package.json`) and are versioned `0.0.0`. There is no `.changeset/` directory and no release automation. The `turbo.json`-based build pipeline handles compilation and testing, but package publishing is not automated.

This makes sense for an internal template — the packages are not published to npm. However, if any package in `apps/` or `packages/` is later extracted for independent consumption, changesets should be added.

## What Is Changesets

[Changesets](https://github.com/changesets/changesets) is a versioning and changelog management tool purpose-built for monorepos. It takes a developer-intent approach rather than commit-message inference:

- Each PR author explicitly declares **which packages change**, **what semver bump** (major/minor/patch), and **a human-readable changelog summary**.
- These declarations live as small Markdown files in `.changeset/` — committed alongside the code, reviewed in the PR.
- When ready to release, `changeset version` consumes all pending changesets, bumps the right package versions, updates `CHANGELOG.md` files, and handles the internal dependency graph (dependent packages get patched automatically).
- `changeset publish` (or a GitHub Actions workflow) publishes to npm.

**~3M weekly npm downloads.** Used in production by pnpm, Astro, React Email, Chakra UI, Clerk, Apollo Client, Remix, SvelteKit, wagmi, and many others.

## Current Changesets Version

- **Stable (v2):** `@changesets/cli@2.30.0` — published March 2026.
- **Pre-release (v3):** `@changesets/cli@3.0.0-next.x` — actively developed on `main` branch. The v3 rewrite has breaking changes and is not yet stable.
- **For new integrations today:** stick with `^2.30.0` (the pnpm.io docs still reference v2.28.0 as the latest stable).

This repo does not currently have changesets installed.

## How Changesets Works

### Core Concepts

| Concept | Description |
|---|---|
| **Changeset file** | A Markdown file in `.changeset/` with YAML front matter declaring package(s), bump type, and a changelog summary. Created by the developer during PR review — not auto-generated. |
| **Intent, not inference** | Unlike `semantic-release`, changesets does NOT parse commit messages. The bump type is always explicit and intentional. |
| **Version PR** | A GitHub Action auto-opens a "Version Packages" PR that accumulates all pending changesets. It updates as new changesets land on `main`. This is the release gate. |
| **`changeset version`** | Consumes all changeset files, computes new semver for each package (accounting for the dependency graph), updates `package.json` versions and `CHANGELOG.md`, then deletes the changeset files. |
| **`changeset publish`** | Publishes all packages with bumped versions to npm. Can also create git tags. |
| **Internal dependency cascade** | When package A is bumped, all internal packages depending on A get a patch bump to update their `workspace:*` dependency range — governed by `updateInternalDependencies: "patch"` in config. |

### Changeset File Format

```md
---
"@workspace/auth": minor
"@workspace/database": patch
---

Fix session refresh edge case where tokens were not renewed on tab focus.
The `useSession` hook now calls `authClient.getSession()` on `visibilitychange`
instead of relying solely on the cached session.
```

```md
---
"@workspace/env": major
---

`BETTER_AUTH_SECRET` is now optional in the schema. Previously it was required
even when using the `trustedOrigins` configuration. This is a breaking change
for any caller that relied on the previous validation behavior.
```

### Release Workflow (GitHub Actions)

```yaml
# .github/workflows/changesets.yml
name: Changesets
on:
  push:
    branches: [main]

jobs:
  version:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for changelog generation

      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm turbo build

      - name: Create Version PR or Publish
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
          commit: "chore: release packages"
          title: "chore: release packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Key permissions the workflow needs: `contents: write` (push commits/tags), `pull-requests: write` (create the Version PR), `id-token: write` (npm provenance).

### Setup Commands

```sh
# 1. Install (root of monorepo)
pnpm add -Dw @changesets/cli @changesets/changelog-github

# 2. Initialize (creates .changeset/config.json)
pnpm changeset init

# 3. Add a changeset (after making code changes, before merging PR)
pnpm changeset

# 4. Version all pending changesets (used by the GitHub Action)
pnpm changeset version

# 5. Publish (used by the GitHub Action after version PR is merged)
pnpm changeset publish
```

## Changesets vs Semantic Versioning

They are complementary but not interchangeable:

| | Changesets | Semantic-Release |
|---|---|---|
| **Automation** | Semi-automated (developer declares intent) | Fully automated (parses commit messages) |
| **Commit convention** | Not required | Enforced (`feat:`, `fix:`, etc.) |
| **Changelog quality** | Human-written prose per-release | Auto-generated from commits |
| **Monorepo support** | First-class, independent versioning per package | Requires plugin (`semantic-release-monorepo`) |
| **PR review integration** | Explicit — the changeset is part of the PR | Implicit — version bump is inferred |
| **Use case** | Developer tooling, open source, team-based | DevOps/CI, fully automated pipelines |

The critical distinction: **semantic-release infers version from commits. Changesets requires explicit declaration.** Changesets is the right choice when you want PR authors to communicate user-facing impact, not just implementation detail.

## Best Practices for Commit Messages and PR Titles

Changesets decouples versioning from commits, but good commit hygiene still matters for git history, search, and code review.

### Conventional Commits (still useful)

This repo already uses Conventional Commits (`feat:`, `fix:`, `chore:`) per `CONTRIBUTING.md`. These remain valuable even with changesets:

- They keep git history readable.
- They help reviewers understand the nature of a change at a glance.
- CI lint tools (e.g., `commitlint`) can enforce them independently.

**But do not rely on them for versioning.** A `fix:` prefix does not auto-bump — the changeset declares the actual semver impact.

### Changeset Summary Guidelines

A good changeset entry answers three questions:

1. **WHAT** changed (the specific API surface or behavior).
2. **WHY** it changed (the bug, motivation, or deprecation).
3. **HOW** a consumer should update their code (migration step, if any).

```md
---
"@workspace/auth": major
---

Replace `useAuth()` hook with `useActiveOrganization()` workaround.
The original hook had a race condition (#9710) where the session was
read before the organization plugin had initialized. To migrate:
- Remove `useAuth()` calls that read `data.user`
- Use `useActiveOrganization()` instead, which polls until ready
- See docs/guides/better-auth/client.md for the full pattern
```

### PR Title Conventions

Keep PR titles descriptive — they appear in the "Version Packages" PR body and git history:

```
feat(auth): add organization-scoped session refresh
fix(database): prevent race condition in migration runner
chore(env): make BETTER_AUTH_SECRET optional in schema
docs(api): document rate limiting headers
```

## When to Use Changesets vs Manual Version Bumps

### Use Changesets When

- A package is published to a registry (npm, GitHub Packages, etc.).
- Multiple packages have interdependencies that need coordinated version bumps.
- You want changelogs generated per-release from developer-authored prose.
- You need the "Version PR" as a release gate for team review.
- You want automated git tags and npm provenance.

### Manual Bumps Are Fine When

- All packages are `private: true` and consumed only as `workspace:*` ranges within the monorepo.
- No external consumers depend on specific versions.
- The monorepo is not a published library — it is an application deployment artifact.
- You are iterating rapidly and version history provides no value (internal tools).

**Current state of this repo:** All packages are `private: true`. Manual version management is currently unnecessary. Changesets should be introduced only if/when a package is made public.

## Changesets and the Issue → PR Workflow

This repo uses a structured workflow: `create-issue` → `triage` → `spec` → `implement` → `create-pr` → `review-pr`. Changesets fits naturally into the `create-pr` and `review-pr` stages:

```
create-issue  → triage  →  spec  →  implement  →  create-pr  →  review-pr
                                                        ↓
                                              pnpm changeset add
                                              (declares bump + changelog)
                                                        ↓
                                              Changesets bot comments:
                                              "This PR will release
                                               @workspace/auth@1.2.0"
```

### Practical Integration Steps

1. **During `implement`:** Make the code change.
2. **Before `create-pr`:** Run `pnpm changeset` — select the affected packages, choose the bump type, write the summary. Commit the `.changeset/UNIQUE_ID.md` file to the branch.
3. **During `review-pr`:** Reviewer sees the changeset alongside the code diff. The bot comment shows exactly what will be released.
4. **After `review-pr` (merge to main):** The `changesets/action` on `main` opens a "Version Packages" PR. CI accumulates all changesets landed on `main` since the last release.
5. **Merge Version PR:** Triggers `pnpm changeset version && pnpm changeset publish`.

### Gotcha: Changesets Are One-Time

A changeset file is **consumed** (deleted) when `changeset version` runs. It cannot be re-applied. If you accidentally merge a PR with the wrong bump type, you must:

1. Manually correct the `package.json` version.
2. Correct the `CHANGELOG.md`.
3. Delete the consumed changeset file (already gone).
4. Alternatively, use `changeset pre enter` / `changeset pre exit` for pre-release corrections.

## Relation to the Existing Build Pipeline

`turbo.json` and changesets are complementary — they operate at different layers:

```
turbo.json          → build, test, lint, typecheck (per-package, per-task)
changesets          → version calculation, changelog generation, npm publish
```

The CI already uses `fetch-depth: 0` for changelog-aware git history. Adding changesets means adding a `changesets.yml` workflow that runs on `main` pushes, parallel to or after the existing CI pipeline.

`turbo build` runs before `changeset version` in the release workflow — this is necessary so that the `dist/` outputs exist for publishing.

## Gotchas for pnpm 11 + turbo v2

### pnpm 11 Specifics

- `pnpm/action-setup@v6` in GitHub Actions (as used in `ci.yml`).
- pnpm 11's **catalog mode** (`catalog:` in `pnpm-workspace.yaml`) is fully compatible with changesets — changesets reads `package.json` normally.
- pnpm 11's strict mode (`catalogMode: strict`) means all dependencies must come from the catalog or workspace. Changesets `publish` respects this.
- When running `pnpm changeset version`, always follow with `pnpm install` to update the lockfile after version bumps — required before `pnpm publish -r`.

### turbo v2 Specifics

- `turbo build` in CI should run **before** `changeset version` so that `dist/` folders are fresh for publishing.
- The `version: pnpm changeset version` and `publish: pnpm changeset publish` steps in the changesets action run after the build job, not instead of it.
- `changesets/action@v1` is compatible with turbo v2. No special integration is needed.
- If using `turbo@2` with remote caching (`TURBO_TOKEN`/`TURBO_TEAM`), note that `changeset version` modifies files — ensure the Version PR pipeline does not incorrectly serve cached artifacts for the `build` task. The `--force` flag should be used in CI to bypass remote cache for build steps preceding publish.

### Common Mistakes

1. **Forgetting to commit the changeset file.** The file in `.changeset/` must be committed to the branch. Without it, `changeset version` has nothing to process.
2. **Running `changeset version` without a subsequent `pnpm install`.** After version bumps, the lockfile is stale. `pnpm install` is required before publishing.
3. **Using the wrong bump type.** A patch is for bug fixes. A minor is for new backward-compatible functionality. A major is for breaking changes. When in doubt, ask: "Does this change require a consumer to modify their code?" If yes, it is at least a minor.
4. **Not setting `access: "public"` in `.changeset/config.json`.** The default is `restricted`, which fails for public scoped packages (`@workspace/*`). Most monorepos want `"access": "public"`.
5. **Private packages in the changeset config.** Set `"privatePackages": { "version": false, "tag": false }` to prevent changesets from attempting to publish `private: true` packages.
6. **pnpm `catalogMode: strict` + manual version bumps.** If you manually edit `package.json` versions outside of changesets, pnpm will resist because versions must match the catalog. Always use `changeset version` for managed version bumps.

## Minimal Changesets Config for This Repo

If changesets were added to this monorepo, the config at `.changeset/config.json` would look like:

```json
{
  "$schema": "https://changesets.org/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "bumpVersionsWithWorkspaceProtocolOnly": true,
  "privatePackages": {
    "version": false,
    "tag": false
  }
}
```

Key settings:
- `access: "restricted"` — since all packages are currently `private: true`, this prevents accidental public publishing.
- `privatePackages.version: false` — changesets skips versioning for `private: true` packages (which all current packages are).
- `bumpVersionsWithWorkspaceProtocolOnly: true` — ensures workspace protocol dependencies are handled correctly with pnpm 11.

## Further Reading

- [Changesets GitHub](https://github.com/changesets/changesets) — source, docs, releases
- [pnpm.io: Using Changesets](https://pnpm.io/using-changesets) — pnpm-specific setup guide
- [changesets/action](https://github.com/changesets/action) — GitHub Actions integration
- [Intro to using changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [Detailed explanation](https://github.com/changesets/changesets/blob/main/docs/detailed-explanation.md)
- [Adding a changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- [Config file options](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
- [Prereleases](https://github.com/changesets/changesets/blob/main/docs/prereleases.md) — alpha/beta/canary workflow
- [Snapshot releases](https://github.com/changesets/changesets/blob/main/docs/snapshot-releases.md) — CI-driven canary previews
