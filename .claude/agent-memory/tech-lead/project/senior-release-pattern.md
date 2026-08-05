---
name: senior-release-pattern
description: Repo release architecture (chosen 2026-07-31, validated working 2026-07-31) — single workflow, single changeset source of truth, root versioning dropped. Verified end-to-end with @deessejs/cli@1.1.0 publish via trusted publisher.
metadata:
  type: project
---

The release architecture for this repo, chosen after the 2026-07-31 audit review and **validated working** with the manual `1.0.1` publish + workflow-driven `1.1.0` publish on the same day.

**Architecture (single workflow, single source of truth):**

- `.changeset/<feature>.md` per PR is the **only thing** the contributor has to remember, and only when their PR changes the CLI's public surface.
- One workflow file: `.github/workflows/release.yml`.
- Workflow runs on `push to main` (gates on commit message containing `.changeset`) OR `workflow_dispatch`.
- Workflow steps:
  1. `pnpm install --frozen-lockfile`
  2. **Configure git** (NEW — was added after a bug; `user.name` / `user.email` required for changesets commit)
  3. `pnpm changeset version` (consume changesets → bump `apps/cli/package.json#version`, regenerate `apps/cli/CHANGELOG.md`, commit)
  4. `pnpm install --frozen-lockfile`
  5. `pnpm changeset publish` (NO flags — see [[npm-publishing-gotchas]] for why)
  6. Tag `release/v{VERSION}` + create GitHub Release
- **`apps/cli` is the only versioned artifact.** Root `VERSION`, root `package.json#version`, and `template/v*` tags are dropped.
- npm publish via trusted publisher (OIDC) — first publish was manual, then trusted publisher configured on `https://www.npmjs.com/package/@deessejs/cli/access`.

**Why this architecture:** senior pattern means the maintainer doesn't manually bump versions, doesn't manage a separate repository release, doesn't memorize commit-message string filters. The dual-flow design was rejected as not senior enough.

**How to apply:**

- When adding a PR that touches `apps/cli/**`, the workflow is: write the change, add `.changeset/<random-slug>.md`, open the PR. CI enforces the changeset for `apps/cli/**` PRs.
- When merging, staging-first applies per AGENTS.md (PRs target `staging`, human promotes to `main`).
- After the staging → main promotion, the workflow runs automatically. No manual steps.
- For hotfixes: same path. Add a changeset with `"patch"`. Skip the staging wait time by promoting fast.
- For yanking a bad version: `npm unpublish @deessejs/cli@x.y.z` (within 72h) or `npm deprecate` (after 72h). This stays manual because it requires judgment.

**Validated working sequence (2026-07-31):**

1. PR #2 → PR #3 → PR #4 → PR #5 → PR #6 → PR #8 → PR #10 → PR #11 (all merged)
2. Manual publish of `@deessejs/cli@1.0.1` from a maintainer's machine (`npm publish --access public --no-git-checks --provenance=false`)
3. Trusted publisher configured on npmjs.com
4. `release.yml` triggered via `workflow_dispatch` → consumed `init-senior-pattern.md` (bump minor) → bumped `1.0.1 → 1.1.0` → published `@deessejs/cli@1.1.0` via trusted publisher + provenance → tagged `release/v1.1.0` → created GitHub Release.

**Gotchas discovered (see [[npm-publishing-gotchas]] for full list):**

- `pnpm changeset publish` does NOT accept `--provenance` or `--access` flags. Use `publishConfig.provenance: true` in `apps/cli/package.json` + `NPM_CONFIG_PROVENANCE=true` env var.
- `changeset commit: true` requires git user.name/user.email configured on the runner (added a `Configure git` step).
- `catalog:` deps in published packages cause `EUNSUPPORTEDPROTOCOL` at install time. Use real semver for published deps.
- First publish must be manual (npm has no pending publisher). Use `--provenance=false` for local.
- 404 from npm on publish = trusted publisher misconfigured, not "package doesn't exist".

**Related:** [[release-pipeline]], [[npm-publishing-gotchas]], [[templates-content-not-cli]], [[release-pipeline-changesets-action]] (pinned to v1), [[feedback-senior-release-pattern]] (the principle behind this choice), [[apps-cli-publish-readiness]] (preconditions).