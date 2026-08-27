# 7. Decisions

[← Index](README.md) · **Prev: [06-implementation-specs.md](06-implementation-specs.md)** · **Next: [08-execution-plan.md](08-execution-plan.md)**

## 7.1 Resolved decisions (architecture)

These are baked into the senior pattern and don't need a separate decision per item; they fall out of the architecture chosen in [05-strategy.md](05-strategy.md).

| Decision | Choice | Rationale |
|---|---|---|
| Release mechanism | Single `release.yml` workflow | One workflow, one mental model. Replaces dual-flow draft. |
| Source of truth | Changesets only | The only publicly versioned artifact (`@deessejs/cli`) drives its own version via changesets. |
| Root versioning | **Dropped** | Repo metadata can come from git commit hashes. Eliminates the dual-flow wart. |
| Tag prefix | `release/v*` | Reflects the role (a release happened) instead of the artifact. Replaces the inherited `template/v*`. |
| Workflow tool | Custom workflow (~50 lines) | Total control over the bump → publish → tag → release order. `changesets/action@v1` would also work but loses one step of granularity. |
| Provenance mechanism | Triple belt | `publishConfig.provenance: true` + `--provenance` flag + `NPM_CONFIG_PROVENANCE=true`. Belt + suspenders + belt; survives even if one mechanism fails. |
| Pre-release channels | None for V1 | changesets pre-releases add complexity. Revisit if needed. |
| Dependabot changeset policy | No changesets for catalog/devDep bumps | Per changesets maintainer @Andarist on issue #647. Same rule as before. |
| Hotfix policy | Same path as a normal release, just faster | Fast-track the staging → main promotion. Same workflow runs. |
| Yanking | Manual (`npm unpublish` < 72h, `npm deprecate` > 72h) | Requires judgment. No way to automate. |
| Changesets baseBranch | `staging` | Aligns with staging-first workflow in `AGENTS.md`. |
| `.changeset` filter | `contains(github.event.head_commit.message, '.changeset')` | Convention for "this commit consumed changesets." Only filter in the workflow. |

## 7.2 Pre-flight checks (need user confirmation)

These are choices that need explicit confirmation before the implementation PRs land.

### 7.2.1 License

`apps/cli/README.md` says `License TBD before npm publish`.

**Recommended**: `MIT`, to match upstream `deessejs/saas-template` (MIT).

**Alternative**: `Apache-2.0`.

### 7.2.2 Drop root `VERSION` file

The repo currently has a `VERSION` file at the root with value `0.0.1`. The senior pattern drops it entirely; it has no consumer that can't be served by git commit hash.

**Recommended**: delete `VERSION` as part of PR 1.

**Alternative**: keep `VERSION` as a manual stamp for human reference only (no workflow reads it).

### 7.2.3 Existing `template/v*` tags

The repo already has git tags like `template/v0.1.0` from the inherited fork pattern. The senior pattern stops creating them but doesn't delete the existing ones.

**Recommended**: leave existing `template/v*` tags in place as historical references; new releases get `release/v*` tags going forward.

**Alternative**: rewrite history to remove old `template/v*` tags (requires force-push; risky).

### 7.2.4 `module` and `types` entrypoints on `apps/cli`

tsup currently emits a single ESM bundle with no `.d.ts`.

**Recommended**: add `dts: true` to tsup config; add both `module` and `types` to `package.json`.

**Alternative**: skip `types` to keep the build simple. Consumers won't get autocomplete.

### 7.2.5 `privatePackages` in changesets config

**Recommended**: `{ "version": false, "tag": false }`. Suppresses cosmetic version bumps on private packages.

**Alternative**: omit the field (default behavior).

### 7.2.6 `packages/typescript-config` `publishConfig`

**Recommended**: remove the `publishConfig` block entirely. With `private: true`, it's dead code.

**Alternative**: flip to `private: false` and publish it (no reason to).