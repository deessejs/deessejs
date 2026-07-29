# `05-modular-contract/` — The wedge proof

## Purpose

This folder is the **technical specification** of the "delete what you don't need" claim. It's the proof point of the whole "Apple of SaaS templates" positioning — and it must be true, not just promised.

If a contributor reads only one folder in this whole tree, it should be this one.

## What's in here

- `README.md` (this file) — the contract, the test discipline, and the consequences of slipping.
- `module-structure.md` — the exact shape of a feature module: directory layout, `index.ts` public surface, naming, imports rules.
- `delete-tests.md` — the delete-test pipeline: how `pnpm test:delete --feature=<name>` works, what it asserts, what it cleans up.
- `feature-template.md` — a copy-pasteable template for adding a new feature module that passes the contract from day 1.

## The contract (summary)

1. Every feature is a self-contained module under `src/features/<name>/`.
2. Each module has a single `index.ts` re-exporting its public surface.
3. The app and other modules only import from those `index.ts` files — never from internal module files.
4. To delete a feature: remove the directory, remove the imports, remove its schema and env vars, remove its docs page. The rest of the app keeps running.
5. Every feature has a **delete test** that runs in CI. A red delete test blocks merge.

## Why this folder exists separately

The modular contract is the wedge. It's also the **load-bearing** technical promise. If we treat it as just another feature spec, we'll let it rot. This folder exists so that:

- A new contributor sees the contract before writing their first feature.
- A reviewer can point at `delete-tests.md` when a PR imports from inside a module.
- The CI failure is debugged against a spec, not folklore.

## Conventions

- A PR that breaks a delete test is a **P0 bug**, not a flaky test.
- A new feature ships with its delete test on the same day, in the same PR.
- The "Deleting features" walkthrough in the buyer docs (Fumadocs) is the contract rendered for humans. The buyer-facing doc and the internal spec stay in sync.

## Related

- [`../product/architecture.md#the-modular-contract`](../../product/architecture.md) — the product-side description.
- [`../product/onboarding.md`](../../product/onboarding.md) — the "Deleting features" flagship doc for buyers.
- [`08-testing/delete-test-pipeline.md`](../08-testing/delete-test-pipeline.md) — the CI mechanics.
- [`../product/features/20-cross-cutting.md`](../../product/features/20-cross-cutting.md) — feature 20.1, 20.2 (the contract spec).
- [`../product/features/23-testing.md`](../../product/features/23-testing.md) — feature 23.25 (delete tests in the test inventory).
