// Where the account settings live.
//
// The account settings sit under `/account/settings/*` so the top-level
// `/settings` prefix stays free for the organization settings that
// will live under `/[organization_slug]/settings/*`.
//
// There is no second prefix and no redirect for an older one. The app
// has no users yet, so there is no bookmark, saved link or inbound
// link to preserve, and keeping a compatibility path for a route
// nobody has ever visited is only a second thing to keep correct.
//
// This module is the single source of truth for these paths. The proxy
// protects them, the navigation rail links to them, and the pages
// link to each other. No other file may hardcode one.

/** The prefix the account settings live under. */
export const SETTINGS_PREFIX = "/account/settings"

/** The account settings leaves, in navigation order. */
export const SETTINGS_PATHS = {
  profile: `${SETTINGS_PREFIX}/profile`,
  sessions: `${SETTINGS_PREFIX}/sessions`,
  connections: `${SETTINGS_PREFIX}/connections`,
  account: `${SETTINGS_PREFIX}/account`,
  accountDelete: `${SETTINGS_PREFIX}/account/delete`,
} as const
