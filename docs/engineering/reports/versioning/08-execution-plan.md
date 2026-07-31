# 8. Execution plan

[← Index](README.md) · **Prev: [07-decisions.md](07-decisions.md)** · **Next: [09-risks-and-sources.md](09-risks-and-sources.md)**

PRs target `staging` per the staging-first workflow documented in `AGENTS.md`. Each PR is gated on the previous one being merged.

The senior pattern has 3 PRs (was 4 in the dual-flow draft, since the two-workflow PR and the root-bump PR are merged into one).

## PR 1 — Cleanup (mechanical)

- Add `license`, `repository`, `keywords`, `module`, `types`, and an updated `publishConfig` to `apps/cli/package.json`.
- Add `dts: true` to `apps/cli/tsup.config.ts`. Verify `dist/` contains `index.d.ts`.
- Add a `LICENSE` file (MIT text) at the repo root, update `apps/cli/files` to include it.
- Remove `publishConfig` from `packages/typescript-config/package.json`.
- Delete `VERSION` at the repo root (no consumer after the senior pattern lands).
- Run `pnpm install --frozen-lockfile` to sync lockfile.

## PR 2 — `release.yml` + CI

- Replace `.github/workflows/release.yml` with the senior-pattern version (~50 lines, single job).
  - In the same commit, also update `AGENTS.md` or `CONTRIBUTING.md` if any staging-first notes need adjusting (none expected).
- Update `.changeset/config.json` per [06-implementation-specs.md §6.1](06-implementation-specs.md#61-changesets-config-proposed) (`baseBranch: "staging"`, `updateInternalDependencies: "patch"`, `privatePackages: { version: false, tag: false }`).
- Add a new workflow (`.github/workflows/changesets-check.yml`) that triggers on `pull_request: branches: [staging, main]` and fails the PR if `.changeset/*.md` is missing AND the PR touches `apps/cli/**`.
- Update `.github/workflows/ci.yml` to trigger on `pull_request: branches: [staging, main]` so staging PRs actually run CI.

## PR 3 — `apps/cli` flip

- Flip `apps/cli/package.json#private` to `false`.
- Create the project-side process docs:
  - `docs/engineering/processes/versioning.md` — canonical process doc (maintainer playbook).
  - `.changeset/README.md` — quick reference for contributors.
  - Update `CONTRIBUTING.md` with the changeset requirement.

## One-time setup (not in a PR)

- Configure trusted publisher on `https://www.npmjs.com/package/@deessejs/cli/access`:
  - Organization/user: `deessejs`
  - Repository: `ecosystem-d`
  - Workflow filename: `release.yml`
  - Allowed action: `npm publish`
- Confirm npm CLI v11.5.1+ is on the GitHub-hosted runner (Node 24 setup-node handles this).

## First release

- Write `.changeset/cli-v0.2.0.md` describing the bump: "Initial public release of `@deessejs/cli`. Establish the single-workflow release pattern."
- Open PR against `staging`. CI verifies the changeset.
- Merge to `staging`.
- Human promotes `staging` → `main`.
- `release.yml` runs on the squash-merge commit:
  - `pnpm changeset version` bumps `apps/cli/package.json#version` from `0.1.0` to `0.2.0`, regenerates `apps/cli/CHANGELOG.md`, deletes the changeset file.
  - `pnpm changeset publish --provenance --access public` publishes `@deessejs/cli@0.2.0` to npm via trusted publisher.
  - Tag `release/v0.2.0` created.
  - GitHub Release created.
- Verify on npmjs.com: package public, provenance set, `dist/` correct.