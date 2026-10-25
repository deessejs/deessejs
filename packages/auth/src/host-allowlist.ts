/**
 * Shared host allowlist for Better Auth dynamic base URLs and the API's
 * credentialed CORS middleware. Better Auth adds every allowed host to
 * trusted origins, so Vercel preview hosts are limited to project aliases
 * in our Vercel team. Do not replace these patterns with *.vercel.app.
 *
 * The team scope appears twice because the organisation was renamed. A
 * preview deployed today ends in `-deessejs.vercel.app`; the ones
 * deployed before the rename still end in
 * `-aliiibenns-projects.vercel.app`, and a long-lived preview branch
 * keeps the old suffix. Both are listed, scoped per project so that no
 * other Vercel deployment can make a credentialed cross-origin call to
 * the API.
 *
 * Localhost entries are available only in development.
 */

const PRODUCTION_HOSTS = [
  "deessejs.com",
  "*.deessejs.com",
  "deessejs-app-*-deessejs.vercel.app",
  "deessejs-web-*-deessejs.vercel.app",
  "deessejs-docs-*-deessejs.vercel.app",
  "deessejs-agent-*-deessejs.vercel.app",
  "deessejs-app-*-aliiibenns-projects.vercel.app",
  "deessejs-web-*-aliiibenns-projects.vercel.app",
  "deessejs-docs-*-aliiibenns-projects.vercel.app",
  "deessejs-agent-*-aliiibenns-projects.vercel.app",
] as const

const DEV_HOSTS = [
  "localhost:*",
] as const

export const HOST_ALLOWLIST = [
  ...PRODUCTION_HOSTS,
  ...(process.env.NODE_ENV === "development" ? DEV_HOSTS : []),
] as const

/**
 * Match a request host against the allowlist. Returns `true` when the
 * host is permitted, `false` otherwise. Used by both Better Auth's
 * `baseURL.allowedHosts` and the Hono CORS `origin` function form so
 * the two layers share one decision function (and one test surface).
 *
 * Pattern semantics (Better Auth pattern table):
 *   - `?` matches exactly one character (not `/`)
 *   - `*` matches zero or more characters (not `/`)
 *   - `**` matches zero or more characters (including `/`)
 *
 * The apex is matched separately from the wildcard for each public
 * domain; localhost uses `*` to cover any port (dev tooling, the CLI,
 * apps running on non-default ports all resolve without per-port
 * edits).
 */
export function isHostAllowed(host: string): boolean {
  const [hostname] = host.split(":")
  if (!hostname) return false

  for (const pattern of HOST_ALLOWLIST) {
    if (matchHost(pattern, hostname)) return true
  }
  return false
}

function matchHost(pattern: string, hostname: string): boolean {
  if (pattern === hostname) return true
  if (!pattern.includes("*")) return false

  // Translate the pattern into a regex.
  // `*` matches any run of non-`/` chars; `?` matches one; `.` is literal.
  const regexSource = pattern
    .split("")
    .map((ch) => {
      if (ch === "*") return "[^.]*"
      if (ch === "?") return "[^.]"
      return ch.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    })
    .join("")
  const regex = new RegExp(`^${regexSource}$`)
  return regex.test(hostname)
}