---
name: p1-use-secure-cookies
description: RESOLVED 2026-07-28 — NODE_ENV-conditional `useSecureCookies` now in `packages/auth/src/auth.ts:55-57`; P1 closed. Kept as historical note in case of regression on a future better-auth upgrade.
metadata:
  type: project
---

# RESOLVED 2026-07-28

The original defect (static `useSecureCookies: true` in every environment breaking local HTTP login) was fixed by guarding the option on `NODE_ENV`. See `packages/auth/src/auth.ts:55-57`:

```ts
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production",
},
```

Production HTTPS still gets `Secure`; local HTTP no longer does.

`docs/guides/better-auth/pitfalls.md` §4 and `session.md` cookies section were written before the fix and may still show the pre-fix state. The fix is in code; this entry stays as a historical note.

Related: [[packages-auth]], [[single-tenant]], [[feedback-verify-high-severity-findings]].
