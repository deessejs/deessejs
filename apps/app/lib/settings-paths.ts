// Where the account pages live.
//
// Account settings sit under `/account/settings/*` so the top-level
// `/settings` prefix stays free for organization settings under
// `/[organization_slug]/settings/*`. Other account routes, such as
// overview and support, live directly under `/account/*`.
//
// The settings routes have no alternate prefix or redirect. The app
// has no users yet, so there is no settings bookmark or inbound link
// to preserve, and keeping a compatibility path nobody has visited is
// only a second thing to keep correct.
//
// These constants are the single source of truth for account and
// settings paths. The proxy protects the account prefix, the navigation
// rail links to the routes, and pages link to each other.

/** The prefix all authenticated account routes live under. */
export const ACCOUNT_PREFIX = "/account"

/** Account pages that sit outside the settings section. */
export const ACCOUNT_PATHS = {
  invitations: `${ACCOUNT_PREFIX}/invites`,
  support: `${ACCOUNT_PREFIX}/support`,
} as const

/** The account overview page. */
export const ACCOUNT_OVERVIEW_PATH = `${ACCOUNT_PREFIX}/overview`

/** The prefix the account settings live under. */
export const SETTINGS_PREFIX = `${ACCOUNT_PREFIX}/settings`

/** The account settings leaves, in navigation order. */
export const SETTINGS_PATHS = {
  profile: `${SETTINGS_PREFIX}/profile`,
  sessions: `${SETTINGS_PREFIX}/sessions`,
  connections: `${SETTINGS_PREFIX}/connections`,
  account: `${SETTINGS_PREFIX}/account`,
  accountDelete: `${SETTINGS_PREFIX}/account/delete`,
} as const
