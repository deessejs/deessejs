# 1. Current state (verified 2026-07-31)

[← Index](README.md) · **Next: [02-problems.md](02-problems.md)**

## 1.1 Workspace versions and publish posture

Verified by reading every `package.json` in the tree:

| Package | Version | `private` | `publishConfig` | Has CHANGELOG |
|---|---|---|---|---|
| Root `package.json` (`next-monorepo`) | 0.0.1 | true | — | yes (will become historical artifact) |
| `apps/app` | 0.1.2 | true | — | yes |
| `apps/web` | 0.0.1 | true | — | no |
| `apps/docs` (`@workspace/docs`) | 0.0.0 | true | — | no |
| `apps/cli` (`@deessejs/cli`) | 1.0.0 | **false** | `{"access":"public","provenance":true}` | no (will be auto-generated) |
| `packages/api` | 0.0.2 | true | — | yes (changesets format) |
| `packages/auth` | 0.0.2 | true | — | yes |
| `packages/cookies` | 0.0.1 | true | — | yes |
| `packages/database` | 0.0.1 | true | — | yes |
| `packages/email` | 0.0.0 | true | — | no |
| `packages/env` | 0.0.0 | true | — | no |
| `packages/eslint-config` | 0.0.0 | true | — | no |
| `packages/typescript-config` | 0.0.0 | **true** | `{"access":"public"}` (dead) | no |
| `packages/ui` | 0.0.0 | true | — | no |
| `packages/utils` | 0.0.0 | true | — | no |
| `@deessejs/errors` (external) | 1.1.1 | n/a | n/a | n/a |
| `@deessejs/fp` (external) | 1.0.0 | n/a | n/a | n/a |

**Notes for the senior pattern:**

- **`@deessejs/cli` is the only package meant for npm**. All other workspaces are and will remain `private: true`. Root versioning is being dropped (no more `VERSION` file, no more `template/v*` tags, no more root `CHANGELOG.md` auto-patching).
- `apps/cli` and `packages/typescript-config` have `publishConfig: { access: "public" }` while still being `private: true`. Dead code. The `typescript-config` one is leftover boilerplate — to be removed.
- `apps/cli`'s README says "UNLICENSED for V1 (private). License TBD before npm publish." — license is a precondition.

## 1.2 Changesets state

- `.changeset/config.json`: `changelog: "@changesets/changelog-git"`, `commit: true`, `access: "restricted"`, `baseBranch: "main"`, `updateInternalDependencies: "minor"`, `ignore: []`. To be updated per [06-implementation-specs.md §6.1](06-implementation-specs.md#61-changesets-config-proposed).
- `.changeset/` directory contains **only** `config.json` — no `<feature>.md` files.
- `packages/api/CHANGELOG.md` (and 4 others) shows the changesets-generated format. Changesets has been run historically; it's dormant, not absent.

## 1.3 Existing release pipeline (verified) — TO BE REPLACED

`.github/workflows/release.yml` (177 lines) handles the current dual-purpose flow:

- Triggers on `push: branches: [main]` and `workflow_dispatch`, gated on commit message containing `.changeset`.
- Reads root `VERSION`.
- Runs `pnpm changeset version` (bumps root + any workspace with a changeset; root is `private: true` so changesets ignores it).
- Creates a git tag `template/v{VERSION}` (e.g. `template/v0.1.0`). (Historical reference — the senior pattern no longer creates these tags; the upstream fork pattern is being deprecated.)
- Creates a GitHub Release via `softprops/action-gh-release@v2`.
- Manually patches root `CHANGELOG.md` via `node -e`.
- Does **not** publish anything to npm.

The senior pattern [**replaces** this file entirely](06-implementation-specs.md#63-release-workflow-proposed) with a single-purpose workflow (~50 lines) that does version bump + npm publish + tag + GitHub Release in one job. No root versioning, no `template/v*` tags.

## 1.4 CI scope

`.github/workflows/ci.yml` triggers on `pull_request: branches: [main]` and `push: branches: [main]`. **It does not trigger on PRs targeting `staging`.** This contradicts `AGENTS.md`'s staging-first workflow. The new `changesets-check.yml` workflow (PR 2) must use `pull_request: branches: [staging, main]`.

## 1.5 `apps/cli` build and entrypoints

- `tsup.config.ts`: emits `format: ["esm"]`, single entry `src/index.ts`, target `node18`, banner `#!/usr/bin/env node`, sourcemap, **no `dts`**. Output: `dist/index.js` + `dist/index.js.map`. No `.d.ts` files in `dist/`.
- `apps/cli/package.json` declares `"type": "module"`, `main: "./dist/index.js"`, `bin: { "deessejs": "./dist/index.js" }`, `files: ["dist", "README.md"]`. Missing: `module`, `types`, `repository`, `license`, `keywords`.
- Tests live in `apps/cli/test/{helpers,integration,unit}/`. Per commit `261d074`, init tests are currently skipped in CI ("fork spawn can't find git") — out of scope here.