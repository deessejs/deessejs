# create-deesse-app end-to-end tests

This directory holds the consumer-level end-to-end harness described in
the design spec. Two test suites live here:

## Native smoke (`smoke/`)

Runs the bundled CLI directly on the host OS, no Docker. Two
files, separated by network dependency:

- `native-cli.test.ts` — pure CLI checks. **No network.** Runs
  on every platform. Covers `--version`, `--help`, unknown
  flag, and the npm-invocation guard.
- `native-generation.test.ts` — `--no-install` generation
  flow. **Network-dependent** (downloads the saas-template
  tarball via `git ls-remote` against github.com). Will
  fail in any environment without github.com access; that
  is expected.

```sh
pnpm --filter create-deesse-app build
pnpm --filter create-deesse-app exec vitest run \
  --config test/e2e/smoke/vitest.smoke.config.ts
```

The pure-CLI file is the OS-level contract that the brief
calls out as the lower bound of "supported compatibility
matrix"; the generation file is an additional check that the
template path is reachable on every supported platform.

## Consumer e2e (`packed-archive.test.ts`, `verdaccio-roundtrip.test.ts`, `application-generation.test.ts`)

Runs the full consumer journey with Testcontainers: a disposable
Verdaccio, a disposable PostgreSQL, and a clean consumer container.
Exercises pnpm `dlx`, registry resolution, and the package-manager
install of the CLI artifact in an isolated environment that has no
checkout, no monorepo, no node_modules.

**Requires Docker.** The suite auto-skips on machines without
`/var/run/docker.sock`. To run locally:

```sh
# Make sure Docker is running (Docker Desktop, Colima, or a Linux host).
pnpm --filter create-deesse-app build
pnpm --filter create-deesse-app test:e2e
```

The Linux CI job (`create-deesse-app-e2e` in `ci.yml`) is the
canonical run. The e2e tests are excluded from `pnpm test` (unit
suite) so unit tests stay fast and Docker-free.

## What is and is not yet covered (by commit)

- `packed-archive.test.ts` — artifact identity + clean consumer
  install. Skipped without Docker.
- `verdaccio-roundtrip.test.ts` — publish to local Verdaccio +
  `pnpm dlx <name>@<exact-version>`. Skipped without Docker.
- `application-generation.test.ts` — `pnpm dlx` runs the CLI, the
  generated project is a real Turborepo with `pnpm-workspace.yaml`
  and `apps/app/package.json`, and the consumer can reach the
  PostgreSQL container. Skipped without Docker.
- (future commit) Playwright signup + email-verification + protected
  page. Deferred because the smoke matrix must turn green first.

## Pinning

- Node 24 (consumer image, CI runner)
- pnpm 11.0.0 (corepack-pinned, matches repo)
- testcontainers ^12
- @playwright/test catalog

`allowBuilds` in the workspace root lists every native dep the
consumer journey needs (cpu-features, protobufjs, ssh2 for
Testcontainers).
