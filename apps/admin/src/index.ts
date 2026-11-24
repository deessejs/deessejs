import { admin as betterAuthAdmin } from "better-auth/plugins"
import type { ComponentType } from "react"
import { plugin, type PluginContribution, type PluginDefinition } from "deesse"
import { z } from "zod"
import { AdminOverview } from "./overview.js"

export type AdminPageAccess = "allow" | "unauthenticated" | "forbidden"

export type AdminPageContext = {
  readonly user: { readonly id: string; readonly email: string; readonly [key: string]: unknown }
  readonly session: object
  readonly request: Request
  readonly params: Readonly<Record<string, string | string[]>>
}

export type AdminPageDefinition = {
  readonly path: string
  readonly title: string
  readonly component: ComponentType
  readonly group?: string
  readonly order?: number
  readonly authorize?: (context: AdminPageContext) => AdminPageAccess | Promise<AdminPageAccess>
}

export function adminPage<TPage extends AdminPageDefinition>(page: TPage): TPage {
  return page
}

const adminOptionsSchema = z.object({
  pages: z.array(z.custom<AdminPageDefinition>()).default([]),
})

function composePages(configuredPages: readonly AdminPageDefinition[]): readonly AdminPageDefinition[] {
  const pages = [
    adminPage({ path: "", title: "Overview", component: AdminOverview }),
    ...configuredPages.map((page) => ({ ...page, path: normalizeAdminPath(page.path) })),
  ]
  const paths = new Set<string>()
  for (const page of pages) {
    if (typeof page.title !== "string" || !page.title.trim() || typeof page.component !== "function") {
      throw new Error("Invalid admin page definition")
    }
    const path = normalizeAdminPath(page.path)
    if (paths.has(path)) throw new Error(`Duplicate admin page path: ${path || "/"}`)
    paths.add(path)
  }
  return Object.freeze(pages.map((page) => Object.freeze(page)))
}

const definition: PluginDefinition<
  typeof adminOptionsSchema,
  PluginContribution & { readonly pages: readonly AdminPageDefinition[] },
  readonly [],
  Readonly<Record<never, never>>
> & { readonly id: "admin" } = {
  id: "admin",
  args: adminOptionsSchema,
  handler: ({ pages }) => ({
    auth: {
      serverPlugins: [
        betterAuthAdmin({ defaultRole: "user", adminRoles: ["admin"] }),
      ],
    },
    pages: composePages(pages),
  }),
}

export type AdminOptions = z.input<typeof adminOptionsSchema>

export function normalizeAdminPath(path: string): string {
  if (typeof path !== "string" || path.includes("\\") || path.includes("?") || path.includes("#")) {
    throw new Error(`Invalid admin page path: ${path}`)
  }
  let normalized = path
  while (normalized.startsWith("/")) normalized = normalized.slice(1)
  while (normalized.endsWith("/")) normalized = normalized.slice(0, -1)
  if (normalized !== "" && normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Invalid admin page path: ${path}`)
  }
  return normalized
}

export function resolveAdminPage(pages: readonly AdminPageDefinition[], path: string): AdminPageDefinition | undefined {
  const normalizedPath = normalizeAdminPath(path)
  return pages.find((page) => normalizeAdminPath(page.path) === normalizedPath)
}

const createAdminPlugin = plugin(definition)

export type AdminPluginOutput = ReturnType<typeof definition.handler>

export const admin = Object.assign((options: AdminOptions = {}) => {
  return createAdminPlugin(options)
}, { definition })
