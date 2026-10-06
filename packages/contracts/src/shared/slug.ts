/**
 * Parse a registry slug into its `owner/repo` form.
 *
 * The DeesseJS CLI accepts four shapes for `<slug>`:
 *
 *   1. Bare slug in the editorial catalogue (e.g. `saas-starter`)
 *      → `kind: "not_github"`; the caller falls back to the catalogue
 *        lookup. This helper does NOT consult the catalogue — it is
 *        a pure function over strings.
 *   2. `owner/repo` shorthand (e.g. `vercel/next.commerce`)
 *      → `kind: "ok"` with the pair
 *   3. HTTPS GitHub URL (with optional `.git`, `/tree/<ref>`, or
 *      `/blob/...` suffix)
 *      → `kind: "ok"` with the pair
 *   4. SSH GitHub URL (`git@github.com:owner/repo.git` or
 *      `ssh://git@github.com/owner/repo.git`)
 *      → `kind: "ok"` with the pair
 *
 * Non-GitHub HTTPS URLs (gitlab.com, bitbucket.org, …) return
 * `kind: "unsupported_host"` so the caller can surface a typed
 * error instead of guessing the user's intent.
 *
 * ## Why this lives in `@workspace/contracts`
 *
 * The slug parser is a primitive shared between:
 *   - `@workspace/registry-client` (SDK routing by slug shape)
 *   - `@workspace/api` (server-side `resolveSource` composition)
 *
 * Putting it in `contracts/src/shared/` alongside `REPO_SLUG`,
 * `GIT_REF`, and the other enums keeps a single source of truth
 * for "what counts as a GitHub-shaped slug" and ensures the
 * server and the SDK cannot drift on the regex. `contracts`
 * already has zero runtime deps beyond `zod`; the parser is a
 * pure function so it adds none.
 *
 * @see ADR-XXX-direct-github-fallback for the routing design.
 * @see RFC-006 §"Slug resolution" for the CLI surface.
 */

/** `owner/repo` pair identifying a GitHub repository. */
export type ResolvedRepo = {
  readonly owner: string
  readonly repo: string
}

/**
 * Outcome of `parseGitHubSlug`.
 *
 * Three discriminants:
 *   - `ok` — the input is a valid GitHub reference; `repo` is the pair.
 *   - `unsupported_host` — the input is an HTTPS URL on a non-GitHub
 *     host (gitlab.com, bitbucket.org, etc.). The caller should map
 *     this to `RegistryUnsupportedSource` with `source: "unsupported_host:<host>"`.
 *   - `not_github` — the input is not a recognised GitHub reference.
 *     The caller may consult its slug catalogue (server) or treat it
 *     as a parse error (CLI).
 */
export type GitHubSlugResult =
  | { readonly kind: "ok"; readonly repo: ResolvedRepo }
  | { readonly kind: "unsupported_host"; readonly host: string }
  | { readonly kind: "not_github" }

/**
 * GitHub repo shorthand (`owner/repo`) validation. Permissive enough
 * to accept `next.commerce`, `landing-template`, `my_repo.js`, but
 * strict enough to reject `foo/bar/baz` (3 segments), trailing
 * slashes, and lengths outside GitHub's published limits.
 *
 * Rules (mirrors GitHub's published username/repo rules):
 *   - Owner: `[A-Za-z0-9]` start/end, `[A-Za-z0-9._-]` body, 1–39 chars.
 *     GitHub accepts hyphens at either end. We accept leading/trailing
 *     hyphens; GitHub rejects a single leading hyphen as a username
 *     — accepted limitation for V1 (rare in real repo paths).
 *   - Repo: `[A-Za-z0-9._-]`, 1–100 chars. GitHub rejects names
 *     starting with `.`; we accept them here because the GitHub API
 *     is the next gate and will surface a cleaner error than our
 *     heuristic could.
 *   - Case-insensitive at the regex level; the caller preserves the
 *     original case in the returned pair.
 */
const OWNER_REPO_RE =
  /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/

/**
 * Normalize a GitHub HTTPS URL to its `owner/repo` pair.
 *
 * Accepts:
 *   - `https://github.com/<owner>/<repo>`
 *   - `https://github.com/<owner>/<repo>.git`
 *   - with optional `/tree/<ref>` or `/blob/<ref>/<path>` suffix
 *
 * Returns `null` when the URL is not a GitHub URL or doesn't match
 * the expected segment count.
 *
 * Why we strip `.git`: GitHub web URLs don't carry it, but the CLI is
 * often given the URL printed by `git remote -v`, which DOES carry it.
 * We accept both forms; the canonical wire shape strips it.
 *
 * Why we ignore path segments beyond `owner/repo`: the descriptor
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
  // Strip an optional `ssh://` scheme and optional leading user
  // (just the leading `[user]@`, not any `@` that may appear in
  // owner/repo names — there shouldn't be any, but the regex is
  // anchored to the start).
  const normalized = url
    .replace(/^ssh:\/\//i, "")
    .replace(/^[^@\s/]+@/, "")
  // Two anchored forms, slash or colon separator. `[^\s/]+`
  // (anchored) bounds backtracking so the regex is linear-time on
  // any input length.
  const slashMatch =
    /^github\.com\/([^\s/]+)\/([^\s/]+?)(?:\.git)?$/i.exec(normalized)
  if (slashMatch !== null) {
    return { owner: slashMatch[1] ?? "", repo: slashMatch[2] ?? "" }
  }
  const colonMatch =
    /^github\.com:([^\s/]+)\/([^\s/]+?)(?:\.git)?$/i.exec(normalized)
  if (colonMatch !== null) {
    return { owner: colonMatch[1] ?? "", repo: colonMatch[2] ?? "" }
  }
  return null
}

/**
 * Parse a registry slug into its `owner/repo` form.
 *
 * Pure function. Trims the input. Returns a discriminated union;
 * never throws.
 *
 * Resolution order (matters for inputs that match more than one shape):
 *
 *   1. `https://...` → parse as GitHub URL. If the URL is well-formed
 *      but on a non-GitHub host, return `unsupported_host` so the
 *      caller can distinguish "definitely wrong host" from "ambiguous
 *      input". If the URL is malformed or on GitHub but missing the
 *      repo segment, fall through to `not_github`.
 *   2. `git@...` / `ssh://...` → parse as SSH URL.
 *   3. Bare `owner/repo` matching `OWNER_REPO_RE` → `ok`.
 *   4. Anything else → `not_github`. The caller may consult a slug
 *      catalogue (server) or surface an error (CLI).
 */
export const parseGitHubSlug = (slug: string): GitHubSlugResult => {
  if (typeof slug !== "string") return { kind: "not_github" }
  const trimmed = slug.trim()
  if (trimmed.length === 0) return { kind: "not_github" }

  // 1. HTTPS GitHub URL
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    const parsed = parseGithubHttpsUrl(trimmed)
    if (parsed !== null) return { kind: "ok", repo: parsed }
    // Non-github host? Distinguish by trying to parse the host.
    let host = ""
    try {
      host = new URL(trimmed).host
    } catch {
      host = ""
    }
    if (host !== "" && host !== "github.com") {
      return { kind: "unsupported_host", host }
    }
    return { kind: "not_github" }
  }

  // 2. SSH GitHub URL. Detected by either:
  //    - the canonical `git@github.com:` or `ssh://` prefix, OR
  //    - a generic `[user]@github.com:` form (deploy keys, custom
  //      users, CI tokens). We delegate to `parseGithubSshUrl`
  //    which strips the leading user before regex matching.
  if (
    trimmed.startsWith("git@") ||
    trimmed.startsWith("ssh://") ||
    trimmed.includes("@github.com")
  ) {
    const parsed = parseGithubSshUrl(trimmed)
    if (parsed !== null) return { kind: "ok", repo: parsed }
    return { kind: "not_github" }
  }

  // 3. Owner/repo shorthand (case-insensitive at the URL level,
  //    case-preserving on the returned pair)
  if (OWNER_REPO_RE.test(trimmed)) {
    const slashIndex = trimmed.indexOf("/")
    return {
      kind: "ok",
      repo: {
        owner: trimmed.slice(0, slashIndex),
        repo: trimmed.slice(slashIndex + 1),
      },
    }
  }

  // 4. Bare slug that isn't a URL or shorthand → catalogue lookup
  //    territory. The caller decides what to do.
  return { kind: "not_github" }
}