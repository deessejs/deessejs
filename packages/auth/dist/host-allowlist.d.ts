/**
 * Host allowlist — single source of truth for "which hosts does this
 * deployment trust?".
 *
 * ADR-029 Decision #2 makes this the shared module between
 * `packages/auth/src/auth.ts` (Better Auth `baseURL.allowedHosts`) and
 * `packages/api/src/index.ts` (Hono CORS `origin` function). The
 * apex+wildcards shape is load-bearing: Better Auth's `allowedHosts`
 * pattern table (`docs/reference/options`) does NOT let `*.vercel.app`
 * match the apex `vercel.app` itself, so the apex entry is listed
 * explicitly. Trimming the apex reintroduces the
 * "Fixed baseURL breaks Vercel preview deployments" bug that
 * `docs/guides/better-auth/pitfalls.md` §5 exists to prevent.
 *
 * Localhost entries are gated on `NODE_ENV === "development"` to keep
 * the prod allowlist minimal — matches the same hazard pitfalls.md §2
 * warns about for `trustedOrigins`.
 */
export declare const HOST_ALLOWLIST: readonly ["deessejs.com", "*.deessejs.com", "*.vercel.app", "localhost:*"] | readonly ["deessejs.com", "*.deessejs.com", "*.vercel.app", ...never[]];
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
export declare function isHostAllowed(host: string): boolean;
//# sourceMappingURL=host-allowlist.d.ts.map