---
"@deessejs/cli": minor
---

Release 2.1.0. Promote the `staging`-accumulated work to `npm @deessejs/cli@latest` so consumers can install a self-contained, installable CLI.

Why a minor and not a patch: 2.0.x shipped on npm with an unresolvable published `package.json` (pnpm-only `catalog:` and `workspace:*` URLs in `dependencies`). Installing `2.0.x` via `npm install @deessejs/cli@latest` or `npx @deessejs/cli@latest` aborted with `EUNSUPPORTEDPROTOCOL` before any code ran. 2.1.0 makes the published `package.json` honest about its install-time dependencies. The CLI's own public surface (commands, flags, exit codes) is unchanged.

What's in this release:

- `apps/cli/package.json` drops `@workspace/api: workspace:*` from `dependencies`. The package is not on npm and never was; the workspace URL was only resolvable inside a pnpm workspace.
- `apps/cli/package.json` adds `@workspace/api: workspace:*` to `devDependencies`. tsc and tsup still resolve the import for typecheck and bundle; the bundle is unaffected because tsup's `noExternal: [/^@workspace\//]` already inlines `@workspace/api`'s code into `dist/index.js`.
- `apps/cli/package.json` replaces `@orpc/client: catalog:` and `@orpc/server: catalog:` with `^1.14.7` in `dependencies`. These are real npm packages used at runtime by the CLI's RPCLink code, so they must be published as real semver.
- `apps/cli/package.json` replaces the `saas-template` npm keyword with `deessejs-main-app` to match the repo's new identity (search metadata only; no runtime impact).
- `apps/cli/tsup.config.ts` reads `apps/cli/package.json` at build time via `createRequire` and exposes the version through tsup's `define` option as `process.env.CLI_PACKAGE_VERSION`. esbuild inlines the literal string into the bundle; the runtime never executes a path lookup. Implements ADR-019.
- `apps/cli/src/api/self-version.ts` exposes only `readPackageVersion()`, which reads the injected value. The hand-maintained `CLI_PACKAGE_VERSION` constant is removed.
- `apps/cli/src/index.ts` replaces the hardcoded `.version("0.1.0")` with `.version(readPackageVersion())`. Commander's `--version` flag now reports the same value the self-version probe reads.
- `apps/cli/vitest.config.ts` mirrors the `define` block so vitest substitutes the same value when running unit tests.
- `apps/cli/test/unit/cli-self-version.test.ts` is rewritten to assert three shapes: the value is defined, it matches `apps/cli/package.json`, and it matches the `X.Y.Z` semver shape the version probe's `compareSemver` requires.
- `apps/cli/package.json#scripts.prebuild` / `predev` narrowed to `pnpm --filter @workspace/contracts build`; `pretest` switched to `pnpm turbo build --filter=@deessejs/cli && tsup` so the full workspace graph is built in topological order before the CLI bundles. Local `pnpm dev` no longer requires a manual full-graph rebuild.
- `.github/workflows/cli-publish-verify.yml` adds a guard job that catches `EUNSUPPORTEDPROTOCOL` (catalog: / workspace:*) regressions on the packed tarball before publish, so a future accidental re-introduction of the bug fails CI rather than npm.

After this release, `npx @deessejs/cli@latest` installs cleanly on a non-pnpm environment, and `--version` reports `2.1.0` matching the published version field.
