---
"@workspace/api": minor
"@workspace/auth": minor
"@workspace/database": minor
"@workspace/env": patch
"@workspace/mcp": minor
---

Add the OAuth-protected DeesseJS product MCP endpoint with the read-only `list_templates` tool. The API injects the existing catalog operation into the internal MCP package, which owns server construction and tool registration. Configure the canonical resource with `MCP_RESOURCE_URL`; production values must use HTTPS. The generated auth schema and migration add the OAuth provider tables required by the endpoint.
