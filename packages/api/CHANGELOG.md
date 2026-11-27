# @workspace/api

## 0.1.0

### Minor Changes

- 92fb760: Add organization block import and publication review APIs, plus public discovery of approved block revisions.
- e866f5a: Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.
- 2df43ce: Add an admin RPC procedure for updating official template catalog metadata.
- d84324b: Add managed presentation image uploads for templates and stable API-hosted image delivery.
- 45ee9ea: Move public web registry and RSS HTTP endpoints into Hono and expose them through web-origin rewrites.

### Patch Changes

- fefb8a9: Centralize construction of the typed browser oRPC client in a browser-safe API subpath.
- 5e60234: Add private image previews to organization templates.
- a0bca67: Validate the browser client's page origin without an unchecked type assertion.
- a808ec6: Return protocol-valid JSON-RPC results from the `list_templates` MCP tool.
- 0bd0d4b: Fetch catalog template details directly for `info` and successful `init` resolution.
- 4f4f1e1: Fix MCP route mounting and protect dynamic-base-URL token verification with shared DPoP replay detection.
- 3751b9a: Add an account-wide organization invitation inbox with verified-recipient access and accept or decline actions.
- 6931a98: Add a typed API operation for listing the current user's organizations and roles.
- 574ff69: Expose MCP protected-resource metadata at its RFC 9728 URL for OAuth discovery.
- 469a158: Add organization member roster and invitation management, including the invitation acceptance flow.
- 47d6353: Add private R2 uploads for personal and organization avatars with image validation, membership-checked reads, removal, and cleanup.
- 0fb1a79: Include presentation image URLs in the admin template list.
- 38e8d9b: Add organization-scoped Pro billing and seat entitlements, including the database table used to assign paid seats.
- Updated dependencies [92fb760]
- Updated dependencies [5e60234]
- Updated dependencies [e866f5a]
- Updated dependencies [0bd0d4b]
- Updated dependencies [6931a98]
- Updated dependencies [47d6353]
- Updated dependencies [d84324b]
- Updated dependencies [38e8d9b]
- Updated dependencies [ebdcd25]
  - @workspace/database@0.1.0
  - @workspace/contracts@0.1.0
  - @workspace/auth@0.1.0
  - @workspace/env@0.0.1
  - @workspace/mcp@0.1.0
  - @workspace/email@0.0.1

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1
  - @workspace/auth@0.0.2

## 0.0.1

### Patch Changes

- 28f8e6f: fix(api): `/ready` endpoint now pings Postgres before returning 200. The previous handler wrapped `c.json()` in a try/catch, but `c.json()` never throws — it just builds a Response — so the endpoint always returned `{ status: "ready" }`, giving Kubernetes and load balancers a false ready signal when the database was unreachable. Replaced with `await db.execute(sql\`SELECT 1\`)`; connection failures (ECONNREFUSED, ETIMEDOUT, pool exhaustion) now correctly return 503.
- Updated dependencies [03712ca]
  - @workspace/auth@0.0.1
