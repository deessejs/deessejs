# 12. npm setup walkthrough

[← Index](README.md) · **Prev: [11-templates-not-cli.md](11-templates-not-cli.md)**

Step-by-step procedure for the npm side of the senior pattern. The user explicitly asked for this; the audit's high-level "one-time setup" line was too hand-wavy.

## 12.1 Summary, the chicken-and-egg <!-- vale fix: Microsoft.HeadingAcronyms, Microsoft.HeadingColons -->

**The first publish of `@deessejs/cli` can't use trusted publishing.** npm has no "pending publisher" feature (unlike PyPI). Before the package exists on npm, no trusted publisher runs for it. Steps: <!-- vale fix: Microsoft.Contractions, write-good.Passive, write-good.TooWordy -->

- **First publish**: manual, from a maintainer's machine, with the maintainer's own npm auth. No OIDC, no provenance from CI.
- **After the first publish succeeds**: configure the trusted publisher on `https://www.npmjs.com/package/@deessejs/cli/access`.
- **Second publish onward**: automatic via `.github/workflows/release.yml` with OIDC + provenance.

Recorded as [npm/documentation#1926](https://github.com/npm/documentation/issues/1926): the docs don't currently explain this gap. PyPI has a "pending publisher" feature that npm doesn't. <!-- vale fix: write-good.Passive -->

## 12.2 Prerequisites

Before any of this:

- An npmjs.com account with publish rights on the `deessejs` org (the maintainer who publishes `@deessejs/cli` for the first time)
- 2FA enabled on that npm account (required to publish under the `deessejs` org)
- The `deessejs` npm org exists (one-time setup, presumably already done)
- PR 1 + PR 2 + PR 3 from [08-execution-plan.md](08-execution-plan.md) all merged to `staging` and promoted to `main` (that is, `apps/cli/package.json#private` is `false`, the LICENSE + repository + module + types fields have content, `tsup.config.ts` has `dts: true`, `.github/workflows/release.yml` is the senior-pattern version, `.changeset/config.json` carries the latest values). <!-- vale fix: Microsoft.Foreign, write-good.Passive -->

## 12.3 Step 1: First publish (manual, from a maintainer's machine)

This creates the package on npmjs.com. After it succeeds, the package exists and the maintainer can configure the trusted publisher. <!-- vale fix: write-good.Passive -->

**On a maintainer's machine, with the working tree on `main` (or the same state, after PR 1-3 merge):** <!-- vale fix: write-good.TooWordy, write-good.Passive -->

```bash
# 1. Verify the build works locally
pnpm install
pnpm --filter @deessejs/cli build
# Should produce dist/index.js + dist/index.d.ts

# 2. Verify the package.json looks correct
cat apps/cli/package.json | head -20
# Confirm: private:false, license, repository, keywords, module, types,
# files, publishConfig.access:public, publishConfig.provenance:true

# 3. Confirm npm registry + auth
npm whoami
# Should print the npm username

# 4. Dry-run to verify the published tarball contents
pnpm --filter @deessejs/cli publish --dry-run
# Should list: dist/index.js, dist/index.d.ts, README.md, LICENSE,
# package.json. No src/, no test/, no node_modules/

# 5. Publish for real
pnpm --filter @deessejs/cli publish --access public --no-git-checks
```

**What happens during the first publish:**

- npm prompts for a one-time password (2FA OTP) if the account has 2FA enabled.
- The tarball uploads to npmjs.com. <!-- vale fix: write-good.Passive -->
- The package appears at `https://www.npmjs.com/package/@deessejs/cli`.
- Provenance isn't generated for this first publish (no OIDC). This is a known limitation; recorded in npm/documentation#1926. <!-- vale fix: Microsoft.Contractions, write-good.Passive -->

**If anything fails:** fix the issue (probably a missing `LICENSE` file, wrong `repository`, etc.) and retry. The package either exists or it doesn't; there's no half-state.

## 12.4 Step 2: Configure the trusted publisher on npm

**Browser action, one-time.**

1. Sign in to npmjs.com as the maintainer who has publish rights on the `deessejs` org.
2. Navigate to `https://www.npmjs.com/package/@deessejs/cli/access`. **Note**: this is the per-package URL, not `/settings/{user}/packages`. Easy to miss; the trusted publisher config is on the package's settings page, not the user's settings page.
3. Find the "Trusted Publisher" section. Select "Add a trusted publisher" (or similar). <!-- vale fix: Microsoft.UIVerbs -->
4. Configure the fields:
   - **Publisher type**: GitHub Actions
   - **Organization or user**: `deessejs` (the GitHub org)
   - **Repository**: `deessejs` (this repo's name)
   - **Workflow filename**: `release.yml` (just the filename, not the path)
   - **Environment name**: leave blank initially (GitHub environments aren't in use; a maintainer can add one later for hardening) <!-- vale fix: Microsoft.We, write-good.Passive -->
   - **Allowed actions**: select `npm publish` (not `npm stage publish`, which is the staged-2FA variant; see 12.7)
5. Save.

**Verify the config** by reloading the page; the trusted publisher entry should appear. <!-- vale fix: write-good.Passive -->

## 12.5 Step 3: Verify the second publish works via the workflow

**After** the trusted publisher gets configured, the next release goes through the workflow automatically. <!-- vale fix: write-good.Passive -->

1. Merge a small PR to `staging` that touches `apps/cli/**` and includes a `.changeset/<slug>.md` with `"@deessejs/cli": patch` (for example, "Fix typo in --help output"). <!-- vale fix: Microsoft.Foreign -->
2. Promote staging → main.
3. Watch `.github/workflows/release.yml` run on the push to `main`.
4. Verify on npmjs.com:
   - The new version publishes.
   - The package page shows a "Provenance" badge (or matching attestation indicator). <!-- vale fix: write-good.Passive, write-good.TooWordy -->
   - The tag `release/v{x.y.z}` exists in the GitHub repo.
   - A GitHub Release exists for the same version.

**If the workflow fails with HTTP 404** on the publish step, see 12.6.

## 12.6 Common gotchas

### 12.6.1 Misleading 404

If the trusted publisher misconfigures (wrong workflow filename, env mismatch, wrong npm version), npm returns: <!-- vale fix: write-good.Passive -->

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@deessejs/cli
npm error 404 '@deessejs/cli@1.0.1' is not in this registry.
```

The package exists. The version is correct. The OIDC token exchange probably succeeded. **The error is misleading.** It doesn't mean the package doesn't exist. It means the trusted publisher rejected the workflow's OIDC claims. <!-- vale fix: Microsoft.Contractions -->

**Common causes:**

- npm version < 11.5.1 (Node 22 ships with npm 10.x). Fix: use Node 24 in the workflow, or `npm install -g npm@latest`.
- Environment name mismatch (npm has `environment: release` configured, workflow says `environment: production` or vice versa). Fix: align them or remove from both.
- Workflow filename mismatch (npm has `publish.yml`, repo has `release.yml`). Fix: reconfigure on npmjs.com with the exact filename.
- Org/user mismatch (npm has `deessejs`, repo is under `martyy-code/deessejs` or similar). Fix: align org or move repo.

Per Jurij Tokarski's [April 2026 writeup](https://varstatt.com/jurij/p/npm-trusted-publishing-from-github-actions), this 404 is the most common first-time confusion.

### 12.6.2 Provenance flag despite the docs

The npm docs say `--provenance` is automatic with trusted publishing. Real-world reports (Phil Nash, 2026-01-31) and the audit's own [02-problems.md §2.7](02-problems.md#27-p3--provenance-documentation-vs-reality) note that `--provenance` is still needed in practice. The senior pattern uses the triple belt: `publishConfig.provenance: true` in `package.json`, `--provenance` flag, and `NPM_CONFIG_PROVENANCE=true` env var. Belt + suspenders + belt.

### 12.6.3 Maintainer leaves the org

Trusted publishers link to specific GitHub users/orgs + repos + workflow filenames. If the maintainer who set it up leaves, the config stays valid (it links to the org, not the user). If the org moves the repo, the trusted publisher needs to be re-pointed. <!-- vale fix: write-good.Passive -->

### 12.6.4 Lost NPM_TOKEN, no recovery

There's no `NPM_TOKEN` in the senior pattern. If trusted publishing misconfigures, the maintainer can't fall back to a long-lived token, because none exists. Recovery options: <!-- vale fix: write-good.Passive -->

- Re-do the manual first publish from a developer's machine (12.3): overwrites the published version if no published version exists at that name, but if versions exist, `npm unpublish` within 72h.
- Disable the trusted publisher on npm, publish a new version with a temporary manual `npm publish --access public` from a developer's machine, re-enable the trusted publisher, fix the workflow.

### 12.6.5 `catalog:` deps don't survive `npm publish`

A published package's `package.json` must use standard semver, not pnpm's `catalog:` protocol. pnpm resolves the `catalog:` syntax **at install time**, but `npm publish` ships the raw `package.json` with the literal string `"catalog:"` in the `dependencies` field. When a consumer (or `npx`) tries to install the published package, npm rejects it with: <!-- vale fix: write-good.Passive -->

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "catalog:": catalog:
```

**Rule**: only monorepo-internal packages (the `packages/*` workspace) can use `catalog:`. A workspace package that will publish to npm must use real semver ranges for its `dependencies`. `devDependencies` can stay in `catalog:`; they don't ship to the registry. <!-- vale fix: write-good.Passive -->

**Recovery**: `npm unpublish @deessejs/cli@<broken-version>` (within 72h), fix the deps to real semver, then re-publish at the next version (for example, `1.0.1` if `1.0.0` was the broken one). <!-- vale fix: Microsoft.Foreign, write-good.Passive -->

## 12.7 Optional hardening (post-first-publish)

Once the basic flow works, the audit recommends considering:

- **Restrict token publishing**: on `https://www.npmjs.com/package/@deessejs/cli/access`, "Publishing access" → "Require two-factor authentication and disallow tokens." This means even if a long-lived token existed, npm would reject it. Defense in depth. <!-- vale fix: Microsoft.Quotes -->
- **Use GitHub environments**: configure `environment: release` on both the trusted publisher (npm side) and the workflow job. Adds a manual approval gate for production publishes.
- **Use `npm stage publish` only**: requires a 2FA 2FA review per publish via the CLI or npmjs.com. More secure but more friction. Probably overkill for this CLI.

These are optional. The senior pattern works without them.

## 12.8 What if the first publish needs reverting <!-- vale fix: write-good.Passive, Microsoft.HeadingPunctuation -->

- **Within 72 hours**: `npm unpublish @deessejs/cli@0.1.0` (or whatever version). The package goes away entirely. Repeat 12.3 to re-publish.
- **After 72 hours**: `npm publish` no longer allows unpublish. Use `npm deprecate @deessejs/cli@0.1.0 "reason"` and publish a new version with the fix.

## 12.9 Sequence summary

```
1. PR 1 + PR 2 + PR 3 land on staging, get promoted to main
   ↓
2. Maintainer runs 12.3 manually from their machine
   - Package exists on npm, no provenance
   ↓
3. Maintainer configures trusted publisher on npmjs.com (12.4)
   ↓
4. Next PR goes through the normal workflow
   - staging PR with .changeset/*.md
   - Merge staging → main
   - release.yml runs automatically
   - Publish with OIDC + provenance ✓
   ↓
5. Maintainer verifies on npmjs.com (12.5)
   - Provenance badge present
   - Tag release/v{x.y.z} created
   - GitHub Release exists
```

That's the full setup. After step 5, the maintainer doesn't think about npm anymore unless something breaks.