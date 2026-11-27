# @workspace/database

## 0.1.0

### Minor Changes

- 92fb760: Add organization block import and publication review APIs, plus public discovery of approved block revisions.
- e866f5a: Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.
- d84324b: Add managed presentation image uploads for templates and stable API-hosted image delivery.

### Patch Changes

- 47d6353: Add private R2 uploads for personal and organization avatars with image validation, membership-checked reads, removal, and cleanup.
- 38e8d9b: Add organization-scoped Pro billing and seat entitlements, including the database table used to assign paid seats.
- Updated dependencies [e866f5a]
- Updated dependencies [47d6353]
  - @workspace/env@0.0.1

## 0.0.1

### Patch Changes

- 83a37b0: test(e2e): re-exercise the custom release pipeline after the `-f` tag fix. Adds a constant export `RELEASE_TEST_MARKER` to `packages/database/src/tables/index.ts` and bumps `@workspace/database` patch. No behavioral change.
