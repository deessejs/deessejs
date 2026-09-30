/**
 * Resolve a registry slug to a `owner/repo` pair on GitHub.
 *
 * The slug is whatever the consumer passed to `deessejs init`, `info`,
 * or `getTemplate`. Accepted forms:
 *
 *   1. Bare slug in the editorial catalogue
 *      → `saas-starter` → `deessejs/saas-template`
 *      Resolved by looking up the entry in `TEMPLATES`. The catalogue
 *      is an editorial convenience, NOT a whitelist. A bare slug NOT in
 *      the catalogue is still attempted as `owner/repo` if it parses
 *      that way, otherwise rejected with `invalid_slug`.
 *
 *   2. Owner/repo shorthand
 *      → `vercel/next.commerce` → `vercel/next.commerce`
 *      Validated against a permissive `OWNER_REPO_RE` (alphanumeric,
 *      dash, underscore, dot; no slash or whitespace).
 *
 *   3. HTTPS GitHub URL
 *      → `https://github.com/<owner>/<repo>` → `owner/repo`
 *      `.git` suffix is stripped. Other hosts are rejected — only
 *      github.com is a V1 source.
 *
 *   4. SSH GitHub URL
 *      → `git@github.com:<owner>/<repo>.git` → `owner/repo`
 *      The SCP-like form used in `git clone`.
 *
 * The output is a discriminated union so the caller can distinguish
 * "we made it up from the catalogue" (which has richer metadata)
 * from "the consumer told us exactly where to look".
 *
 * Why this shape: the registry's whole point is to let any GitHub
 * repo that ships a `deesse-template.json` be installable. The
 * catalogue exists to give short names to the curated set; it must
 * NOT be a gatekeeper. Three concrete consequences:
 *
 *   - A user typing `deessejs init vercel/next.commerce` works
 *     without any prior server-side registration.
 *   - A user typing `deessejs init saas-starter` resolves to the
 *     curated repo but still goes through the same GitHub fetch
 *     path, so the descriptor is the source of truth either way.
 *   - A user typing a malformed slug (`saas starter`, `foo/bar/baz`,
 *     `https://gitlab.com/...`) gets a structured error that maps to
 *     a precise HTTP status (404 vs 400) — never a silent default.
 *
 * Out of scope (deferred to V2):
 *   - GitLab / Bitbucket / other forges.
 *   - Tag/branch resolution from a slug (handled by GitHub raw itself).
 *   - Ref fallback (`main` vs `master`) (handled by the fetch step).
 *   - Short alias registry (e.g. `@vercel/next`) — namespace lookup
 *     lives in `deesse.json#registries` (RFC-001), not here.
 */

import { TEMPLATES, type RegistryEntry } from "../../templates.js"

/** `owner/repo` pair identifying a GitHub repository. */
export type ResolvedRepo = {
  readonly owner: string
  readonly repo: string
}

/**
 * Resolution outcome. Either we know the entry's full editorial
 * metadata (came from the catalogue), or we just have the
 * owner/repo pair (caller-supplied via shorthand or URL).
 *
 * The two kinds are distinct because the catalogue carries extra
 * fields (description, layer, etc.) that the wire shape may want
 * to surface, while a github-source slug has nothing but the
 * refpair — title is extracted from the descriptor, not from the
 * catalogue.
 */
export type ResolvedSource =
  | { readonly kind: "catalog"; readonly entry: RegistryEntry }
  | { readonly kind: "github"; readonly repo: ResolvedRepo }

/**
 * Reason a slug could not be resolved. Each maps to a distinct
 * user-facing error message and HTTP status:
 *
 *   - `invalid_slug` → 404. The slug is well-formed but doesn't
 *     match any of the four accepted shapes (catalogue entry,
 *     owner/repo, github URL, ssh URL).
 *   - `unsupported_host` → 400. The slug is a URL but on a host
 *     we don't accept (GitLab, Bitbucket, etc.). V2 will widen this.
 */
export type ResolveError =
  | { readonly _tag: "invalid_slug"; readonly slug: string }
  | { readonly _tag: "unsupported_host"; readonly host: string }

/**
 * GitHub repo shorthand (`owner/repo`) validation. Permissive enough
 * to accept `next.commerce`, `landing-template`, `my_repo.js`, but
 * strict enough to reject `foo/bar/baz` (3 segments) and trailing
 * slashes. The full RFC 3982 grammar is overkill here — the server
 * will hit GitHub next and any malformed name will fail at the fetch
 * step with a clearer 404.
 *
 * Rules:
 *   - Owner: `[a-z0-9]` start, `[a-z0-9._-]` body, `[a-z0-9]` end,
 *     length 1–40. Matches GitHub's username rules without the
 *     hyphen-edge-case (we accept hyphens at either edge; GitHub
 *     rejects leading single hyphens — accepted limitation for V1).
 *   - Repo: `[a-z0-9._-]`, length 2–101. Matches GitHub's repo
 *     name rules without the dot-edge-case (a repo named `.` is
 *     malformed by GitHub, but the heuristic catches the common
 *     cases).
 *   - Case-insensitive (the `i` flag) — GitHub is case-insensitive
 *     at the URL level.
 */
const OWNER_REPO_RE = /^[a-z0-9](?:[a-z0-9._-]{0,38}[a-z0-9])?\/[a-z0-9._-]{1,100}$/i

/**
 * Normalize a GitHub HTTPS URL to its `owner/repo` pair.
 *
 * Accepts:
 *   - `https://github.com/<owner>/<repo>`
 *   - `https://github.com/<owner>/<repo>.git`
 *   - with optional `/tree/<ref>` or `/blob/<ref>/<path>` suffix
 *
 * Returns `null` when the URL is not a GitHub URL or doesn't match.
 *
 * Why we strip `.git`: GitHub web URLs don't carry it, but the CLI
 * is often given the URL printed by `git remote -v`, which DOES
 * carry it. We accept both forms; the canonical wire shape strips it.
 *
 * Why we ignore path segments beyond `/blob/...`: the descriptor
 * fetch goes to `raw.githubusercontent.com/<owner>/<repo>/<ref>/`,
 * not the blob path. The blob path is useful for humans browsing
 * GitHub but irrelevant for the resolver.
 */
const parseGithubHttpsUrl = (url: string): ResolvedRepo | null => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== "https:") return null
  if (parsed.host !== "github.com") return null

  // pathname is "/<owner>/<repo>[.git][/tree|/blob/...]"
  const segments = parsed.pathname.split("/").filter((s) => s.length > 0)
  if (segments.length < 2) return null

  const rawOwner = segments[0]
  const rawRepo = (segments[1] ?? "").replace(/\.git$/i, "")
  if (rawOwner === undefined || rawRepo === "") return null

  return { owner: rawOwner, repo: rawRepo }
}

/**
 * Normalize a GitHub SSH URL to its `owner/repo` pair.
 *
 * Accepts both forms GitHub prints:
 *   - SCP-like: `git@github.com:owner/repo.git` (the clone button)
 *   - URI:      `ssh://git@github.com/owner/repo.git` (some clients)
 *
 * For both, the host must be `github.com`, the user (when present)
 * is ignored, and a trailing `.git` is stripped.
 */
const parseGithubSshUrl = (url: string): ResolvedRepo | null => {
  // Strip an optional `ssh://` scheme and optional leading user.
  // Both forms end up as `github.com[:|/]<owner>/<repo>[.git]`.
  const normalized = url.replace(/^ssh:\/\//i, "").replace(/^[^@\s]+@/, "")
  const match = /^github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i.exec(
    normalized,
  )
  if (match === null) return null
  const owner = match[1]
  const repo = match[2]
  if (owner === undefined || repo === undefined) return null
  return { owner, repo }
}

/**
 * Resolve a slug. Returns the resolution or a structured error.
 *
 * The error is a data value (not a thrown exception) so the caller
 * can map it to the right HTTP status code (404 for `invalid_slug`,
 * 400 for `unsupported_host`). Throwing for validation failures
 * would couple this layer to a specific transport — keeping the
 * outcome as a discriminated union lets the route handler, the CLI,
 * and the tests all consume the same shape.
 *
 * Resolution order (matters for ambiguous inputs):
 *   1. `https?://...` → parse as GitHub URL (or return `unsupported_host`).
 *   2. `git@...` / `ssh://...` → parse as SSH URL.
 *   3. Bare string → catalogue lookup, then `owner/repo` shorthand.
 *
 * The order is deliberate: a URL-shaped input is never also a
 * catalogue slug, so checking URL first is unambiguous.
 */
export const resolveSource = (
  slug: string,
): { readonly ok: true; readonly source: ResolvedSource } | { readonly ok: false; readonly error: ResolveError } => {
  if (typeof slug !== "string" || slug.length === 0) {
    return { ok: false, error: { _tag: "invalid_slug", slug } }
  }
  const trimmed = slug.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: { _tag: "invalid_slug", slug } }
  }

  // 1. HTTPS GitHub URL
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    const parsed = parseGithubHttpsUrl(trimmed)
    if (parsed === null) {
      // Could be a non-github HTTPS URL (gitlab, bitbucket, ...)
      // or a malformed URL. Distinguish by trying to parse the host.
      let host = ""
      try {
        host = new URL(trimmed).host
      } catch {
        host = ""
      }
      if (host !== "" && host !== "github.com") {
        return {
          ok: false,
          error: { _tag: "unsupported_host", host },
        }
      }
      return { ok: false, error: { _tag: "invalid_slug", slug } }
    }
    return { ok: true, source: { kind: "github", repo: parsed } }
  }

  // 2. SSH GitHub URL
  if (trimmed.startsWith("git@") || trimmed.startsWith("ssh://")) {
    const parsed = parseGithubSshUrl(trimmed)
    if (parsed === null) {
      return { ok: false, error: { _tag: "invalid_slug", slug } }
    }
    return { ok: true, source: { kind: "github", repo: parsed } }
  }

  // 3. Bare slug — first try the editorial catalogue, then fall
  //    through to owner/repo shorthand.
  const catalogueMatch = TEMPLATES.find((t) => t.slug === trimmed)
  if (catalogueMatch !== undefined) {
    return { ok: true, source: { kind: "catalog", entry: catalogueMatch } }
  }

  // 4. Owner/repo shorthand
  if (OWNER_REPO_RE.test(trimmed)) {
    const slashIndex = trimmed.indexOf("/")
    const owner = trimmed.slice(0, slashIndex)
    const repo = trimmed.slice(slashIndex + 1)
    return {
      ok: true,
      source: { kind: "github", repo: { owner, repo } },
    }
  }

  return { ok: false, error: { _tag: "invalid_slug", slug } }
}

/**
 * Pure helper for testing: parse `owner/repo` shorthand without
 * consulting the catalogue. Used by the unit tests to assert the
 * regex behaviour in isolation from the catalogue.
 *
 * Returns `null` for any input that doesn't match the regex —
 * including inputs the full `resolveSource` would accept via
 * catalogue lookup. This helper is intentionally narrow.
 */
export const parseOwnerRepo = (slug: string): ResolvedRepo | null => {
  if (!OWNER_REPO_RE.test(slug)) return null
  const slashIndex = slug.indexOf("/")
  return { owner: slug.slice(0, slashIndex), repo: slug.slice(slashIndex + 1) }
}