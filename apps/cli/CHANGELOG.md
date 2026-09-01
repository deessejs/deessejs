# @deessejs/cli

## 2.2.0

### Minor Changes

- 8bc8916: ADR-022: documents two gaps in the ADR-020 device-auth flow surfaced during the staging smoke after the staging-to-main promotion. First, the CLI's `deesse auth login` succeeds end-to-end but writes `user.id = ""` to `~/.deessejs/auth.json` (the user sees `logged in as unknown user` and `auth status` reports "session invalid"): `fetchUserIdentity` calls `authClient.getSession()` without an `Authorization` header, and the server does not register the `bearer()` plugin that would make the header resolvable. Second, the web verification page `/device` has no sign-in gate: the proxy's `config.matcher` does not include `/device` (the bounce branch is dead code), and the page itself does not check the session before rendering the Approve/Deny buttons, so a user who lands there while anonymous clicks Approve and gets HTTP 401 from Better Auth.

  The ADR explains both root causes, references the canonical Better Auth patterns and the production comparison (Vercel, GitHub, Microsoft, Auth0, Google device flow), and pins the implementation path: wire `bearerFetch` into `fetchUserIdentity` (replace the `?? { id: "" }` fallback with a hard `cli_device_expired` throw), register `bearer()` in `packages/auth/src/auth.ts` between `deviceAuthorization` and `nextCookies`, and add a server-side session check + redirect to `/login?redirect=/device?user_code=...` in the device page Server Component, plus adding `/device` to the proxy's `config.matcher`.

  This PR ships the ADR and the docs index entry only. The implementation lands in a follow-up PR; this changeset declares the upcoming minor bumps on `@deessejs/cli` and `@workspace/auth` so reviewers understand the lineage and the release pipeline can attribute the bump correctly.

- 6471c4f: Adds the device-flow authentication commands (ADR-020): `deesse auth login`, `deesse auth status`, and `deesse auth logout`. The CLI can now authorise itself against the DeesseJS server without a password, by opening a verification page in the user's browser and polling the server for an approval.

  The commands are siblings of `init` / `list` / `info` per ADR-010 §1, and the new `auth` parent is a peer-level addition (no existing command renamed or removed).

  Server wiring (the Better Auth deviceAuthorization plugin, the deviceCode table, and the five device endpoints under `/api/v1/auth/device/*`) shipped in the same PR's server-side commits; this changeset covers the client side only.

  What ships:

  - `deesse auth login` — requests a device code from the server, opens the browser to `verification_uri_complete` (not `verification_uri` alone, per ADR-020), polls `/device/token` every 5 seconds with `slow_down` bumping the local interval by 5 seconds, total timeout 30 minutes matching the device-code TTL. The Better Auth session token is persisted to `~/.deessejs/auth.json` with mode `0600`.

  - `deesse auth status` — read-only. Prints the user identity stored in `~/.deessejs/auth.json` and confirms the server-side session is still valid. Exits 0 on no-session (a normal pre-login state) and on stale token (user reruns `deesse auth login`).

  - `deesse auth logout` — POSTs to `/api/v1/auth/sign-out` then unconditionally deletes `~/.deessejs/auth.json`. A stale token file makes subsequent commands silently send a dead token, so the local cleanup is non-negotiable regardless of the server-side outcome.

  Wire format is whatever Better Auth publishes; no wrapper, no custom envelope (ADR-001).

  New public error codes on the CLI's closed list (ADR-010 §2, amended in lockstep):

  - `cli_device_denied` — user clicked Deny in the browser.
  - `cli_device_expired` — device code timed out before approval, or the code is invalid / already used.

  Both codes are part of the closed public surface and are not a precedent for further openings.

  The CLI now requires Node >= 20.0.0 (was >= 18.18.0) because the `open` package pinned to handle the cross-platform browser-launch vends Node 20+; the bump is overdue relative to the repo's already-pinned `^16.2.10` Next.js transitive requirement.

- 3b616fa: Release 2.1.0. Promote the `staging`-accumulated work to `npm @deessejs/cli@latest` so consumers can install a self-contained, installable CLI.

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

### Patch Changes

- af040af: Implements ADR-021: first-class inter-app URLs in `@workspace/env`,
  removing the relative-path construction in three consumers.

  User-visible:

  - `https://deessejs.com/templates` and
    `https://deessejs.com/templates/[slug]` now render the populated
    catalog and the detail page respectively. Previously, the
    marketing site's oRPC client fetched `/api/v1/rpc/templates/list`
    relative to `deessejs.com`, which does not host the backend (the
    catch-all lives in `apps/app/app/api/[[...route]]/route.ts` on
    `app.deessejs.com`). The marketing site was showing the documented
    empty state and `/templates/[slug]` returned a Next.js 500.
  - `npx @deessejs/cli list` (and every other published CLI command)
    now resolves the API host to `https://app.deessejs.com` by
    default, instead of failing because it resolved the URL against
    the user's working directory.

  API surface:

  - `@workspace/env` gains four server fields (`WEB_URL`, `APP_URL`,
    `DOCS_URL`, `API_BASE_URL`) and four client fields
    (`NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`,
    `NEXT_PUBLIC_DOCS_URL`, `NEXT_PUBLIC_API_BASE_URL`). Defaults are
    localhost ports in dev and the canonical Vercel domains in
    production. A `.refine` rejects trailing slashes at parse time.
  - `apps/web/src/lib/orpc.ts` builds the oRPC URL via
    `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
  - `apps/app/proxy.ts` builds the auth probe URL via
    `new URL(path, serverEnv.API_BASE_URL)`.
  - `apps/cli/src/api/client.ts` and `apps/cli/src/version/check.ts`
    read `process.env.API_BASE_URL` directly (the published tarball
    cannot depend on the private `@workspace/env` package). Override
    via shell env (`API_BASE_URL=https://staging.example.com
deessejs list`).

  Tests:

  - New unit suite at `packages/env/tests/unit/schema.urls.test.ts`
    pins the URL contract (defaults parse, production URLs parse,
    trailing slashes rejected, non-URLs rejected).

  Vercel env (operational, no code change):

  - Production: `API_BASE_URL=https://app.deessejs.com` and the
    `NEXT_PUBLIC_API_BASE_URL` mirror must be set on `apps/web`'s
    Vercel project.
  - Production: `ALLOWED_ORIGINS` on `apps/app`'s Vercel project must
    include `https://deessejs.com` for the cross-origin
    no-credentials fetch from the marketing site (cf. ADR-021 §
    Cross-origin considerations).
  - Preview deployments: each Vercel preview defaults to
    `https://app.deessejs.com` (the schema default). A future ADR
    covers preview-vs-preview wiring.

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
