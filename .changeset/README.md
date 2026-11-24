# Changesets

Changesets record the intended version bump and consumer-facing summary for a public package. The current stable `release.yml` workflow publishes `@deessejs/cli`, `deesse`, and `@deessejs/drizzle-adapter` from the versions committed in their package manifests. The staging canary channel currently publishes the CLI only.

`create-deesse-app` is an existing npm package, but it is not part of `release.yml` in this release-process change. Its release path should not be inferred from the workflows described here.

## When to add a Changeset

Add one when a pull request changes the published behavior, public API, runtime dependencies, or installable files of an existing public package:

- `apps/cli` changes that affect `@deessejs/cli`.
- `apps/deesse` changes that affect `deesse`.
- `apps/deesse-drizzle-adapter` changes that affect `@deessejs/drizzle-adapter`.
- Existing CLI surfaces in `apps/create-deesse-app`, `packages/contracts`, or `packages/api` that affect the CLI.

The first PR that introduces `deesse` or `@deessejs/drizzle-adapter` sets each package's baseline version directly in its `package.json`; that initial addition does not need a Changeset bump. Later PRs touching those packages require Changesets. The first `@deessejs/ui` change uses a minor Changeset against its `0.0.0` manifest baseline, producing `0.1.0` when the version-preparation process runs.

Skip a Changeset for internal-only changes, tests, documentation, formatting, or dependency updates that do not change consumer behavior. Template catalog content changes do not bump the CLI because templates are served by the API and the CLI is their client.

## Format

Create a uniquely named Markdown file in `.changeset/`:

```markdown
---
"deesse": minor
"@deessejs/drizzle-adapter": patch
---

Add the framework capability and adapter fix for consumers.
```

Use `patch` for compatible fixes, `minor` for compatible features, and `major` for breaking changes. Include only the package or packages whose published behavior changes.

## Pull request and release flow

1. Add the Changeset with the code change. `changesets-check.yml` requires a valid Changeset when an existing public package surface changes.
2. Merge to `staging`. The canary workflow continues to publish the CLI canary. Framework and adapter releases stay on the stable channel until their prerelease compatibility contract is defined.
3. Before promoting to `main`, update the package manifest versions through the project's version-preparation process. `release.yml` reads the committed manifest versions; it does not run `pnpm changeset version` or push version commits itself.
4. On `main`, `release.yml` builds and packs each changed public package, rejects tarballs with unresolved `catalog:` or `workspace:` dependencies, and publishes versions that are ahead of npm. It creates a separate GitHub tag and release for each package.
5. The framework publishes before the adapter, because the adapter declares `deesse` as a peer dependency.

The first `@deessejs/drizzle-adapter` publication uses two manual workflow dispatches from `main`:

1. Add a temporary stage-only npm token as the `NPM_DRIZZLE_BOOTSTRAP_TOKEN` Actions secret. Since the package does not exist yet, scope the token to `@deessejs` with stage-only write permission and a short expiration. Dispatch `release.yml` with `bootstrap_adapter: true`. The workflow stages the package contents. npm creates a public `0.0.0-stage` placeholder for the new package while the actual staged version and its files remain unavailable until approval.
2. Review and approve the staged `0.1.0` version on npm with 2FA, then remove the temporary secret. Dispatch `release.yml` again with `record_adapter_release: true` to create the package-specific GitHub tag and release.

Add Trusted Publishing for `release.yml` on the npm package before the next real adapter release. Configure it close to that release so npm can validate the first trusted publish within its two-day window. Trusted Publishing for `deesse` should likewise be used by a successful `main` release shortly after its configuration is added.

The first `@deessejs/ui` publication follows the same stage, approve, then record sequence. After the UI Changeset has been applied on `staging` and its resulting `0.1.0` manifest version is promoted to `main`, add a temporary stage-only token as the `NPM_UI_BOOTSTRAP_TOKEN` Actions secret and dispatch `release.yml` from `main` with `bootstrap_ui: true`. Review the staged tarball and approve it on npm with 2FA. Remove the temporary Actions secret, then dispatch again from `main` with `record_ui_release: true` to create the `ui/v0.1.0` GitHub tag and release. Staging only submits the package to npm's staging area; the live package and `latest` tag move only after the maintainer's 2FA approval. Configure the package's npm Trusted Publisher for GitHub Actions using organization `deessejs`, repository `deessejs`, and workflow filename `release.yml` before a later stable release. Subsequent releases use OIDC Trusted Publishing and `npm publish --provenance`.

## Examples

```markdown
---
"deesse": patch
---

Fix the framework's request handling for consumers.
```

```markdown
---
"@deessejs/drizzle-adapter": minor
---

Add a compatible schema-generation option to the PostgreSQL adapter.
```

## See also

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- The release-engineering process in the DeesseJS Nuclino workspace.
