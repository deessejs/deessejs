# @workspace/auth

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1

## 0.0.1

### Patch Changes

- 03712ca: fix(auth): defense-in-depth against OAuth `callbackURL` open redirect ([CVE-2025-27143](https://github.com/better-auth/better-auth/security/advisories/GHSA-99p3-qfj2-3vp2)). The previous flow validated only the path component of `callbackURL`, allowing protocol-relative URLs (`//evil.com`) and backslash variants (`/\evil.com`) to bypass the check and redirect users to attacker-controlled hosts after sign-in. A new `safe-redirect` helper in `@workspace/utils` normalises any redirect target into a guaranteed-safe relative path, and `packages/auth/src/auth.ts` now calls it before forwarding to the OAuth provider. Test coverage for all four known bypass vectors.
