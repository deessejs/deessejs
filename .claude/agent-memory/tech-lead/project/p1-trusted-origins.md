---
name: p1-trusted-origins
description: RESOLVED 2026-07-28 — `packages/auth/src/auth.ts:12-17` now NODE_ENV-guards the localhost entries in `trustedOrigins`. P1 closed.
metadata:
  type: project
---

# RESOLVED 2026-07-28

The localhost-leak risk is gone: `packages/auth/src/auth.ts:12-17` only spreads the localhost entries when `NODE_ENV === "development"` and otherwise relies on `serverEnv.ALLOWED_ORIGINS`.

```ts
trustedOrigins: [
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...serverEnv.ALLOWED_ORIGINS,
],
```

`docs/guides/better-auth/pitfalls.md` §5 was written before the fix; the doc text still reads as if the leak is live. The fix is in code; this entry stays as a historical note.

Related: [[packages-auth]], [[single-tenant]], [[feedback-verify-high-severity-findings]].
