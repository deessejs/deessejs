/**
 * Host allowlist — single source of truth for "which hosts does this
 * deployment trust?".
 *
 * ADR-029 Decision #2 makes this the shared module between
 * `packages/auth/src/auth.ts` (Better Auth `baseURL.allowedHosts`) and
 * `packages/api/src/index.ts` (Hono CORS `origin` function). The
 * apex+wildcards shape is load-bearing: Better Auth's `allowedHosts`
 * pattern table does NOT let `*.vercel.app` match the apex `vercel.app`
 * itself, so the apex entry is listed explicitly. Trimming the apex
 * reintroduces the "Fixed baseURL breaks Vercel preview deployments"
 * bug — see apps/internal-documentation/content/docs/decisions/ADR-029-preview-url-wiring.mdx
 * and https://better-auth.com/docs/guides/dynamic-base-url.
 *
 * Localhost entries are gated on `NODE_ENV === "development"` to keep
 * the prod allowlist minimal — matches the same hazard for
 * `trustedOrigins` in `packages/auth/src/auth.ts`.
 */

const PRODUCTION_HOSTS = [
  "deessejs.com",
  "*.deessejs.com",
  "*.vercel.app",
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