import { McpServer, createMcpHandler } from "@modelcontextprotocol/server"
import type { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { z } from "zod"

export interface ProductMcpOperations {
  listTemplates: () => Promise<TemplatesListResponseV1>
}

export const createProductMcpHandler = (operations: ProductMcpOperations) =>
  createMcpHandler(
    () => {
      const server = new McpServer({ name: "DeesseJS", version: "1.0.0" })
      server.registerTool(
        "list_templates",
        {
          description: "List public DeesseJS product templates.",
          inputSchema: z.object({}),
        },
        async () => ({
          resultType: "content",
          content: [
            {
              type: "text",
              text: JSON.stringify(await operations.listTemplates()),
            },
          ],
        })
      )
      return server
    },
    { legacy: "reject" }
  )
