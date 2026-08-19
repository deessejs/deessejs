---
"@deessejs/cli": patch
---

Implements ADR-019. The CLI's self-version value was a hand-maintained constant (`apps/cli/src/api/self-version.ts`) that had to be updated by hand on every release. The first release after the last bump would have desynchronised the constant from `apps/cli/package.json` (which Changesets owns) and the published CLI would have advertised the wrong version. Commander's `--version` flag carried a third value (`"0.1.0"`) that had already drifted from the package version (`"2.0.0"`).

What's in this patch:

- `apps/cli/tsup.config.ts` reads `apps/cli/package.json` at build time via `createRequire` and exposes the version through tsup's `define` option as `process.env.CLI_PACKAGE_VERSION`. esbuild inlines the literal string into the bundle; the runtime never executes a path lookup.
- `apps/cli/src/api/self-version.ts` now exposes only `readPackageVersion()`, which reads the injected value. The hand-maintained `CLI_PACKAGE_VERSION` constant is removed. A local `declare const process` block carries the type for `process.env.CLI_PACKAGE_VERSION` because the field does not exist on Node's actual `process.env` shape.
- `apps/cli/src/index.ts` replaces the hardcoded `.version("0.1.0")` with `.version(readPackageVersion())`. Commander's `--version` flag now reports the same value the self-version probe reads.
- `apps/cli/vitest.config.ts` mirrors the `define` block so that vitest substitutes the same value when running unit tests. Without this, `readPackageVersion()` would return `undefined` under vitest because the real `process.env.CLI_PACKAGE_VERSION` is a build-time substitution, not an environment variable.
- `apps/cli/test/unit/cli-self-version.test.ts` is rewritten to assert three shapes: the value is defined, it matches `apps/cli/package.json`, and it matches the `X.Y.Z` semver shape the version probe's `compareSemver` requires.

No user-visible behavior change in normal operation. The CLI prints the same version it would have printed before, except now the value cannot drift from `package.json` between releases. The drift-risk window closes: every future release is a `pnpm changeset version` away from a coherent published version.
