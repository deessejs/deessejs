# `02-data-model/` — Data architecture

## Purpose

The schema, the multi-tenancy model, the migration strategy. Everything about how data is structured, isolated, and evolved.

This is the folder to read when:
- Adding a new feature that needs persistence.
- Reviewing a migration PR.
- Debugging a tenant-isolation bug.
- Designing a cross-entity relationship.

## What's in here

- `README.md` (this file) — entry point + ER overview.
- `multi-tenancy.md` — the `orgId` mixin, scoping rules, and the rules every table must follow.
- `auth-schema.md` — Better Auth's generated schema and our additions (orgs, members, invitations, sessions).
- `billing-schema.md` — Stripe-mirrored tables: subscriptions, prices, usage meters.
- `migrations.md` — Drizzle migration strategy, reversibility, dangerous-migration checklist.

More files as needed (e.g. `notifications-schema.md`, `jobs-schema.md`).

## Conventions

- **Every table is org-scoped** unless explicitly justified otherwise. The `orgId` mixin in `multi-tenancy.md` is the contract.
- **Soft-delete by default** for user-facing entities. Hard-delete only for transient state (sessions, magic links, OTPs).
- **No orphan rows.** Foreign keys are required. Cascade behavior documented per relationship.
- **Timestamps:** `createdAt`, `updatedAt` on every table. Stored UTC; displayed in user TZ at the edge.
- **Money:** integer minor units (cents). No floats. Currency column nullable for future multi-currency.

## Schema changes

1. Generate the Drizzle migration locally: `pnpm drizzle-kit generate`.
2. Read the generated SQL by hand. Never trust the generator.
3. Update the relevant `*-schema.md` file in this folder in the same PR.
4. Add a note to `migrations.md` if the migration is destructive (data backfill, column drop, index rebuild).
5. CI runs the full test suite + delete tests on the migration.

## Related

- [`01-stack/drizzle.md`](../01-stack/drizzle.md) — ORM choice and rationale.
- [`../product/architecture.md#the-modular-contract`](../../product/architecture.md) — the feature-module contract that data ownership must respect.
- [`../product/features/02-orgs-and-rbac.md`](../../product/features/02-orgs-and-rbac.md) — the org and RBAC model.
- [`06-security/data-handling.md`](../06-security/data-handling.md) — GDPR, encryption, retention rules.
