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

The npm side has a chicken-and-egg: the package must exist on npm before a trusted publisher can be configured for it. The first publish is therefore manual from a maintainer's machine; the second publish onward uses the trusted publisher.

Full step-by-step walkthrough at [12-npm-setup-walkthrough.md](12-npm-setup-walkthrough.md). Quick summary:

1. **First publish (manual)**: a maintainer runs `pnpm --filter @deessejs/cli publish --access public --no-git-checks` from their machine. Uses their npm auth. Creates the package on npmjs.com. No provenance (no OIDC yet).
2. **Configure trusted publisher**: manually on `https://www.npmjs.com/package/@deessejs/cli/access` (not `/settings/...`). Fields: org `deessejs`, repo `deessejs` (this repo's name), workflow filename `release.yml`, allowed action `npm publish`.
3. **Verify**: next PR through the workflow → staging → main → release.yml → publish with OIDC + provenance. Check the provenance badge on npmjs.com.

**Common gotcha**: a misconfigured trusted publisher gives a misleading 404 from npm, not a meaningful error. Full diagnosis in [12-npm-setup-walkthrough.md §12.6](12-npm-setup-walkthrough.md#126-common-gotchas).

## First release (sequence, including the manual first publish)

- Write `.changeset/cli-v0.2.0.md` describing the bump: "Initial public release of `@deessejs/cli`. Establish the single-workflow release pattern."
- Open PR against `staging`. CI verifies the changeset.
- Merge to `staging`.
- Human promotes `staging` → `main`.
- **Manual first publish** (per [12-npm-setup-walkthrough.md §12.3](12-npm-setup-walkthrough.md#123-step-1--first-publish-manual-from-a-maintainers-machine)): a maintainer runs the publish command from their machine. The package exists on npm.
- **Configure trusted publisher** (per [12.4](12-npm-setup-walkthrough.md#124-step-2--configure-the-trusted-publisher-on-npm)): maintainer visits the npm package settings page and adds the trusted publisher.
- **Second release (the first using the workflow)**: a new PR with a changeset → merge → staging → main → `release.yml` runs:
  - `pnpm changeset version` bumps `apps/cli/package.json#version` from `0.2.0` to `0.2.1`, regenerates `apps/cli/CHANGELOG.md`, deletes the changeset file.
  - `pnpm changeset publish --provenance --access public` publishes `@deessejs/cli@0.2.1` to npm via trusted publisher (OIDC) + provenance.
  - Tag `release/v0.2.1` created (force-update for idempotency).
  - GitHub Release created.
- Verify on npmjs.com: package public, provenance badge set, `dist/` correct.

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