# `08-testing/` — Test strategy

## Purpose

The test architecture: layers, tools, coverage, CI matrix, and the **delete-test pipeline** that enforces the modular contract.

This folder is the *how* of testing. The *what* (the test inventory) lives in [`../product/features/23-testing.md`](../../product/features/23-testing.md).

## What's in here

- `README.md` (this file) — entry point, layer overview, philosophy.
- `strategy.md` — the test pyramid, what we test at which layer, why.
- `delete-test-pipeline.md` — the technical spec of `pnpm test:delete --feature=<name>`: how the module is removed, what runs, what fails the build.
- `ci-matrix.md` — the GitHub Actions matrix: which jobs run on which events, time budgets, parallelism.

## The test layers

| Layer | Tool | Runs on | Coverage target |
|---|---|---|---|
| Unit | Vitest | every PR, every commit | 80% lines / 75% branches |
| Component | Vitest + Testing Library | every PR | 80% lines |
| Integration | Vitest + real Postgres + Redis | every PR | critical paths |
| E2E | Playwright (sharded) | every PR | wizard + delete tests + critical paths |
| Visual | Playwright screenshots | every PR (subset) | landing + docs |
| Contract | OpenAPI diff | every PR | all endpoints |
| A11y | axe-core | every PR | all pages |
| SEO | Lighthouse CI | every PR | score ≥ 90 |
| Perf | Lighthouse CI | every PR (nightly full) | p95 < 200ms |
| Security | npm audit + Snyk | every PR | zero high / critical |
| Load | k6 | nightly (not blocking) | documented scenarios |
| Smoke | Playwright | post-deploy | health + critical paths |

## Philosophy

- **Tests are written alongside features, not after.** A feature PR without tests fails CI.
- **Delete tests are not optional.** A red delete test is a P0 bug.
- **Flaky tests are quarantined and fixed within 48h.** The CI surfaces a flake report; nothing stays red for long.
- **Coverage is a floor, not a goal.** We aim for *meaningful* coverage of critical paths, not 100% line coverage.

## Related

- [`05-modular-contract/delete-tests.md`](../05-modular-contract/delete-tests.md) — the modular-contract side of the delete test.
- [`../product/features/23-testing.md`](../../product/features/23-testing.md) — the full test feature inventory.
- [`../product/features/19-performance-and-dx.md`](../../product/features/19-performance-and-dx.md) — perf and DX testing.
- [`../product/build-roadmap.md` M8](../../product/build-roadmap.md) — the pre-launch QA pass.
