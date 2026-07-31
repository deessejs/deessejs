---
name: release-pipeline
description: Single-workflow release architecture (senior pattern). One release.yml does version bump + publish + tag. No dual flow, no root versioning.
metadata:
  type: project
---

This repo's release architecture is a **single workflow** that handles everything. There is no Flow A / Flow B split.

**One file**: `.github/workflows/release.yml` (a rewrite of the existing `release.yml`).

**What it does, in order:**

1. Triggered by push to `main` whose commit message contains `.changeset`, or by `workflow_dispatch`.
2. Runs `pnpm install --frozen-lockfile`.
3. Runs `pnpm changeset version` — consumes all `.changeset/*.md` files, bumps `apps/cli/package.json#version`, regenerates `apps/cli/CHANGELOG.md`, deletes the consumed changesets, commits the version bump.
4. Runs `pnpm changeset publish --provenance --access public` with `NPM_CONFIG_PROVENANCE=true` — publishes the bumped `@deessejs/cli` to npm via trusted publisher (OIDC).
5. Tags the release commit as `release/v{VERSION}` (using `apps/cli/package.json#version` as the source), force-update for idempotency.
6. Creates a GitHub Release via `gh release create` with generated notes.

**What this architecture deliberately does not do:**

- **No root versioning.** Root `VERSION`, root `package.json#version`, root `CHANGELOG.md` are dropped. Repo metadata for Vercel or divergence tracking comes from git commit hashes, not from a version number.
- **No dual workflow.** No `publish-cli.yml` separate from `release.yml`. Bump + publish in one job.
- **No commit-message-string filter cascading.** The `.changeset` filter is the only one — and it's there because changesets files are added in PRs that don't have an obvious "ready to release" signal.
- **No manual intermediate steps.** A maintainer merges a PR; the staging → main promotion runs (per AGENTS.md staging-first); the workflow fires; the new version of `@deessejs/cli` is on npm. Done.

**Why:** See [[feedback-senior-release-pattern]] — the goal is "no release engineering worry". The previous draft had separate `release.yml` + `publish-cli.yml` workflows with cross-coupled commit-message filters (`.changeset` for Flow A, `template/v` for Flow B), a manual root bump for the first release, and two mental models. That's engineering tax for one published package.

**How to apply:**

- When adding new release-related behavior, add it to the existing `release.yml` — don't create a second workflow.
- When fixing a release bug, fix it in the single workflow — don't add a fallback workflow.
- The `package.json` of `apps/cli` must have `"private": false` and a `"publishConfig": { "access": "public", "provenance": true }` for this to work. See [[apps-cli-publish-readiness]] for the full preconditions list.
- npm trusted publisher must be configured on `https://www.npmjs.com/package/@deessejs/cli/access` for the publish to succeed without a long-lived `NPM_TOKEN`.

**Edge cases:**

- **Hotfix**: PR with a changeset using `"@deessejs/cli": patch`. Fast-track staging → main. Workflow runs, publishes the patch. Same path as a normal release, just faster.
- **Yank a bad version**: `npm unpublish @deessejs/cli@x.y.z` within 72 hours; `npm deprecate` after 72 hours. Stays manual — requires judgment.
- **Workflow broken**: manual fallback at `docs/engineering/processes/versioning.md` — `pnpm --filter @deessejs/cli build && pnpm --filter @deessejs/cli publish --provenance --access public --no-git-checks`. Provenance will fail outside GitHub Actions, expected.

**Related:** [[senior-release-pattern]] (the architectural decision summary), [[release-pipeline-changesets-action]] (v1 vs v2 action pinning if anyone wants to add `changesets/action`), [[apps-cli-publish-readiness]] (preconditions for publish to work).