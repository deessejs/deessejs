// Where account-level routes live.
//
// Account settings sit under `/account/settings/*` so the top-level
// `/settings` prefix stays free for organization settings under
// `/[organization_slug]/settings/*`. Other account routes, such as
// support, live under `/account/*` without pretending to be settings.
//
// The settings routes have no alternate prefix or redirect. The app
// has no users yet, so there is no bookmark or inbound link to preserve,
// and keeping a compatibility path nobody has ever visited is only a
// second thing to keep correct.
//
// These constants are the single source of truth for account and
// settings paths. The proxy protects the account prefix, the navigation
// rail links to the routes, and pages link to each other.

/** The prefix all authenticated account routes live under. */
export const ACCOUNT_PREFIX = "/account"

/** The prefix the account settings live under. */
export const SETTINGS_PREFIX = `${ACCOUNT_PREFIX}/settings`

/** Account routes that do not belong to the settings area. */
export const ACCOUNT_PATHS = {
  support: `${ACCOUNT_PREFIX}/support`,
} as const

/** The account settings leaves, in navigation order. */
export const SETTINGS_PATHS = {
  profile: `${SETTINGS_PREFIX}/profile`,
  sessions: `${SETTINGS_PREFIX}/sessions`,
  connections: `${SETTINGS_PREFIX}/connections`,
  account: `${SETTINGS_PREFIX}/account`,
  accountDelete: `${SETTINGS_PREFIX}/account/delete`,
} as const
