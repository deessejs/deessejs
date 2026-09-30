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