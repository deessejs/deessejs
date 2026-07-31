# 2. Problems

[← Index](README.md) · **Prev: [01-current-state.md](01-current-state.md)** · **Next: [03-external-context.md](03-external-context.md)**

These are the problems the senior pattern in [05-strategy.md](05-strategy.md) is designed to fix. Problems that the senior pattern fully eliminates are marked with ✓ (resolved-by-architecture).

## 2.1 P1 — `.changeset/config.json` is misconfigured for the staging-first workflow ✓

`baseBranch: "main"` means changesets compares every branch against `main`, which is permanently ahead of any feature branch in this repo. Effect: `pnpm changeset status` sees every PR as a candidate from-scratch release. `updateInternalDependencies: "minor"` propagates internal noise.

Fixed by [06-implementation-specs.md §6.1](06-implementation-specs.md#61-changesets-config-proposed) (`baseBranch: "staging"`, `updateInternalDependencies: "patch"`).

## 2.2 P1 — `apps/cli/package.json` is not publish-ready ✓

Pre-publish blockers (verified):

- `"private": true` blocks npm publish (regardless of `publishConfig`).
- No `repository` field — required by npm trusted publishers.
- `license` field missing — README says `UNLICENSED for V1`.
- No `types` field — tsup does not emit `.d.ts` today.
- No `module` field — optional but conventional.

Fixed by [06-implementation-specs.md §6.2](06-implementation-specs.md#62-appscli-packagejson-proposed).

## 2.3 P1 — CI does not run on staging PRs ✓

`ci.yml`'s branch filter excludes `staging`. The new `changesets-check.yml` (PR 2) uses `pull_request: branches: [staging, main]`. The existing `ci.yml` is also updated to include `staging`.

## 2.4 ✓ — No dual-flow separation needed (architecture-level)

The dual-flow design (separate `release.yml` for root + `publish-cli.yml` for npm with cross-coupled commit-message filters) was rejected for the senior pattern. The single-workflow design handles everything: version bump, npm publish, tag, GitHub Release, in one job. There is no longer a "Repository release vs CLI release are conflated" problem because there's only one release.

## 2.5 P2 — No first-class trusted publisher config yet

Per npm trusted publishers docs ([docs.npmjs.com/trusted-publishers](https://docs.npmjs.com/trusted-publishers/), GA since 2025-07-31): publishing via OIDC requires (a) per-package config on `https://www.npmjs.com/package/@deessejs/cli/access`, (b) `id-token: write` permission in the workflow, (c) `npm` CLI v11.5.1+ on the runner, (d) GitHub-hosted runners only.

One-time setup; covered in [08-execution-plan.md](08-execution-plan.md) §"One-time setup".

## 2.6 P2 — Changesets workflow is dormant but not abandoned

The tool is installed, the config is written, and 5 CHANGELOGs already follow changesets format. The cost of reviving it is much lower than the cost of switching. Adopted by the senior pattern.

## 2.7 P3 — Provenance documentation vs reality

npm's docs say provenance is automatic with trusted publishing. Real-world reports ([philna.sh/blog/2026/01/28/trusted-publishing-npm](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/), 2026-01-31) indicate `--provenance` is still needed in practice. Triple belt in the workflow: `publishConfig.provenance: true` + `--provenance` flag + `NPM_CONFIG_PROVENANCE=true` env var.

## 2.8 P3 — No Dependabot + changesets integration

Dependabot and Renovate PRs bumping dependencies in this repo do **not** need changesets (changesets maintainer @Andarist, [issue #647](https://github.com/changesets/changesets/issues/647)): devDep-only updates don't affect consumers. Catalog version bumps inside `pnpm-workspace.yaml` don't change `@deessejs/cli`'s public surface either. Only bumps that change `dependencies` in `apps/cli/package.json` should require a changeset. With the senior pattern, this rule applies cleanly because `apps/cli` is the only package that consumes the changesets pipeline.

## 2.9 ✓ — Three sources of root version drift (architecture-level)

The old problem: root `VERSION` (0.0.1), root `package.json#version` (0.0.1), root `CHANGELOG.md` ([0.1.0]) — out of sync before any release touched them.

Resolved by the senior pattern: root versioning is **dropped entirely**. No more `VERSION` file, no more root `CHANGELOG.md` auto-patching, no more `template/v*` tags. The drift problem cannot exist when there's no version to drift.