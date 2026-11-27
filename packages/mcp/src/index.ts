import { McpServer, createMcpHandler } from "@modelcontextprotocol/server"
import type {
  MyOrganizationsListResponseV1,
  OrganizationProjectDetailResponseV1,
  OrganizationProjectsListResponseV1,
  OrganizationTemplateV1,
  OrganizationTemplatesListResponseV1,
  TemplatesListResponseV1,
} from "@workspace/contracts/v1"
import { z } from "zod"

export const PRODUCT_MCP_TOOL_POLICIES = {
  listTemplates: { name: "list_templates", scope: "templates:read" },
  listMyOrganizations: {
    name: "list_my_organizations",
    scope: "organizations:read",
  },
  listOrganizationProjects: {
    name: "list_organization_projects",
    scope: "organizations:projects:read",
  },
  getOrganizationProject: {
    name: "get_organization_project",
    scope: "organizations:projects:read",
  },
  listOrganizationTemplates: {
    name: "list_organization_templates",
    scope: "organizations:templates:read",
  },
  getOrganizationTemplate: {
    name: "get_organization_template",
    scope: "organizations:templates:read",
  },
} as const

export interface ProductMcpOperations {
  listTemplates: () => Promise<TemplatesListResponseV1>
  listMyOrganizations: () => Promise<MyOrganizationsListResponseV1>
  listOrganizationProjects: (input: {
    organizationSlug: string
    page: number
    pageSize: number
  }) => Promise<OrganizationProjectsListResponseV1>
  getOrganizationProject: (input: {
    organizationSlug: string
    projectId: string
  }) => Promise<OrganizationProjectDetailResponseV1>
  listOrganizationTemplates: (input: {
    organizationSlug: string
    page: number
    pageSize: number
  }) => Promise<OrganizationTemplatesListResponseV1>
  getOrganizationTemplate: (input: {
    organizationSlug: string
    templateId: string
  }) => Promise<{ template: OrganizationTemplateV1 }>
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
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.listOrganizationProjects.name,
        {
          description:
            "List projects in an organization you belong to. Results are paginated.",
          inputSchema: z.object({
            organization_slug: z.string().min(1),
            page: z.number().int().min(1).max(10_000).optional(),
            page_size: z.number().int().min(1).max(50).optional(),
          }),
        },
        async ({ organization_slug, page, page_size }) => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await operations.listOrganizationProjects({
                  organizationSlug: organization_slug,
                  page: page ?? 1,
                  pageSize: page_size ?? 25,
                })
              ),
            },
          ],
        })
      )
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.getOrganizationProject.name,
        {
          description:
            "Get one project in an organization you belong to by its project ID.",
          inputSchema: z.object({
            organization_slug: z.string().min(1),
            project_id: z.string().uuid(),
          }),
        },
        async ({ organization_slug, project_id }) => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await operations.getOrganizationProject({
                  organizationSlug: organization_slug,
                  projectId: project_id,
                })
              ),
            },
          ],
        })
      )
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.listOrganizationTemplates.name,
        {
          description:
            "List templates owned by an organization you belong to, including publication status. Results are paginated.",
          inputSchema: z.object({
            organization_slug: z.string().min(1),
            page: z.number().int().min(1).max(10_000).optional(),
            page_size: z.number().int().min(1).max(50).optional(),
          }),
        },
        async ({ organization_slug, page, page_size }) => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await operations.listOrganizationTemplates({
                  organizationSlug: organization_slug,
                  page: page ?? 1,
                  pageSize: page_size ?? 25,
                })
              ),
            },
          ],
        })
      )
      server.registerTool(
        PRODUCT_MCP_TOOL_POLICIES.getOrganizationTemplate.name,
        {
          description:
            "Get one template owned by an organization you belong to, including publication status.",
          inputSchema: z.object({
            organization_slug: z.string().min(1),
            template_id: z.string().uuid(),
          }),
        },
        async ({ organization_slug, template_id }) => ({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await operations.getOrganizationTemplate({
                  organizationSlug: organization_slug,
                  templateId: template_id,
                })
              ),
            },
          ],
        })
      )
      return server
    },
    { legacy: "reject" }
  )
