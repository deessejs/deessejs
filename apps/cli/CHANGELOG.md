# @deessejs/cli

## 2.0.1

### Patch Changes

- 3c707fa: Mark `@workspace/contracts` as private so the release workflow stops trying to publish it.

  What's in this patch:

  - `packages/contracts/package.json` reverts to `"private": true`. Earlier attempts at the same fix marked it `private: false` to satisfy Changesets' versioned-dependency check (because `@deessejs/cli` used to list it as a runtime dependency). With that dependency moved to `devDependencies` (PR #20), Changesets no longer needs the workaround and respects `private: true` as the canonical signal for 'never publish this package'.
  - The previous attempts to fix this resulted in `pnpm changeset publish` trying to `PUT @workspace/contracts@0.0.1` to the public npm registry, which 404'd. With `private: true`, Changesets skips the package entirely on publish.
  - `apps/cli/src/cli-self-version.ts` is bumped from `1.1.0` to `1.1.1` to match the new `apps/cli/package.json` version (kept in sync by the drift check test).

  After this release, `npx @deessejs/cli@latest --version` should return `1.1.1` and the install should complete without any 404.

- 5d6a790: Unblock the release workflow. Changesets has been failing at `pnpm changeset version` since the oRPC migration added `@workspace/api` and `@workspace/contracts` as dependencies of the published CLI; Changesets refuses to bump a package that depends on a skipped package.

  What's in this patch:

  - `.changeset/config.json` flips `privatePackages` from `{ version: false, tag: false }` to `{ version: true, tag: false }`. Private workspace packages are now versioned (so the dependency graph stays consistent) but never tagged or published. Implements ADR-012.
  - `apps/cli/package.json` drops the duplicate `@workspace/contracts` entry from `dependencies`. The package stays in `devDependencies` for typecheck; runtime code is still inlined by tsup via `noExternal: [/^@workspace\//]`.

  No behavior change at runtime. The next release workflow run after this lands on `main` will bump the CLI to `2.0.1` and publish it on npm.

- 6762ae0: Reposition discoverability metadata: replace the `saas-template` npm keyword with `deessejs-main-app` to match the repo's new identity. No behavior change, no API change, no runtime impact — search-engine metadata only.

  This is one of several commits shipping under the `chore(brand):` theme to reposition this repo as the DeesseJS main app (see `docs/engineering/plans/deessejs-main-app-repositioning.md`). The keyword change is isolated to `apps/cli/package.json`; the package name (`@deessejs/cli`) and `repository.url` were already aligned with the new identity.

## 1.1.1

### Patch Changes

- d8afed0: Hotfix release: bundle `@workspace/contracts` into the CLI so installs stop 404'ing.

  What's in this patch:

  - The CLI's published tarball previously listed `@workspace/contracts`
    as a runtime dependency, but `@workspace/*` packages are workspace-only
    and never published to npm. `npx @deessejs/cli@1.1.1` would install
    the tarball successfully but then fail with `404 Not Found - GET
https://registry.npmjs.org/@workspace%2fcontracts` when npm tried
    to resolve that dependency. The CLI itself was unused because the
    install errored out.
  - `apps/cli/tsup.config.ts` now sets `noExternal: [/^@workspace\//]`,
    which tells tsup to inline any `@workspace/*` import into
    `dist/index.js` at build time instead of leaving an `import` that
    would need to resolve at runtime.
  - `apps/cli/package.json` moves `@workspace/contracts` from
    `dependencies` to `devDependencies`. The package is still consumed
    in the monorepo via the workspace protocol (dev-time), but it
    no longer appears in the published `package.json` (consumer-time).

  Trade-off: the CLI's bundle now contains an inlined snapshot of
  `@workspace/contracts`. A contract change requires a CLI re-bundle
  - re-publish. This is the standard pattern for Zod-based libraries
    that ship contracts internally (tRPC, etc.).

  Verification:
  - `pnpm --filter @deessejs/cli build` produces `dist/index.js` (551 KB).
  - `grep "@workspace" apps/cli/dist/index.js` returns 0 matches
    (the import is fully inlined).
  - `grep -c "TemplatesListResponseV1" apps/cli/dist/index.js` returns
    2 occurrences (the schema definition + its runtime usage).
  - `pnpm --filter @deessejs/cli test`: 53/53 green.
  - `pnpm --filter @deessejs/cli lint`: clean.
  - `pnpm --filter @deessejs/cli typecheck`: clean.

  After this release, `npx @deessejs/cli@latest --version` should
  return `1.1.2` and the install should succeed without any 404.

- c0fe9f1: Hotfix release: ship the compiled CLI bundle and correct the upgrade hint.

  What's in this patch:

  - The release workflow (`.github/workflows/release.yml`) now runs
    `pnpm build` for publishable packages (`@deessejs/cli`,
    `@workspace/contracts`) between the version bump and the
    `pnpm changeset publish` step. The 1.1.0 release shipped without
    the `dist/` directory in the published tarball, so `npx
@deessejs/cli` and `pnpm dlx @deessejs/cli` both failed with
    "'deessejs' is not recognized" — the bin target pointed at a
    file that didn't exist in the package.
  - The version-check warning (`apps/cli/src/version-check.ts`) now
    prints `pnpm dlx @deessejs/cli@latest` instead of `pnpm dlx
deessejs@latest`. The unscoped `deessejs` name on npm belongs to
    an unrelated package, so the old hint pointed users at the
    wrong install command.

  No functional change to CLI behavior. The bundle is now included
  in the tarball, and the upgrade message points at the correct
  package.

## 1.1.0

### Minor Changes

- 97bd9be: Add npm publish flow with trusted publisher. `apps/cli` becomes a public npm package accessible via `npx deessejs@latest`. Initial public release at 0.2.0.
- f13965a: Make the CLI resilient to backend outages and to backend drift.

  - Disk cache at `~/.deessejs/templates.json` (JSON, atomic write). Subsequent
    `deessejs list/info/init` calls send `If-None-Match` against the server's
    ETag and serve the cached body on a 304.
  - Retry on transient failures (3 attempts, 250ms / 750ms / 2s backoff with
    jitter). Retries on network errors, HTTP 5xx, and HTTP 429 (honors the
    server's `X-RateLimit-Reset`). Graceful fallback to the disk cache when
    the backend is unreachable and a cache entry exists.
  - New global `--offline` flag that skips the network entirely and serves
    the on-disk cache. Errors with a clear message if no cache is available.
  - Non-blocking CLI version probe against `/api/v1/cli-version` on startup.
    Prints a warning when the local version is below `minSupported`, with a
    hint to upgrade via `pnpm dlx deessejs@latest`. The probe is best-effort
    and never fails the command.
  - HTTP routes move from `/api/templates` to `/api/v1/templates`. The CLI
    points at the new path by default; the `--api-url` flag and
    `DEESSEJS_API_URL` env var still override.

  Internal note: the new `--offline` flag is a global option and may appear in
  help output for every subcommand.
