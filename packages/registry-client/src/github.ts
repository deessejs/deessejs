/**
 * Direct-GitHub fetch path for `@workspace/registry-client`.
 *
 * The SDK's API-mediated path (`http-client.ts`) goes through the
 * registry server. This file is the **client-side fallback** for
 * GitHub-shaped slugs that the SDK can resolve on its own:
 *
 *   - `owner/repo` shorthand
 *   - GitHub HTTPS URL
 *   - GitHub SSH URL
 *
 * For these inputs, the SDK fetches `deesse-template.json` directly
 * from `raw.githubusercontent.com`. The same `RegistryFailure`
 * union applies to the failures the GitHub path can produce, so
 * consumers see identical user-facing errors regardless of path.
 *
 * Behaviour mirrors `packages/api/src/http/routes/registry.ts`
 * line-for-line (the server's GitHub fetch step). Keeping the
 * two paths in sync is the load-bearing invariant for the
 * `init` and `info` user experience.
 *
 * @see ADR-XXX-direct-github-fallback for the routing design.
 */

import {
  TemplateV2 as TemplateV2Schema,
  type TemplateV2,
} from "@workspace/contracts/v2"

import type {
  FetchedTemplate,
  ObjectKey,
  RegistryFailure,
  Result,
  TemplateInfo,
} from "./types.js"
import { ok as okResult, err as errResult } from "./types.js"

/**
 * Base URL for fetching `deesse-template.json` and its referenced
 * files from GitHub. Defaults to the public
 * `https://raw.githubusercontent.com` host. Tests / mirror
 * deployments override via the `DEESSEJS_GITHUB_RAW_BASE` env var
 * — see ADR-038 followup.
 */
const githubRawBase = (): string =>
  process.env["DEESSEJS_GITHUB_RAW_BASE"] ?? "https://raw.githubusercontent.com"

/**
 * Fetch `deesse-template.json` from GitHub raw for the given repo.
 *
 * Same surface as `getTemplateFromApi` (`http-client.ts:294-318`):
 * the function takes a `fetchImpl` for tests, maps transport and
 * status errors to `RegistryFailure`, and returns a `Result`.
 *
 * Why we don't reuse the API server's `fetchDescriptorFromGithub`
 * helper: the server's helper lives under `packages/api` and pulls
 * in `@workspace/api`'s runtime deps (Hono, Better Auth). The SDK
 * is a leaf package that depends only on `@workspace/contracts`.
 * Duplicating ~25 lines is cheaper than the dependency.
 *
 * Ref fallback: same rule as the server. Default is `"main"`,
 * no `master` fallback (the user must pass `--ref master`).
 */
export const getTemplateFromGithub = async (
  owner: string,
  repo: string,
  ref: string | undefined,
  fetchImpl: typeof fetch,
): Promise<Result<FetchedTemplate, RegistryFailure>> => {
  const slug = `${owner}/${repo}`
  const resolvedRef = ref ?? "main"
  const url = `${githubRawBase()}/${owner}/${repo}/${resolvedRef}/deesse-template.json`

  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }

  if (response.status === 404) {
    return errResult<RegistryFailure>({
      _tag: "RegistryIncompatibleTemplate",
      slug,
      repo: slug,
      cause: "missing_descriptor",
    })
  }
  if (response.status === 401 || response.status === 403) {
    return errResult<RegistryFailure>({
      _tag: "RegistryAuthRequired",
      slug,
    })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }

  // 2xx — parse and validate
  let json: unknown
  try {
    json = await response.json()
  } catch {
    return errResult<RegistryFailure>({
      _tag: "RegistryIncompatibleTemplate",
      slug,
      repo: slug,
      cause: "invalid_descriptor",
    })
  }

  if (typeof json !== "object" || json === null) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "expected an object",
    })
  }

  // The descriptor from GitHub is the raw `deesse-template.json`
  // document — it does NOT carry the `files[]` map the API server
  // returns. We synthesise the map here, mirroring the server's
  // path so the SDK's public `FetchedTemplate` shape is identical.
  const candidate = json as {
    descriptor?: unknown
    files?: unknown
  }

  const descriptorParsed = TemplateV2Schema.safeParse(candidate)
  if (!descriptorParsed.success) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: descriptorParsed.error,
    })
  }

  const descriptor: TemplateV2 = descriptorParsed.data
  const files: Record<ObjectKey, string> = {}
  for (const file of descriptor.files ?? []) {
    files[file.path] = `${githubRawBase()}/${owner}/${repo}/${resolvedRef}/${file.path}`
  }

  return okResult<FetchedTemplate>({ descriptor, files })
}

/**
 * Fetch `TemplateInfo` from GitHub raw for the given repo.
 *
 * Same pattern as the server's `info` route. The descriptor is
 * fetched, validated, and the `TemplateInfo` fields are derived
 * from the descriptor (no catalogue context available on the
 * direct-GitHub path, so `layer` defaults to `"open-community"`).
 *
 * Returns `RegistryIncompatibleTemplate` (422-style failure) when
 * the descriptor is missing or invalid, same shape as
 * `getTemplateFromGithub`.
 */
export const getInfoFromGithub = async (
  owner: string,
  repo: string,
  fetchImpl: typeof fetch,
): Promise<Result<TemplateInfo, RegistryFailure>> => {
  const slug = `${owner}/${repo}`
  const url = `${githubRawBase()}/${owner}/${repo}/main/deesse-template.json`

  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }

  if (response.status === 404) {
    return errResult<RegistryFailure>({
      _tag: "RegistryIncompatibleTemplate",
      slug,
      repo: slug,
      cause: "missing_descriptor",
    })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return errResult<RegistryFailure>({
      _tag: "RegistryIncompatibleTemplate",
      slug,
      repo: slug,
      cause: "invalid_descriptor",
    })
  }

  if (typeof json !== "object" || json === null) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "expected an object",
    })
  }

  const descriptorParsed = TemplateV2Schema.safeParse(json)
  if (!descriptorParsed.success) {
    return errResult<RegistryFailure>({
      _tag: "RegistryIncompatibleTemplate",
      slug,
      repo: slug,
      cause: "invalid_descriptor",
    })
  }

  const d = descriptorParsed.data
  const title = d.title ?? d.name ?? slug
  const info: TemplateInfo = {
    slug,
    title,
    ...(d.description !== undefined ? { description: d.description } : {}),
    layer: "open-community",
    latestVersion: d.version,
    versions: [d.version],
    ...(d.labels !== undefined ? { labels: d.labels } : {}),
  }
  return okResult<TemplateInfo>(info)
}

/**
 * Base URL for the GitHub Git Trees API. Not overridable: the API
 * host is fixed at api.github.com. Tests mock `fetchImpl`.
 */
const GITHUB_API_BASE = "https://api.github.com"

/**
 * Fetch the recursive Git tree for a repository.
 *
 * Endpoint: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/{ref}?recursive=1`
 * Auth: unauthenticated. Rate limit: 60 req/h per IP — fine for the
 * CLI's per-invocation cadence, expensive for CI matrix runs.
 *
 * The response includes a `truncated: true` flag when the repo has
 * more than ~100k files. We do not paginate (a follow-up ADR can add
 * it for very large monorepos); truncated trees return
 * `RegistryTreeFailed(cause: "truncated")`.
 */
export const getTreeFromGithub = async (
  owner: string,
  repo: string,
  ref: string,
  fetchImpl: typeof fetch,
): Promise<Result<{ readonly ref: string; readonly paths: readonly string[] }, RegistryFailure>> => {
  const slug = `${owner}/${repo}`
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`

  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/vnd.github+json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }

  if (response.status === 401 || response.status === 403) {
    return errResult<RegistryFailure>({ _tag: "RegistryAuthRequired", slug })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryTreeFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return errResult<RegistryFailure>({
      _tag: "RegistryTreeFailed",
      slug,
      cause: "malformed tree body",
    })
  }

  if (
    typeof json !== "object" ||
    json === null ||
    !("tree" in json) ||
    !Array.isArray((json as { tree: unknown }).tree)
  ) {
    return errResult<RegistryFailure>({
      _tag: "RegistryTreeFailed",
      slug,
      cause: "expected `{ tree: GitTreeNode[] }`",
    })
  }

  const tree = (json as {
    tree: Array<{ path?: unknown; type?: unknown; truncated?: unknown }>
  }).tree
  const truncated = (json as { truncated?: unknown }).truncated === true
  if (truncated) {
    return errResult<RegistryFailure>({
      _tag: "RegistryTreeFailed",
      slug,
      cause: "tree truncated (>100k entries); pagination not supported in V1",
    })
  }

  // Filter to blobs only (skip trees, submodules).
  const paths = tree
    .filter((n) => n.type === "blob" && typeof n.path === "string")
    .map((n) => n.path as string)

  return okResult({ ref, paths })
}

import { resolveFiles as resolveFilesPure } from "./resolve.js"
import type { ResolvedTemplate } from "./types.js"

/**
 * Check whether the GitHub repo exists.
 *
 * Used to distinguish "owner/repo not found" from "owner/repo found
 * but descriptor missing". `raw.githubusercontent.com` returns 404 in
 * both cases (the file doesn't exist either way), so the SDK can't
 * rely on it for the distinction. The repo endpoint
 * (`GET /repos/{owner}/{repo}`) is the canonical existence probe.
 *
 * Returns `Ok(true)` if the repo exists, `Err(RegistryNotFound)` if
 * 404, or another `Err(RegistryFailure)` for transport / 5xx.
 */
export const getRepoExists = async (
  owner: string,
  repo: string,
  fetchImpl: typeof fetch,
): Promise<Result<true, RegistryFailure>> => {
  const slug = `${owner}/${repo}`
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`

  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/vnd.github+json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }

  if (response.status === 404) {
    return errResult<RegistryFailure>({ _tag: "RegistryNotFound", slug })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }
  return okResult(true)
}

/**
 * Fetch descriptor + tree, then resolve the file list via
 * `resolveFiles`. Returned on the GitHub direct path only.
 */
export const resolveTemplateFromGithub = async (
  owner: string,
  repo: string,
  ref: string | undefined,
  fetchImpl: typeof fetch,
): Promise<Result<ResolvedTemplate, RegistryFailure>> => {
  // Existence check first: if the repo doesn't exist on GitHub,
  // surface RegistryNotFound (a 404 from raw.githubusercontent.com
  // would otherwise be misreported as RegistryIncompatibleTemplate).
  const exists = await getRepoExists(owner, repo, fetchImpl)
  if (exists._tag === "Err") return exists

  // Fetch descriptor (reuses the GitHub raw fetch logic).
  const templateResult = await getTemplateFromGithub(owner, repo, ref, fetchImpl)
  if (templateResult._tag === "Err") return templateResult
  const resolvedRef = ref ?? "main"

  // Fetch tree.
  const treeResult = await getTreeFromGithub(owner, repo, resolvedRef, fetchImpl)
  if (treeResult._tag === "Err") return treeResult

  // Resolve files.
  const files = resolveFilesPure(templateResult.value.descriptor, treeResult.value.paths)

  return okResult<ResolvedTemplate>({
    descriptor: templateResult.value.descriptor,
    files,
    treeRef: treeResult.value.ref,
    source: "github-tree",
  })
}