# @workspace/auth

## 0.1.0

### Minor Changes

- e866f5a: Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.

### Patch Changes

- 38e8d9b: Add organization-scoped Pro billing and seat entitlements, including the database table used to assign paid seats.
- ebdcd25: Add OAuth sign-in and consent pages for product MCP connections, plus account settings to review and revoke authorized apps.
- Updated dependencies [92fb760]
- Updated dependencies [e866f5a]
- Updated dependencies [47d6353]
- Updated dependencies [d84324b]
- Updated dependencies [38e8d9b]
  - @workspace/database@0.1.0
  - @workspace/env@0.0.1
  - @workspace/email@0.0.1

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1

## 0.0.1

### Patch Changes

- 03712ca: fix(auth): defense-in-depth against OAuth `callbackURL` open redirect ([CVE-2025-27143](https://github.com/better-auth/better-auth/security/advisories/GHSA-99p3-qfj2-3vp2)). The previous flow validated only the path component of `callbackURL`, allowing protocol-relative URLs (`//evil.com`) and backslash variants (`/\evil.com`) to bypass the check and redirect users to attacker-controlled hosts after sign-in. A new `safe-redirect` helper in `@workspace/utils` normalises any redirect target into a guaranteed-safe relative path, and `packages/auth/src/auth.ts` now calls it before forwarding to the OAuth provider. Test coverage for all four known bypass vectors.
