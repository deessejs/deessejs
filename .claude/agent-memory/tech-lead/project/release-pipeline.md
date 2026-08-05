---
name: release-pipeline
description: Single-workflow release architecture (senior pattern). One release.yml does version bump + publish + tag. Validated working with @deessejs/cli@1.1.0.
metadata:
  type: project
---

This repo's release architecture is a **single workflow** that handles everything. There is no Flow A / Flow B split.

**One file**: `.github/workflows/release.yml`.

**What it does, in order:**

1. Triggered by `push to main` whose commit message contains `.changeset`, OR by `workflow_dispatch`.
2. `pnpm install --frozen-lockfile`
3. **Configure git** (user.name + user.email) — required for changesets commit
4. `pnpm changeset version` — consumes all `.changeset/*.md` files, bumps `apps/cli/package.json#version`, regenerates `apps/cli/CHANGELOG.md`, deletes the consumed changesets, commits the version bump.
5. `pnpm install --frozen-lockfile`
6. `pnpm changeset publish` (NO flags — see [[npm-publishing-gotchas]] for why)
7. Tag `release/v{VERSION}` + create GitHub Release

**What this architecture deliberately does not do:**

- **No root versioning.** Root `VERSION`, root `package.json#version`, root `CHANGELOG.md` are dropped. Repo metadata for Vercel or divergence tracking comes from git commit hashes, not from a version number.
- **No dual workflow.** No `publish-cli.yml` separate from `release.yml`. Bump + publish in one job.
- **No commit-message-string filter cascading.** The `.changeset` filter is the only one — and it's there because changesets files are added in PRs that don't have an obvious "ready to release" signal.
- **No manual intermediate steps.** A maintainer merges a PR; the staging → main promotion runs (per AGENTS.md staging-first); the workflow fires; the new version of `@deessejs/cli` is on npm. Done.

**Why:** See [[feedback-senior-release-pattern]] — the goal is "no release engineering worry". The previous draft had separate `release.yml` + `publish-cli.yml` workflows with cross-coupled commit-message filters (`.changeset` for Flow A, `template/v` for Flow B), a manual root bump for the first release, and two mental models. That's engineering tax for one published package.

**How to apply:**

- When adding new release-related behavior, add it to the existing `release.yml` — don't create a second workflow.
- When fixing a release bug, fix it in the single workflow — don't add a fallback workflow.
- The `package.json` of `apps/cli` must have `"private": false`, `"publishConfig": { "access": "public", "provenance": true }`, and real semver (not `catalog:`) for published dependencies. See [[apps-cli-publish-readiness]] for the full preconditions list.
- npm trusted publisher must be configured on `https://www.npmjs.com/package/@deessejs/cli/access` for the publish to succeed without a long-lived `NPM_TOKEN`.

**Edge cases:**

- **Hotfix**: PR with a changeset using `"@deessejs/cli": patch`. Fast-track staging → main. Workflow runs, publishes the patch. Same path as a normal release, just faster.
- **Yank a bad version**: `npm unpublish @deessejs/cli@x.y.z` within 72 hours; `npm deprecate` after 72 hours. Stays manual — requires judgment.
- **Workflow broken**: at `docs/engineering/processes/versioning.md` §"Manual fallback". Use `npm publish` directly from `apps/cli/` (not `pnpm publish` — see [[npm-publishing-gotchas]] for why): `npm publish --access public --no-git-checks --provenance=false`. Provenance will fail outside GitHub Actions, expected.

**Related:** [[senior-release-pattern]] (the architectural decision summary), [[npm-publishing-gotchas]] (the consolidated gotchas), [[release-pipeline-changesets-action]] (v1 vs v2 action pinning if anyone wants to add `changesets/action`), [[apps-cli-publish-readiness]] (preconditions for publish to work).