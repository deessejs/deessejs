---
name: better-auth-cli-release-blocker
description: RESOLVED 2026-07-28 — `pnpm auth:generate` invokes the `auth` binary bundled in catalog `better-auth@^1.6.23` (same release line as the runtime and adapter). No separate `@better-auth/cli` is declared.
metadata:
  type: project
---

# RESOLVED 2026-07-28

The 2026-07-13 report flagged a mismatch: runtime `better-auth@1.6.23` + adapter `@better-auth/drizzle-adapter@1.6.23` vs. a supposed legacy `@better-auth/cli@1.4.21`.

Audit on 2026-07-28 confirmed none of that is true:

- `packages/auth/package.json` declares **no** `@better-auth/cli` (neither in `dependencies` nor `devDependencies`).
- The `auth:generate` script invokes `pnpm exec auth generate --config ./src/auth.ts --output ../database/src/schema/auth.ts --yes`. Since Better Auth 1.5, the CLI is bundled into the main `better-auth` package (no separate CLI package needed). The `auth` executable therefore resolves to catalog `better-auth@^1.6.23` — i.e. the same release line as the runtime and the drizzle adapter. No mismatch, no lock-up.
- `pnpm auth:generate` is safe to run as-is.

The `auth generate` workflow itself has additional caveats (regenerates the entire `packages/database/src/schema/auth.ts`, custom field names get overwritten) — see [[packages-auth]] for the ownership rules and review-before-commit practice. Those caveats are normal and were never the blocker.

If a future Better Auth version reintroduces a separate `better-auth/cli` (or similar) package, this entry should be re-evaluated. Today: nothing blocks.

Related: [[packages-auth]], [[single-tenant]].
