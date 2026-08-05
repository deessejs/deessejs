---
name: npm-publishing-gotchas
description: Consolidated gotchas when publishing a package on npm with changesets + pnpm trusted publisher. Discovered during @deessejs/cli@1.0.0 → 1.1.0 setup, validated by failure modes.
metadata:
  type: project
---

All of these bit us during the `@deessejs/cli` setup (2026-07-31). They are not obvious from the docs and would re-bite a future maintainer setting up another package.

## 1. `pnpm changeset publish` does NOT accept `--provenance` or `--access` flags

```
🦋 error Unknown flags for publish: --provenance, --access
```

`changesets publish` rejects these flags even though `npm publish` accepts them. The fix is **not** to pass them through changesets. Instead:

- `publishConfig.provenance: true` in `apps/cli/package.json` (npm reads this when publishing)
- `NPM_CONFIG_PROVENANCE=true` env var in the workflow (belt + suspenders)

The workflow command becomes just `pnpm changeset publish`. No flags.

## 2. Changesets needs git config to commit on the runner

```
🦋 error Changesets ran into trouble committing your files
```

Because `.changeset/config.json` has `commit: true`, changesets tries to commit the version bump. GitHub Actions runners have no `user.name`/`user.email` by default. Fix: add a step before `pnpm changeset version`:

```yaml
- name: Configure git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
```

## 3. `catalog:` deps don't survive `npm publish`

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "catalog:": catalog:
```

`catalog:` is a pnpm-only protocol that's resolved at install time. The published `package.json` keeps the literal string `"catalog:"`. When consumers (`npm install`, `npx`) try to install, npm rejects it.

**Rule**: monorepo-internal packages can use `catalog:`. A workspace package that's going to be published to npm must use real semver ranges for its `dependencies`. `devDependencies` can stay in `catalog:` (they don't ship).

Recovery: `npm unpublish @scope/pkg@<broken-version>` (within 72h), fix deps, re-publish.

## 4. First publish must be manual (npm has no "pending publisher")

```
npm error 403 Forbidden - PUT https://registry.npmjs.org/@deessejs%2fcli - You cannot publish over the previously published versions: 0.1.0.
```

npm has no "pending publisher" feature (unlike PyPI). Workflows can't be configured for a package that doesn't exist yet. The first publish must be manual from a maintainer's machine, AFTER which the trusted publisher is configured.

```bash
cd apps/cli
npm publish --access public --no-git-checks --provenance=false
```

## 5. First publish from local can't generate provenance

```
npm error code EUSAGE
npm error Automatic provenance generation not supported for provider: null
```

Provenance requires a supported CI provider (GitHub Actions, GitLab CI). On a local machine, `provider: null`. Use `--provenance=false` for the manual first publish. The trade-off: first publish has no provenance, subsequent workflow-driven publishes do.

## 6. The `latest` dist-tag auto-advances

When you publish a higher version, `latest` automatically moves to it. No need to manually update dist-tags. So `@deessejs/cli@1.1.0` being published automatically made it the default install for `npx deessejs@latest`.

## 7. Trusted publisher 404 is misleading

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@deessejs/cli
npm error 404 '@deessejs/cli@1.1.0' is not in this registry.
```

The package exists. The OIDC token exchange probably succeeded. The 404 means the trusted publisher **rejected** the workflow's OIDC claims. Common causes:

- Wrong workflow filename (npm has `publish.yml`, repo has `release.yml`)
- Environment name mismatch (npm has `production`, workflow says `release`)
- npm version < 11.5.1 (Node 22 ships with npm 10.x — use Node 24)
- Org/repo mismatch

Per Jurij Tokarski's [April 2026 writeup](https://varstatt.com/jurij/p/npm-trusted-publishing-from-github-actions), this is the most common first-time confusion.

## 8. `pnpm publish` has its own "no new packages" trap

```
There are no new packages that should be published
```

`pnpm publish` in workspace mode has a check that compares the local version against the registry. If the package doesn't exist on the registry (first publish), this check can fire spuriously. Workaround: use `npm publish` directly from the package directory (`cd apps/cli && npm publish ...`). Bypasses pnpm's workspace logic.

## 9. Existing versions take precedence

If the package namespace is already populated (e.g., `@deessejs/cli` has 46 versions from previous unrelated work), the next publish can't reuse those version numbers. The user's first publish of the new code was `1.0.0` (skipping past all existing 0.x versions). When that publish had a bug, the fix was `1.0.1` (not 1.0.0 — which was now taken by the broken publish).

To recover: `npm unpublish @scope/pkg@<broken-version>` (within 72h), then re-publish the same version with the fix. After 72h, the version is permanent and you have to bump.

## Recovery scripts

```bash
# All-in-one manual first publish (or fallback when workflow is broken)
cd apps/cli
npm publish --access public --no-git-checks --provenance=false

# Unpublish a broken version (within 72h)
npm unpublish @deessejs/cli@x.y.z

# Deprecate after 72h
npm deprecate @deessejs/cli@x.y.z "reason; upgrade to x.y.z+1"
```

## Related

- [[senior-release-pattern]] — the architecture
- [[release-pipeline]] — the workflow mechanics
- [[release-pipeline-changesets-action]] — v1 vs v2 pinning
- [[apps-cli-publish-readiness]] — preconditions for publish
- Audit doc: `docs/engineering/reports/versioning/12-npm-setup-walkthrough.md`