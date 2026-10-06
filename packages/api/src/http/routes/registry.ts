/**
 * Registry HTTP routes (REST, not oRPC).
 *
 * Three endpoints consumed by `@workspace/registry-client`:
 *
 *   - GET  /registry/catalog                       → { templates: CatalogEntry[] }
 *   - POST /registry/fetch-descriptor              → { descriptor, files }
 *   - GET  /registry/templates/:slug/info          → TemplateInfo
 *
 * Why REST and not oRPC:
 *   - The SDK uses `globalThis.fetch` with simple POST/GET. oRPC
 *     would require RPC-link plumbing on the client side, doubling
 *     the SDK surface for no consumer benefit.
 *   - These endpoints are read-mostly; the oRPC typing overhead
 *     is wasted.
 *   - Other Hono routes in this package (health, version, auth)
 *     follow the same REST pattern.
 *
 * Source strategy (V1):
 *   - Any GitHub repository with a valid `deesse-template.json` at
 *     its root is a valid template source. The registry resolves
 *     three slug shapes via `registry-resolver.ts`:
 *
 *       1. Bare slug in the editorial `TEMPLATES` constant
 *          (e.g. `saas-starter` → `deessejs/saas-template`)
 *       2. `owner/repo` shorthand (e.g. `vercel/next.commerce`)
 *       3. GitHub URL — HTTPS or SSH
 *
 *   - A repository that exists on GitHub but does NOT ship a
 *     valid `deesse-template.json` returns 422
 *     `incompatible_template` with a `cause` discriminator of
 *     `missing_descriptor` or `invalid_descriptor`. The CLI
 *     surfaces this as `RegistryIncompatibleTemplate` and exits
 *     with a clear message. There is no implicit `git clone`
 *     fallback — the descriptor is the contract, and the contract
 *     must be present.
 *
 *   - `fetch-descriptor` and `info` always resolve through the
 *     same path; the catalogue is an editorial convenience, NOT a
 *     whitelist. This is what unlocks "init any GitHub repo that
 *     ships a deesse-template.json".
 *
 * Error vocabulary (status → wire shape):
 *   - 400 — malformed slug (e.g. non-github URL): body has
 *     `{ error, host }`.
 *   - 404 — slug unparseable as a GitHub reference: body has
 *     `{ error }`. SDK translates to `RegistryNotFound`.
 *   - 422 — source exists yet descriptor is missing or invalid:
 *     body has `{ error, code: "incompatible_template",
 *     cause: "missing_descriptor" | "invalid_descriptor", repo }`.
 *     SDK translates to `RegistryIncompatibleTemplate`.
 *   - 502 — upstream unreachable / rate-limited: body has
 *     `{ error }`. SDK translates to `RegistryFetchFailed`.
 *
 * Authentication (V2): none. The route is public; gating paid
 * templates lives on a separate auth-protected route group.
 */

import { TemplateV2 as TemplateV2Schema, type TemplateV2 } from "@workspace/contracts/v2"
import { resolveFiles } from "@workspace/registry-client"
import { logger } from "../../constants/logger.js"
import { TEMPLATES } from "../../templates.js"
import type { ApiEnv } from "../env.js"
import type { Hono } from "hono"

import {
  resolveSource,
  type ResolvedRepo,
  type ResolvedSource,
} from "./registry-resolver.js"

/**
 * Fetch `deesse-template.json` from GitHub raw for the resolved repo.
 *
 * Returns `{ text, ref }` on success (the ref actually used, which
 * is the caller's input or "main" by default) or `null` when the
 * upstream responds 404. Network errors and non-404 upstream
 * statuses are surfaced as thrown `Error` so the caller can
 * translate them to a 502.
 *
 * Why we don't use the GitHub API for this:
 *   - `raw.githubusercontent.com` is content-addressed and
 *     unauthenticated (no rate limit at the level a CLI generates).
 *   - The 404 response is the load-bearing signal: it means the
 *     repo exists but doesn't ship the descriptor, which is what
 *     `incompatible_template` reports. Using the GitHub API would
 *     require distinguishing "repo missing" from "repo present,
 *     file missing" — `raw` returns the same 404 for both, which
 *     is fine because the error message is the same for the user.
 *
 * Ref resolution:
 *   - `ref` is a tag, branch, or SHA. We pass it verbatim to GitHub
 *     raw; the server interprets it.
 *   - We do NOT implement `main` → `master` fallback here. A user
 *     who needs the default branch on a repo that doesn't use `main`
 *     must pass `--ref master` (or whichever the default is). This is
 *     a deliberate trade-off: a fallback would be a heuristic, and
 *     heuristics on remote metadata are the failure mode the
 *     strict resolver avoids.
 */
const fetchDescriptorFromGithub = async (
  repo: ResolvedRepo,
  ref?: string,
): Promise<{ text: string; ref: string } | null> => {
  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${ref ?? "main"}/deesse-template.json`
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub responded ${response.status}`)
  }
  return { text: await response.text(), ref: ref ?? "main" }
}

/**
 * Fetch the recursive Git tree for a template repo.
 *
 * Endpoint: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/{ref}?recursive=1`
 * Returns the list of blob paths at the given ref. 404 means the repo
 * is fine but the ref is missing (shouldn't happen for `main`). 5xx
 * throws a tagged `Error("tree fetch failed")` that the API client
 * surfaces as `RegistryTreeFailed` (see
 * `@workspace/registry-client/src/http-client.ts`).
 *
 * Mirrors the descriptor-fetch pattern but with a different status
 * mapping: 404 here is rare (ref doesn't exist) and 5xx is the
 * load-bearing failure mode (the user-facing CLI message differs).
 */
const fetchTreeFromGithub = async (
  owner: string,
  repo: string,
  ref: string,
): Promise<{ paths: string[]; ref: string } | null> => {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`
  const response = await fetch(url, {
    headers: { accept: "application/vnd.github+json" },
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error("tree fetch failed")
  }
  const json = (await response.json()) as {
    truncated?: boolean
    tree?: Array<{ path?: string; type?: string }>
  }
  if (json.truncated === true) {
    throw new Error("tree fetch failed")
  }
  const paths = (json.tree ?? [])
    .filter((n) => n.type === "blob" && typeof n.path === "string")
    .map((n) => n.path as string)
  return { paths, ref }
}

/**
 * Convert an internal `TEMPLATES` entry into the SDK's
 * `CatalogEntry` wire shape.
 *
 * Editorial metadata only — the descriptor JSON is NOT embedded.
 * `latestVersion` is a placeholder until the descriptor is
 * fetched; the catalogue row is marketing metadata, not a version
 * source of truth. The wire shape requires a value, so we emit
 * `"0.0.0"` and let the real descriptor overwrite it via
 * `client.info(slug)` when the consumer needs the actual version.
 */
const toCatalogEntry = (entry: (typeof TEMPLATES)[number]) => ({
  slug: entry.slug,
  title: entry.name,
  ...(entry.description !== undefined ? { description: entry.description } : {}),
  layer: entry.layer,
  latestVersion: "0.0.0",
})

/**
 * Extract the `owner/repo` pair from any resolved source.
 *
 * For catalogue-sourced slugs we already have the pair on the entry
 * (the catalogue row's `owner` + `repo`). For github-sourced slugs
 * (owner/repo shorthand or URL) the pair is already on `repo`.
 *
 * This collapses the two kinds of resolved source into a single
 * shape the fetch step can consume.
 */
const repoFromSource = (source: ResolvedSource): ResolvedRepo =>
  source.kind === "catalog"
    ? { owner: source.entry.owner, repo: source.entry.repo }
    : source.repo

/**
 * Mount the three registry HTTP routes on the given Hono app.
 */
export const mountRegistry = (api: Hono<ApiEnv>): void => {
  // -----------------------------------------------------------------
  // GET /registry/catalog
  // -----------------------------------------------------------------
  api.get("/registry/catalog", (c) => {
    const templates = TEMPLATES.map(toCatalogEntry)
    return c.json({ templates })
  })

  // -----------------------------------------------------------------
  // POST /registry/fetch-descriptor
  // -----------------------------------------------------------------
  api.post("/registry/fetch-descriptor", async (c) => {
    const body = await c.req.json().catch(() => null) as
      | { slug?: unknown; ref?: unknown }
      | null
    if (body === null || typeof body.slug !== "string") {
      return c.json({ error: "missing slug" }, 400)
    }
    const slug = body.slug
    const ref = typeof body.ref === "string" ? body.ref : undefined

    const resolved = resolveSource(slug)
    if (!resolved.ok) {
      if (resolved.error._tag === "unsupported_host") {
        return c.json(
          { error: `unsupported host: ${resolved.error.host}` },
          400,
        )
      }
      return c.json({ error: `unknown slug: ${slug}` }, 404)
    }

    const repo = repoFromSource(resolved.source)

    let raw: { text: string; ref: string } | null
    try {
      raw = await fetchDescriptorFromGithub(repo, ref)
    } catch (cause) {
      logger.error("registry_fetch_failed", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        message: String(cause),
      })
      return c.json({ error: "upstream fetch failed" }, 502)
    }
    if (raw === null) {
      logger.warn("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "missing_descriptor",
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} does not ship a deesse-template.json`,
          code: "incompatible_template",
          cause: "missing_descriptor",
          repo: `${repo.owner}/${repo.repo}`,
        },
        422,
      )
    }

    let json: unknown
    try {
      json = JSON.parse(raw.text)
    } catch (cause) {
      logger.error("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "invalid_descriptor",
        message: String(cause),
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} descriptor is not valid JSON`,
          code: "incompatible_template",
          cause: "invalid_descriptor",
          repo: `${repo.owner}/${repo.repo}`,
        },
        422,
      )
    }

    const parsed = TemplateV2Schema.safeParse(json)
    if (!parsed.success) {
      logger.error("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "invalid_descriptor",
        issues: parsed.error.issues,
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} descriptor failed validation`,
          code: "incompatible_template",
          cause: "invalid_descriptor",
          repo: `${repo.owner}/${repo.repo}`,
        },
        422,
      )
    }

    const descriptor: TemplateV2 = parsed.data
    // Build URLs for each declared file at the resolved ref.
    const files: Record<string, string> = {}
    if (descriptor.files && descriptor.files.length > 0) {
      // V1 fast-path: descriptor.files[] is non-empty. No tree fetch.
      for (const file of descriptor.files) {
        files[file.path] = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${raw.ref}/${file.path}`
      }
    } else if (
      descriptor.includes !== undefined ||
      descriptor.excludes !== undefined ||
      descriptor.fileTypes !== undefined
    ) {
      // V2 path: descriptor declares a glob pipeline. Fetch the tree,
      // resolve via `resolveFiles` (same algorithm as the SDK; the SDK
      // calls the same function on its GitHub-direct path), build the
      // URL map from the resolved entries.
      let tree: { paths: string[]; ref: string } | null
      try {
        tree = await fetchTreeFromGithub(repo.owner, repo.repo, raw.ref)
      } catch (cause) {
        logger.error("registry_tree_failed", {
          slug,
          repo: `${repo.owner}/${repo.repo}`,
          message: String(cause),
        })
        return c.json({ error: "tree fetch failed" }, 502)
      }
      if (tree === null) {
        return c.json(
          {
            error: `tree not found for ${repo.owner}/${repo.repo} @ ${raw.ref}`,
            code: "tree_fetch_failed",
          },
          502,
        )
      }
      const rawBase = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${tree.ref}`
      const resolved = resolveFiles(descriptor, tree.paths)
      for (const f of resolved) {
        const target = f.target ?? f.path
        files[target] = `${rawBase}/${f.path}`
      }
    }
    return c.json({ descriptor, files })
  })

  // -----------------------------------------------------------------
  // GET /registry/templates/:slug/info
  // -----------------------------------------------------------------
  api.get("/registry/templates/:slug/info", async (c) => {
    const slug = c.req.param("slug")
    if (typeof slug !== "string" || slug === "") {
      return c.json({ error: "missing slug" }, 400)
    }

    const resolved = resolveSource(slug)
    if (!resolved.ok) {
      if (resolved.error._tag === "unsupported_host") {
        return c.json(
          { error: `unsupported host: ${resolved.error.host}` },
          400,
        )
      }
      return c.json({ error: `unknown slug: ${slug}` }, 404)
    }

    const repo = repoFromSource(resolved.source)
    const catalogueEntry =
      resolved.source.kind === "catalog" ? resolved.source.entry : null

    // Pull the descriptor to extract versions / labels / etc.
    let raw: { text: string; ref: string } | null
    try {
      raw = await fetchDescriptorFromGithub(repo)
    } catch (cause) {
      logger.error("registry_info_failed", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        message: String(cause),
      })
      return c.json({ error: "upstream fetch failed" }, 502)
    }

    // If GitHub returns 404, surface incompatible_template so the
    // CLI's `info` command gives a meaningful error rather than
    // silently degrading to a partial response.
    if (raw === null) {
      logger.warn("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "missing_descriptor",
        endpoint: "info",
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} does not ship a deesse-template.json`,
          code: "incompatible_template",
          cause: "missing_descriptor",
        },
        422,
      )
    }

    let json: unknown
    try {
      json = JSON.parse(raw.text)
    } catch (cause) {
      logger.error("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "invalid_descriptor",
        message: String(cause),
        endpoint: "info",
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} descriptor is not valid JSON`,
          code: "incompatible_template",
          cause: "invalid_descriptor",
        },
        422,
      )
    }
    const parsed = TemplateV2Schema.safeParse(json)
    if (!parsed.success) {
      logger.error("registry_incompatible_template", {
        slug,
        repo: `${repo.owner}/${repo.repo}`,
        cause: "invalid_descriptor",
        issues: parsed.error.issues,
        endpoint: "info",
      })
      return c.json(
        {
          error: `incompatible template: ${repo.owner}/${repo.repo} descriptor failed validation`,
          code: "incompatible_template",
          cause: "invalid_descriptor",
        },
        422,
      )
    }

    const d = parsed.data
    // For non-catalog sources, derive a minimal title from the
    // repo's name when the descriptor doesn't supply one.
    const fallbackTitle =
      catalogueEntry?.name ??
      d.title ??
      d.name ??
      `${repo.owner}/${repo.repo}`
    const fallbackDescription =
      catalogueEntry?.description ?? d.description
    const fallbackLayer = catalogueEntry?.layer ?? "open-community"

    return c.json({
      slug:
        catalogueEntry?.slug ??
        `${repo.owner}/${repo.repo}`,
      title: fallbackTitle,
      ...(fallbackDescription !== undefined
        ? { description: fallbackDescription }
        : {}),
      layer: fallbackLayer,
      latestVersion: d.version,
      versions: [d.version],
      ...(d.labels !== undefined ? { labels: d.labels } : {}),
    })
  })
}