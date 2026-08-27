# Monorepo versioning strategy audit

_Date: 2026-07-31. Replaces the monolithic `versioning-strategy-audit-2026-07-30.md`. Drafts a senior release pattern (single workflow, single source of truth, root versioning dropped). Status: ready for sign-off on the architecture._

This document is the index for the audit. Read it first, then jump into the section you need.

## Index

| # | File | Topic |
|---|---|---|
| 1 | [01-current-state.md](01-current-state.md) | Verified state of workspace packages, changesets, existing `release.yml`, CI, and `apps/cli` build |
| 2 | [02-problems.md](02-problems.md) | Problems identified in the current setup |
| 3 | [03-external-context.md](03-external-context.md) | Fresh CLI research on changesets, npm trusted publishers, pnpm publish, provenance |
| 4 | [04-prereleases.md](04-prereleases.md) | Decision on pre-release channels (not needed for V1) |
| 5 | [05-strategy.md](05-strategy.md) | **Senior pattern**: single source of truth + single workflow |
| 6 | [06-implementation-specs.md](06-implementation-specs.md) | Concrete changesets config, `apps/cli/package.json`, single `release.yml` YAML |
| 7 | [07-decisions.md](07-decisions.md) | Decisions taken + decisions needing user sign-off |
| 8 | [08-execution-plan.md](08-execution-plan.md) | PR-by-PR execution order + one-time setup steps |
| 9 | [09-risks-and-sources.md](09-risks-and-sources.md) | Risks, rollback procedures, internal + external sources |
| 11 | [11-templates-not-cli.md](11-templates-not-cli.md) | Architectural principle: templates are content, not CLI features: when a template change IS a CLI change (edge cases) |
| 12 | [12-npm-setup-walkthrough.md](12-npm-setup-walkthrough.md) | Step-by-step npm setup (chicken-and-egg first publish, trusted publisher config, gotchas) |

## Executive summary

The monorepo has 14 workspace projects across `apps/*` (4) and `packages/*` (10), plus 2 external `@deessejs/*` packages. Versioning is inconsistent in the source tree, but **changesets is already partially adopted**: five packages have auto-generated `CHANGELOG.md` files in changesets format. `@deessejs/cli` will be the first package to go through a changesets-driven public release.

The senior pattern adopted here: **one source of truth** (changesets), **one workflow** (`release.yml` does version bump + npm publish + tag in one job), **no root versioning** (root `VERSION`, root `package.json#version`, `template/v*` tags all dropped). The maintainer's mental load collapses to one rule: *"if your PR changes the CLI surface, add a changeset."* The earlier dual-flow design (separate `release.yml` for root + `publish-cli.yml` for npm with commit-message string filters coupling them) was rejected as too much engineering tax for one published package.

Key gaps to fix before implementation:

- `apps/cli/package.json` missing `license`, `repository`, `keywords`, `module`, `types`
- tsup emits ESM only: needs `dts: true` for `.d.ts`
- Existing `release.yml` needs to be replaced (not extended) by the senior version
- `ci.yml` triggers on `main` but not `staging`: must be fixed for staging-PR CI
- A trusted publisher must be configured on `https://www.npmjs.com/package/@deessejs/cli/access` (one-time npm-side setup)

## The senior pattern, in 3 sentences

Contributors adding changesets in their PRs is the **only** manual step. The single `release.yml` workflow runs `pnpm changeset version` then `pnpm changeset publish` then tags `release/v{VERSION}` and creates a GitHub Release, with no human in the loop. Hotfixes, yanks, and rollbacks are handled with the same primitives, not separate code paths.

**One nuance**: the **first ever publish** of `@deessejs/cli` is manual from a maintainer's machine (npm has no "pending publisher" feature; the package must exist before a trusted publisher can be configured for it). After the first publish, the trusted publisher is configured, and from the second publish onward everything is automatic. Full walkthrough: [12-npm-setup-walkthrough.md](12-npm-setup-walkthrough.md).

## Status

**Ready for sign-off on the architecture.** The PR plan in [08-execution-plan.md](08-execution-plan.md) lands the senior pattern in 3 PRs once approved.