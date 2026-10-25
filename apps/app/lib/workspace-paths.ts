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
 * The path of the empty state.
 *
 * A caller with no organization, or with a selection that is no
 * longer valid, lands here. It is a top-level segment, so the
 * reserved slug set holds it: an organization cannot take it and
 * shadow the page.
 */
export const NO_ORGANIZATION_PATH = "/no-organization"

/** The root of the workspace, for the organization with this slug. */
export const workspacePath = (slug: string): string => `/${slug}`

/** The workspace home, for the organization with this slug. */
export const workspaceHomePath = (slug: string): string => `/${slug}/home`
