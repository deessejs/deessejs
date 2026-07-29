---
name: followup-better-auth-doc-stale
description: 2026-07-28 follow-up — docs/guides/better-auth/{index.md:17, email.md:27, pitfalls.md §6} still describe `sendOnSignUp: false` as "temporary" but the code has been reverted. Bundle with the broader single-tenant doc cleanup PR.
metadata:
  type: project
---

# Better-Auth docs are stale on `sendOnSignUp`

Code has `sendOnSignUp: true` (`packages/auth/src/auth.ts:38`), but the docs still call out the pre-fix state:

- `docs/guides/better-auth/index.md:17` — table row "sendOnSignUp: false (temp bypass) | Temporary — must revert to true"
- `docs/guides/better-auth/email.md:27` — code block comment `// ⚠️ temporary bypass — must revert to true`
- `docs/guides/better-auth/pitfalls.md` §6 "sendOnSignUp Is Temporarily `false`"

## Suggested fix

Lowest-risk path:

1. Update `index.md:17` row → `sendOnSignUp: true | Locked`
2. Update `email.md:27` example code → `sendOnSignUp: true` (no inline warning)
3. Rewrite pitfalls.md §6 → "sendOnSignUp must be `true` when `requireEmailVerification: true` is set" (positive framing, citing `auth.ts:38`)

This is part of the broader [[single-tenant]] doc cleanup PR — does not need a separate PR.

Related: [[single-tenant]], [[p1-send-on-signup-disabled]] (closed), [[packages-auth]].
