# Versioning process

This document describes how versioning works in this repo, day to day. It is the operational counterpart to the static configuration in `.changeset/config.json` and `.github/workflows/release.yml`.

For the full audit that motivated this process, see [docs/engineering/reports/versioning/](../reports/versioning/README.md).

## The rule

> *"My PR changes the CLI's public surface (new command, new flag, behavior change, breaking change)? Add a `.changeset/<random-slug>.md` with the bump type. CI verifies; the rest is automatic."*

**That's the entire rule.** Everything in this document describes what "the rest" means.

## Overview

**What:** A single `release.yml` workflow does version bump + npm publish + git tag + GitHub Release in one job. The contributor's only manual step is adding a changeset when relevant.

**Why:** The maintainer doesn't manage a separate repository release, doesn't manually bump versions, doesn't memorize commit-message string filters, doesn't run two coordinated workflows. The senior pattern collapses what was a dual-flow design into a single concern: changesets.

| Step | Trigger | Output | Mechanism |
|---|---|---|---|
| Contributor adds changeset | PR with `apps/cli/**` changes | `.changeset/<slug>.md` in the PR | `pnpm changeset` (interactive) or manual |
| CI verifies changeset | PR open against `staging` | Check passes or fails | `.github/workflows/changesets-check.yml` |
| Human promotes staging → main | After PR approval + merge | Push to `main` | Manual `git merge` or PR merge (per `AGENTS.md`) |
| Workflow runs | Push to `main` whose commit message contains `.changeset` (or `workflow_dispatch`) | New `@deessejs/cli` version on npm + `release/v{VERSION}` tag + GitHub Release | `.github/workflows/release.yml` |

The four steps are the entire pipeline. Hotfixes follow the same path with `patch` changesets. Yanks use `npm unpublish` / `npm deprecate` manually.

## The single release flow

**What:** `.github/workflows/release.yml` runs on push to `main` (gated by `.changeset` in commit message OR `workflow_dispatch`). It calls `pnpm changeset version` to consume changesets and bump `apps/cli/package.json#version`, then `pnpm changeset publish --provenance --access public` to push the new version to npm via trusted publisher + OIDC, then tags the release commit as `release/v{VERSION}` and creates a GitHub Release.

**Why:** One source of truth (changesets), one workflow, one mental model. The dual-flow design (separate `release.yml` and `publish-cli.yml` with cross-coupled commit-message filters and a manual root bump) was rejected as engineering tax for one published package.

**Process:**

1. A PR is merged to `staging` (per `AGENTS.md`).
2. A human promotes `staging` → `main`.
3. `.github/workflows/release.yml` triggers (gated on `.changeset` in commit message, or manual).
4. `pnpm install --frozen-lockfile`.
5. `pnpm changeset version` — bumps `apps/cli/package.json#version`, regenerates `apps/cli/CHANGELOG.md`, deletes consumed `.changeset/*.md` files, commits the version bump.
6. `pnpm changeset publish --provenance --access public` with `NPM_CONFIG_PROVENANCE=true` — publishes via OIDC + provenance.
7. `git tag -f release/v{VERSION}` (where `{VERSION}` is read from `apps/cli/package.json#version`).
8. `gh release create release/v{VERSION} --generate-notes`.
9. Done. The new `@deessejs/cli` version is live on npm, the tag is in git, the GitHub Release notes are published.

**Outputs:** new `@deessejs/cli` version on npmjs.org with provenance, `release/v{VERSION}` git tag, GitHub Release with auto-generated notes, updated `apps/cli/CHANGELOG.md`.

**Failure recovery:**

- **Trusted publisher not configured**: workflow fails with 403 from npm. Configure on `https://www.npmjs.com/package/@deessejs/cli/access` and re-run.
- **Provenance rejected**: in manual mode (no OIDC). Use the workflow, not a local publish.
- **`apps/cli/package.json#private: true` left in place**: changesets refuses to publish. Verify PR 3 landed.
- **Lockfile drift**: `pnpm install --frozen-lockfile` fails. Re-run `pnpm install` locally, commit the lockfile, re-trigger.

## Contributor — adding a changeset

**What:** A contributor opens a PR against `staging` with a `.changeset/<name>.md` file describing their change's bump type (`patch`, `minor`, or `major`). CI verifies presence if the PR touches `apps/cli/**`.

**Why:** Changesets decouple "what changed" from "what version to bump to." Multiple PRs each contribute their own changeset; the workflow merges them all into one version bump on push to `main`. This eliminates per-PR version-bump commits and lets consumers see what changed in each CLI release via `apps/cli/CHANGELOG.md`.

**Add a changeset when your PR touches `apps/cli/**` AND changes the CLI's published surface.**

Do not add a changeset for:

- Internal package changes (`packages/*`).
- Other apps (`apps/app`, `apps/web`, `apps/docs`).
- Test-only changes in `apps/cli/test/**`.
- Catalog dependency bumps that don't affect CLI behavior.
- Docs, comments, or formatting changes.
- **Adding, updating, or removing a template entry** in `packages/api/src/templates.ts`. Templates are content, not CLI features — the CLI is just a client of the templates API. See [the templates-not-cli section](../reports/versioning/11-templates-not-cli.md) for the full reasoning and the few edge cases (schema changes) where a template-related change IS a CLI change.

**Format, bump types, examples, lifecycle, common mistakes**: see [`.changeset/README.md`](../../.changeset/README.md).

## Maintainer — hotfix

**What:** Fast-track a critical `@deessejs/cli` bug or security fix from branch → staging → main. Same workflow runs; just skip the normal staging wait time. End-to-end target: under 2 hours for a critical security fix.

**Why:** Critical bugs (data loss, security CVEs, broken init) cannot wait for the normal staging window. Documenting the fast-track keeps the response time low without bypassing CODEOWNERS review.

**Process:**

1. Hotfix branch from `staging`.
2. Fix + changeset with `"@deessejs/cli": patch`.
3. Fast-track review (CODEOWNERS rules still apply).
4. Merge to `staging`.
5. Fast-track `staging` → `main` promotion.
6. `release.yml` runs the same flow as a normal release.

## Maintainer — yanking a version

**What:** Removes or deprecates a published `@deessejs/cli` version using `npm unpublish` (within 72 hours of publish) or `npm deprecate` (after 72 hours). Records the yank in the next release notes.

**Why:** A bad published version can break consumers — installs error out, code paths silently fail. Yanking limits damage and signals to upgrade. The 72-hour boundary exists because npm allows total unpublish only when the version has very few dependents, to protect the ecosystem.

**Within 72 hours of publish:**

```bash
npm unpublish @deessejs/cli@x.y.z
```

**After 72 hours** (unpublish no longer allowed):

```bash
npm deprecate @deessejs/cli@x.y.z "Critical bug: see https://github.com/deessejs/ecosystem-d/issues/N — upgrade to x.y.z+1"
```

Record the yank in the next release notes.

## Manual fallback

**What:** Publishes `@deessejs/cli` directly from a maintainer's machine using their local npm auth, bypassing `release.yml`. The publish uses `--provenance` but provenance attestation will fail (no OIDC available outside GitHub Actions). The tag and GitHub Release need to be applied manually.

**Why:** The automated workflow can fail (npm outage, OIDC misconfiguration, runner outage, a bug in `release.yml`). A documented manual path lets maintainers ship a critical fix even when automation is down. Provenance is sacrificed for that run, which is acceptable for a degraded mode — the next automated run resumes provenance.

**When:** `release.yml` is broken but a release is needed urgently.

**Process:**

1. Verify local build works:
   ```bash
   pnpm install
   pnpm --filter @deessejs/cli build
   ```
2. Publish from the command line (without OIDC):
   ```bash
   NPM_CONFIG_PROVENANCE=true pnpm --filter @deessejs/cli publish --provenance --access public --no-git-checks
   ```
   Provenance will fail outside GitHub Actions (expected). The publish itself succeeds with your local npm auth.
3. Manually tag and create the GitHub Release:
   ```bash
   VERSION=$(node -e "console.log(require('./apps/cli/package.json').version)")
   git tag -f "release/v$VERSION"
   git push --force origin "release/v$VERSION"
   gh release create "release/v$VERSION" --generate-notes
   ```
4. File an issue to fix `release.yml`.

## Related docs

- [Audit report (2026-07-31)](../reports/versioning/README.md) — full context, decisions, and sources.
- [`.changeset/README.md`](../../.changeset/README.md) — changeset quick reference for contributors.
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — contributor workflow (includes changeset requirement).
- `AGENTS.md` — staging-first git workflow.
- `apps/cli/CHANGELOG.md` — auto-generated by changesets, source of truth for `@deessejs/cli` consumer changelog.