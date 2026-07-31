---
name: senior-release-pattern
description: Repo release architecture (chosen 2026-07-31) — single workflow, single changeset source of truth, root versioning dropped. One thing to remember: contributors add a changeset if their PR changes the CLI surface.
metadata:
  type: project
---

The release architecture for this repo, after the 2026-07-31 audit review.

**Architecture (single workflow, single source of truth):**

- `.changeset/<feature>.md` per PR is the **only thing** the contributor has to remember, and only when their PR changes the CLI's public surface.
- One workflow file: `.github/workflows/release.yml` (replaces the existing one).
- Workflow runs on `push to main`, gates on commit message containing `.changeset`, or `workflow_dispatch`.
- Workflow calls `pnpm changeset version` (consume changesets → bump `apps/cli/package.json#version`, regenerate `apps/cli/CHANGELOG.md`), then `pnpm changeset publish --provenance --access public` (publish via npm trusted publisher + OIDC), then tags `release/v{VERSION}` + creates a GitHub Release.
- **`apps/cli` is the only versioned artifact.** Root `VERSION`, root `package.json#version`, and `template/v*` tags are dropped.
- Vercel deploy metadata (if needed) uses git commit hash, not version.

**Why this architecture:** senior pattern means the maintainer doesn't manually bump versions, doesn't manage a separate repository release, doesn't memorize commit-message string filters. The dual-flow design (separate `release.yml` + `publish-cli.yml` with cross-coupled `.changeset` vs `template/v` filters and a manual root bump wart) was rejected as not senior enough — too much cognitive load for one published package.

**How to apply:**

- When adding a PR that touches `apps/cli/**`, the workflow is: write the change, add `.changeset/<random-slug>.md`, open the PR. CI enforces the changeset for `apps/cli/**` PRs.
- When merging, staging-first applies per AGENTS.md (PRs target `staging`, human promotes to `main`).
- After the staging → main promotion, the workflow runs automatically. No manual steps.
- For hotfixes: same path. Add a changeset with `"patch"`. Skip the staging wait time by promoting fast.
- For yanking a bad version: `npm unpublish @deessejs/cli@x.y.z` (within 72h) or `npm deprecate` (after 72h). This stays manual because it requires judgment.
- The `release.yml` workflow file is a single ~30-line YAML — `pnpm changeset version` then `pnpm changeset publish` then `git tag + gh release create`.

**Specific files in the audit that need to reflect this:**

- `docs/engineering/reports/versioning/05-strategy.md` — single flow (was: dual Flow A + Flow B)
- `docs/engineering/reports/versioning/06-implementation-specs.md` — single workflow YAML (was: `release.yml` + `publish-cli.yml`)
- `docs/engineering/reports/versioning/07-decisions.md` — drops decisions about root versioning, tag prefix (now `release/v*`), workflow architecture
- `docs/engineering/reports/versioning/08-execution-plan.md` — 3 PRs (was: 4 PRs)
- `docs/engineering/processes/versioning.md` — single flow with What/Why

**Things still true (unchanged):**

- Templates are content, not CLI features (see [[templates-content-not-cli]]) — applies regardless of how releases work.
- `@changesets/cli@^2.31.0` requires `changesets/action@v1` if used; we chose custom workflow instead.
- pnpm 11 native `pnpm publish` with `--provenance` is what Flow B calls.
- npm trusted publishers (OIDC) is the publish mechanism.

**What was deleted (compared to the dual-flow draft):**

- `release.yml`'s role of bumping root via `pnpm changeset version` (root is gone).
- `publish-cli.yml` (subsumed into the single `release.yml`).
- The `template/v*` tag convention (replaced by `release/v*`).
- The "Flow A vs Flow B" decision table.
- The manual root bump for the first release (no root to bump).

**Related:** [[release-pipeline]] (now describes the senior pattern — previously described dual flow), [[templates-content-not-cli]], [[release-pipeline-changesets-action]], [[feedback-senior-release-pattern]] (the principle behind this choice).