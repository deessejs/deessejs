---
name: package-structure
description: Project follows one-package-per-concern — when adding new functionality (mailer, billing, analytics), create a dedicated packages/* workspace instead of co-locating in an existing package
metadata:
  type: project
---

The saas-template monorepo enforces a strict **one-package-per-concern** architecture. Each domain owns its own `packages/*` workspace with its own `package.json`, `tsconfig.json`, and dep tree.

**Why:** Confirmed 2026-07-07 during the mailer audit — user decided to extract the mailer into a new `packages/email` package instead of co-locating it under `packages/auth/src/email/`. The existing `packages/auth`, `packages/database`, `packages/api`, `packages/ui`, `packages/env` already follow this pattern, so adding `packages/email` is the consistent choice. Each package has minimal deps, tests in isolation, and clear ownership boundaries.

**How to apply:** When planning a new feature that touches multiple domains (e.g., email sending, billing, file uploads, analytics), **propose a new `packages/<domain>/` package** by default. Only co-locate inside an existing package when the new functionality is genuinely a sub-domain of that package (e.g., adding a new better-auth callback stays in `packages/auth` because it's an auth concern).

Concrete rules:
- `packages/email` owns all email-sending logic (transports + templates)
- `packages/auth` only depends on `better-auth` + `drizzle` + `@workspace/database` + `@workspace/env` + `@workspace/email` (for callbacks)
- React Email components and `resend` SDK live only in `packages/email`
- No circular imports — `packages/email` depends only on `@workspace/env` (server-only)

Related: [[stack]], [[packages-auth]], [[mailer-audit]].