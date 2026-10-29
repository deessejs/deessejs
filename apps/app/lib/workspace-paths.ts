// Where the workspace lives.
//
// The workspace is `/[organization_slug]/*`: the URL says which
// organization the page belongs to, and the server resolves the slug
// through the API before it renders anything. The slug is the
// server's, so a page under this tree always names an organization
// that exists.
//
// This module is the single source of truth for these paths, the way
// `settings-paths.ts` is for the account settings. No other file may
// hardcode one.

/**
 * The path of the organizations page.
 *
 * The page lists the organizations the caller belongs to. A caller
 * with no organization, or with a selection that is no longer valid,
 * lands here. It is a top-level segment, so the reserved slug set
 * holds it: an organization cannot take it and shadow the page.
 */
export const ORGANIZATIONS_PATH = "/organizations"

/** The root of the workspace, for the organization with this slug. */
export const workspacePath = (slug: string): string => `/${slug}`

/** The workspace home, for the organization with this slug. */
export const workspaceHomePath = (slug: string): string => `/${slug}/home`

/** The organization's private template library. */
export const workspaceTemplatesPath = (slug: string): string =>
  `/${slug}/templates`

/** The organization's imported projects. */
export const workspaceProjectsPath = (slug: string): string =>
  `/${slug}/projects`

/** The home page for an imported project in the organization. */
export const workspaceProjectHomePath = (
  slug: string,
  projectId: string
): string => `${workspaceProjectsPath(slug)}/${projectId}/home`

/** The project named by a project-scoped workspace route, if any. */
export const workspaceProjectFromPathname = (
  pathname: string
): { organizationSlug: string; projectId: string } | null => {
  const [organizationSlug, section, projectId] = pathname
    .split("/")
    .filter(Boolean)

  if (
    !organizationSlug ||
    section !== "projects" ||
    !projectId ||
    projectId === "import"
  ) {
    return null
  }

  return { organizationSlug, projectId }
}

/** The GitHub project import flow for the organization. */
export const workspaceProjectImportPath = (slug: string): string =>
  `${workspaceProjectsPath(slug)}/import`

/** The organization's own settings, for the organization with this slug. */
export const workspaceSettingsPath = (slug: string): string =>
  `/${slug}/settings`

/** The organization's general page, for the organization with this slug. */
export const workspaceOrganizationSettingsPath = (slug: string): string =>
  `/${slug}/settings/organization`

/**
 * The organization's slug in a workspace path, or null when the path
 * names none.
 *
 * A workspace path is always `/{slug}/...`: the route group is
 * transparent and the dynamic segment is the first one under it, so
 * the first segment of the pathname is the slug. The shell reads it
 * there, because the layout that mounts the shell sits above the
 * segment and never sees it.
 */
export const organizationSlugFromPathname = (
  pathname: string
): string | null => {
  const segment = pathname.split("/")[1] ?? ""
  return segment.length > 0 ? segment : null
}
