import { McpServer, createMcpHandler } from "@modelcontextprotocol/server"
import type {
  MyOrganizationsListResponseV1,
  TemplatesListResponseV1,
} from "@workspace/contracts/v1"
import { z } from "zod"

export const PRODUCT_MCP_TOOL_POLICIES = {
  listTemplates: { name: "list_templates", scope: "templates:read" },
  listMyOrganizations: {
    name: "list_my_organizations",
    scope: "organizations:read",
  },
} as const

export interface ProductMcpOperations {
  listTemplates: () => Promise<TemplatesListResponseV1>
  listMyOrganizations: () => Promise<MyOrganizationsListResponseV1>
}

export const createProductMcpHandler = (operations: ProductMcpOperations) =>
  createMcpHandler(
    () => {
      const server = new McpServer({ name: "DeesseJS", version: "1.0.0" })
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.listTemplates.name,
        {
          description: "List public DeesseJS product templates.",
          inputSchema: z.object({}),
        },
        async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(await operations.listTemplates()),
            },
          ],
        })
      )
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.listMyOrganizations.name,
        {
          description:
            "List the organizations you belong to and your current role in each.",
          inputSchema: z.object({}),
        },
        async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(await operations.listMyOrganizations()),
            },
          ],
        })
      )
      return server
    },
    { legacy: "reject" }
  )
