# @workspace/env

## 0.0.1

### Patch Changes

- e866f5a: Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.
- 47d6353: Add private R2 uploads for personal and organization avatars with image validation, membership-checked reads, removal, and cleanup.
