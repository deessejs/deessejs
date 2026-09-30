/**
 * Resolve a registry slug to a `owner/repo` pair on GitHub.
 *
 * Server-side composition. The slug-parser itself lives in
 * `@workspace/contracts/src/shared/slug.ts` (`parseGitHubSlug`)
 * and is shared with the SDK — this file layers the editorial
 * catalogue on top.
 *
 * The four accepted inputs are:
 *
 *   1. Bare slug in the editorial catalogue
 *      → `saas-starter` → `deessejs/saas-template`
 *      The catalogue is an editorial convenience, NOT a whitelist.
 *      A bare slug NOT in the catalogue is still attempted as
 *      `owner/repo` by the shared parser.
 *
 *   2. `owner/repo` shorthand (e.g. `vercel/next.commerce`)
 *
 *   3. HTTPS GitHub URL (e.g. `https://github.com/deessejs/foo`)
 *
 *   4. SSH GitHub URL (e.g. `git@github.com:deessejs/foo.git`)
 *
 * The output is a discriminated union so the caller can distinguish
 * "we made it up from the catalogue" (which has richer metadata)
 * from "the consumer told us exactly where to look" (which only
 * has the `owner/repo` pair).
 *
 * Out of scope (deferred to V2):
 *   - GitLab / Bitbucket / other forges.
 *   - Tag/branch resolution from a slug (handled by GitHub raw itself).
 *   - Ref fallback (`main` vs `master`) (handled by the fetch step).
 */

import {
  parseGitHubSlug,
  type ResolvedRepo,
} from "@workspace/contracts/shared"

import { TEMPLATES, type RegistryEntry } from "../../templates.js"

/** `owner/repo` pair identifying a GitHub repository. */
export type { ResolvedRepo }

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
 * Resolve a slug. Returns the resolution or a structured error.
 *
 * The error is a data value (not a thrown exception) so the caller
 * can map it to the right HTTP status code (404 for `invalid_slug`,
 * 400 for `unsupported_host`). Throwing for validation failures
 * would couple this layer to a specific transport — keeping the
 * outcome as a discriminated union lets the route handler, the CLI,
 * and the tests all consume the same shape.
 *
 * Resolution order:
 *  1. Delegate the URL/SSH parsing to the shared `parseGitHubSlug`
 *     primitive. If the result is `ok`, we have a github-source
 *     resolution; return it. If it is `unsupported_host`, surface
 *     the typed error.
 *  2. If the shared parser returned `not_github`, fall back to the
 *     catalogue lookup. A bare slug that matches a TEMPLATES row
 *     yields `kind: "catalog"`. Otherwise, `invalid_slug`.
 *
 * The order is deliberate: a URL-shaped input is never also a
 * catalogue slug, so checking URL first is unambiguous.
 */
export const resolveSource = (
  slug: string,
):
  | { readonly ok: true; readonly source: ResolvedSource }
  | { readonly ok: false; readonly error: ResolveError } => {
  if (typeof slug !== "string" || slug.length === 0) {
    return { ok: false, error: { _tag: "invalid_slug", slug } }
  }
  const trimmed = slug.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: { _tag: "invalid_slug", slug } }
  }

  const gh = parseGitHubSlug(trimmed)
  if (gh.kind === "ok") {
    return {
      ok: true,
      source: { kind: "github", repo: gh.repo },
    }
  }
  if (gh.kind === "unsupported_host") {
    return {
      ok: false,
      error: { _tag: "unsupported_host", host: gh.host },
    }
  }
  // gh.kind === "not_github" → catalogue lookup territory.

  const catalogueMatch = TEMPLATES.find((t) => t.slug === trimmed)
  if (catalogueMatch !== undefined) {
    return { ok: true, source: { kind: "catalog", entry: catalogueMatch } }
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
  const gh = parseGitHubSlug(slug)
  return gh.kind === "ok" ? gh.repo : null
}