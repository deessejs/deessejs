// Where the account settings live, and where they used to live.
//
// The account settings moved from `/settings/*` to `/account/settings/*`
// so the top-level `/settings` prefix stays free for the organization
// settings that will live under `/[organization_slug]/settings/*`.
//
// The old paths keep working for the duration of the cutover: the
// proxy (apps/app/proxy.ts) redirects them to their new destination.
//
// This module is the single source of truth for the mapping. The proxy
// uses it to build the redirect, the navigation rail uses it to build
// its hrefs, and the tests assert against it. No other file may
// hardcode either prefix.

/** The prefix the account settings live under. */
export const SETTINGS_PREFIX = "/account/settings"

/** The prefix the account settings used to live under. */
export const LEGACY_SETTINGS_PREFIX = "/settings"

/**
 * Where the settings index lands. The hub page that used to sit at
 * `/settings` redirected to the Profile tab, so the legacy `/settings`
 * path maps to the same leaf rather than to a new one.
 */
export const SETTINGS_INDEX_PATH = `${SETTINGS_PREFIX}/profile`

/** The account settings leaves, in navigation order. */
export const SETTINGS_PATHS = {
  profile: `${SETTINGS_PREFIX}/profile`,
  sessions: `${SETTINGS_PREFIX}/sessions`,
  connections: `${SETTINGS_PREFIX}/connections`,
  account: `${SETTINGS_PREFIX}/account`,
  accountDelete: `${SETTINGS_PREFIX}/account/delete`,
} as const

/**
 * Maps a legacy `/settings...` path to its `/account/settings...`
 * destination, or returns null when the path is not a legacy one.
 *
 * `/settings` maps to the Profile tab, matching what the removed hub
 * page did. Every other legacy path keeps its suffix:
 * `/settings/account/delete` maps to `/account/settings/account/delete`.
 *
 * The comparison is segment-aware on purpose. A bare `startsWith` would
 * also claim `/settings-something`, which is a different path and must
 * not be redirected.
 */
export function legacySettingsDestination(pathname: string): string | null {
  if (pathname === LEGACY_SETTINGS_PREFIX) {
    return SETTINGS_INDEX_PATH
  }
  if (pathname.startsWith(`${LEGACY_SETTINGS_PREFIX}/`)) {
    return `${SETTINGS_PREFIX}${pathname.slice(LEGACY_SETTINGS_PREFIX.length)}`
  }
  return null
}
