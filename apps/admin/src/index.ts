import { admin as betterAuthAdmin } from "better-auth/plugins"
import type { ComponentType } from "react"
import { plugin, type NoArgsRegistration, type PluginContribution } from "deesse"
import { AdminOverview } from "./overview.js"

export type AdminPageAccess = "allow" | "unauthenticated" | "forbidden"

export type AdminPageContext = {
  readonly user: { readonly id: string; readonly email: string; readonly [key: string]: unknown }
  readonly session: object
  readonly request: Request
  readonly params: Readonly<Record<string, string | string[]>>
}

export type AdminPageDefinition = {
  path: string
  title: string
  component: ComponentType
  group?: string
  order?: number
  authorize?: (context: AdminPageContext) => AdminPageAccess | Promise<AdminPageAccess>
}

export function adminPage<TPage extends AdminPageDefinition>(page: TPage): TPage {
  return page
}

const definition: { id: "admin"; handler: () => PluginContribution } = {
  id: "admin",
  handler: () => ({ auth: { serverPlugins: [betterAuthAdmin()] } }),
} as const

export type AdminPlugin = NoArgsRegistration<typeof definition>

export type AdminConfig = {
  readonly plugin: AdminPlugin
  readonly pages: readonly AdminPageDefinition[]
}

export type AdminOptions = {
  pages?: readonly AdminPageDefinition[]
}

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

export function resolveAdminPage(config: AdminConfig, path: string): AdminPageDefinition | undefined {
  const normalizedPath = normalizeAdminPath(path)
  return config.pages.find((page) => normalizeAdminPath(page.path) === normalizedPath)
}

export function admin(options: AdminOptions = {}): AdminConfig {
  const pages = [
    adminPage({ path: "", title: "Overview", component: AdminOverview }),
    ...(options.pages ?? []).map((page) => adminPage({ ...page, path: normalizeAdminPath(page.path) })),
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
  return { plugin: plugin(definition)(), pages }
}
