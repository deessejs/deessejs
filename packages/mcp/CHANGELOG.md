# @workspace/mcp

## 0.1.0

### Minor Changes

- e866f5a: Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.

### Patch Changes

- Updated dependencies [92fb760]
- Updated dependencies [5e60234]
- Updated dependencies [0bd0d4b]
- Updated dependencies [6931a98]
- Updated dependencies [47d6353]
  - @workspace/contracts@0.1.0
