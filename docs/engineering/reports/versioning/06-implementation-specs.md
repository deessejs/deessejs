# 6. Implementation specs

[← Index](README.md) · **Prev: [05-strategy.md](05-strategy.md)** · **Next: [07-decisions.md](07-decisions.md)**

Concrete changes to apply once the architecture in [05-strategy.md](05-strategy.md) is approved.

## 6.1 Changesets config (proposed)

`.changeset/config.json`:

```json
{
  "changelog": "@changesets/changelog-git",
  "commit": true,
  "access": "restricted",
  "baseBranch": "staging",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": { "version": false, "tag": false }
}
```

**Notes:**

- `baseBranch: "staging"` aligns with the staging-first workflow in `AGENTS.md`.
- `updateInternalDependencies: "patch"` matches the changesets default and the documented recommendation. Has minimal real-world effect in this repo since `@deessejs/cli` has no workspace deps; included for hygiene.
- `privatePackages: { version: false, tag: false }` keeps changesets from bumping private workspace `package.json#version` (the packages in `packages/*`, `apps/*` excluding `apps/cli`). The bump is cosmetic since private packages never publish — no changeset for them is needed.

## 6.2 `apps/cli` package.json (proposed)

```jsonc
{
  "name": "@deessejs/cli",
  "version": "0.1.0",           // bumped to 0.2.0 by the first changesets release
  "description": "CLI for the DeesseJS template registry.",
  "type": "module",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/deessejs/ecosystem-d.git"
  },
  "keywords": ["cli", "deessejs", "saas-template", "scaffolding"],
  "private": false,             // FLIP — currently true
  "bin": { "deessejs": "./dist/index.js" },
  "main": "./dist/index.js",
  "module": "./dist/index.js",  // explicit for ESM bundlers
  "types": "./dist/index.d.ts", // requires tsup dts: true
  "files": ["dist", "README.md", "LICENSE"],
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
  // ... rest unchanged
}
```

Corresponding `apps/cli/tsup.config.ts` change: add `dts: true` so `dist/index.d.ts` is emitted. Verify CI still passes on the existing test suite.

## 6.3 Release workflow (proposed)

`.github/workflows/release.yml` — REPLACES the existing file. The existing one (177 lines) handles root VERSION bumps, `template/v*` tags, and root CHANGELOG patches. The new one is single-job, single-purpose.

```yaml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write
  pull-requests: write
  id-token: write   # OIDC for npm trusted publisher

jobs:
  release:
    runs-on: ubuntu-latest      # GitHub-hosted only — trusted publishers don't support self-hosted
    if: |
      github.event_name == 'workflow_dispatch' ||
      contains(github.event.head_commit.message, '.changeset')
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
        # Use GITHUB_TOKEN for the tag/release commits; the trusted publisher
        # uses OIDC for npm publish.
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      # 1. Consume changesets → bump apps/cli version, regenerate CHANGELOG
      - name: Bump versions
        run: pnpm changeset version
      - run: pnpm install --frozen-lockfile

      # 2. Publish via trusted publisher (OIDC) with explicit provenance belt
      - name: Publish to npm
        env:
          NPM_CONFIG_PROVENANCE: true
        run: pnpm changeset publish --provenance --access public

      # 3. Tag and GitHub Release for the new CLI version
      - name: Read new version
        id: version
        run: |
          VERSION=$(node -e "console.log(require('./apps/cli/package.json').version)")
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
      - name: Tag release
        run: |
          git tag -f "release/v${{ steps.version.outputs.version }}"
          git push --force origin "release/v${{ steps.version.outputs.version }}"
      - name: GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: release/v${{ steps.version.outputs.version }}
          name: "Release v${{ steps.version.outputs.version }}"
          generate_notes: true
          fail_on_unmatched_files: true
```

## 6.4 Manual fallback

If the workflow is broken but a release is needed urgently:

```bash
pnpm --filter @deessejs/cli build
NPM_CONFIG_PROVENANCE=true pnpm --filter @deessejs/cli publish --provenance --access public --no-git-checks
```

Provenance will fail outside GitHub Actions, expected. The publish itself succeeds with the maintainer's local npm auth. Then manually tag and create the GitHub Release for traceability:

```bash
git tag -f "release/v$(node -e "console.log(require('./apps/cli/package.json').version)")"
git push --force origin "release/v..."
gh release create "release/v..." --generate-notes
```

File an issue to fix the workflow so the next release doesn't need manual intervention.

## 6.5 What gets deleted

| File / artifact | Action |
|---|---|
| Root `VERSION` | Delete file |
| Root `package.json#version` | Leave at `0.0.1` (or set to `0.0.0`); remove any tooling that requires a stamp |
| Root `CHANGELOG.md` | Keep existing content but stop auto-patching it (it becomes a historical artifact, no longer auto-maintained) |
| `.github/workflows/release.yml` | REPLACE with the new ~50-line single-purpose workflow |
| `template/v*` tags | Stop creating them. Existing tags stay as historical references but no new ones. |
| The "Flow A vs Flow B" mental model | Eliminate from docs |

The deletion of root versioning removes the three-sources-of-version drift that exists today.