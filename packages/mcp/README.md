# `@workspace/mcp`

Internal construction of the DeesseJS product Model Context Protocol server.

The API owns transport mounting, resource OAuth verification, and the implementations of product operations. It injects those operations into this package, which owns MCP server construction and tool registration. This keeps the MCP capability layer independent of API internals and database access.

The current server exposes one read-only tool: `list_templates`.
