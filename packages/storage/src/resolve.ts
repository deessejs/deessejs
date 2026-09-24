/**
 * URL builders and ref parsers.
 *
 * The URL convention is **load-bearing** for caching (ADR-036 §3).
 * Every ref-pinned descriptor URL is immutable-by-construction. The
 * `latest` ref is a 302 redirect handled server-side, never resolved
 * client-side.
 *
 * URL shape (V1):
 *
 *   GET {BASE}/registry.json                  catalogue
 *   GET {BASE}/r/{slug}@{ref}.json            immutable-by-ref
 *   GET {BASE}/r/{slug}/latest.json           302 to /r/{slug}@{ref}.json
 *
 * Where `{slug}` is the registry-unique kebab-case identifier and
 * `{ref}` is a semver tag, branch, SHA, or the magic string `latest`.
 *
 * The default base is `https://registry.deessejs.com`. Authenticated
 * providers (V2) substitute a custom base URL via the provider's
 * constructor.
 */

export const DEFAULT_BASE = "https://registry.deessejs.com" as const

/** A version reference: `latest`, a semver tag (`v1.2.3`), a branch name (`main`), or a 7-40 char SHA. */
export type Ref =
  | { kind: "latest" }
  | { kind: "tag"; tag: string }
  | { kind: "branch"; branch: string }
  | { kind: "sha"; sha: string }

/**
 * The registry-internal magic string for "current stable". Resolved
 * server-side; clients never compute it.
 */
export const LATEST = "latest" as const

/**
 * Parse a ref string into a typed form. Returns the typed discriminated
 * union; throws on malformed refs (so callers see a clear error at
 * pass-in rather than at fetch time).
 *
 * Acceptance rules (matching the {@link shared/refs.ts} GIT_REF regex):
 *  - `"latest"`  → `{ kind: "latest" }`
 *  - `v<N>.<N>.<N>[-prerelease]`  → `{ kind: "tag", tag }`
 *  - `N.N.N`  → `{ kind: "tag", tag: "v" + raw }` (allow non-prefixed)
 *  - `[A-Za-z0-9._/-]+`  → `{ kind: "branch" }`
 *  - `[0-9a-f]{7,40}`  → `{ kind: "sha" }`
 */
export function parseRef(input: string): Ref {
  if (input === LATEST) return { kind: "latest" }

  // Semver tag with or without `v` prefix
  const tagMatch = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.exec(
    input,
  )
  if (tagMatch) {
    return {
      kind: "tag",
      tag: input.startsWith("v") ? input : `v${input}`,
    }
  }

  // SHA-1 (7-40 hex chars)
  if (/^[0-9a-f]{7,40}$/.test(input)) {
    return { kind: "sha", sha: input }
  }

  // Branch name (anything else; HEAD is also a branch)
  if (/^[A-Za-z0-9._/-]+$/.test(input) && input.length > 0 && input.length <= 200) {
    return { kind: "branch", branch: input }
  }

  throw new Error(
    `Invalid ref '${input}' — expected 'latest', a semver tag (v1.2.3), a branch name, or a SHA-1 (7-40 hex chars)`,
  )
}

/**
 * Stringify a {@link Ref} back to its wire form (what goes in the URL).
 */
export function refToString(ref: Ref): string {
  switch (ref.kind) {
    case "latest":
      return LATEST
    case "tag":
      return ref.tag
    case "branch":
      return ref.branch
    case "sha":
      return ref.sha
  }
}

/** Catalogue URL. */
export function catalogueUrl(base = DEFAULT_BASE): string {
  return `${base}/registry.json`
}

/**
 * Item URL. The `ref` parameter is a string for transport reasons
 * (callers usually have it as a string from CLI args), but it is
 * parsed to enforce the no-malformed-refs invariant.
 */
export function itemUrl(
  base: string,
  slug: string,
  refInput: string,
): string {
  // parseRef throws on bad input. We let it propagate; the caller
  // already wraps it in a typed error context.
  parseRef(refInput)
  return `${base}/r/${encodeURIComponent(slug)}@${encodeURIComponent(refInput)}.json`
}

/**
 * `latest` redirector URL. Server-side 302; clients should not compute
 * the underlying tag here.
 */
export function latestUrl(base: string, slug: string): string {
  return `${base}/r/${encodeURIComponent(slug)}/${LATEST}.json`
}
