---
name: p1-send-on-signup-disabled
description: RESOLVED 2026-07-28 code side — `sendOnSignUp: true` in packages/auth/src/auth.ts:38; proxy gates unverified users. Stale "temporary" label still in docs (see followup-better-auth-doc-stale).
metadata:
  type: project
---

# RESOLVED 2026-07-28 (code side)

Verified by audit on 2026-07-28:

- `packages/auth/src/auth.ts:38` sets `emailVerification.sendOnSignUp: true` (and `sendOnSignIn: true`).
- `apps/app/proxy.ts:58-60` redirects unverified users on protected prefixes (`/home`, `/settings`) to `/verify-email`.

The temp bypass introduced by `f42933e` is fully reverted in code.

## Open follow-up: doc stale

The "temporary — must revert to true" label still lives at:

- `docs/guides/better-auth/index.md:17`
- `docs/guides/better-auth/email.md:27`
- `docs/guides/better-auth/pitfalls.md` §6

These are misleading after the code fix. Tracked as [[followup-better-auth-doc-stale]]. Cleanup is part of the broader single-tenant doc PR ([single-tenant]).

Related: [[packages-auth]], [[single-tenant]], [[followup-better-auth-doc-stale]].
