/**
 * Internal HTTP client for `@workspace/registry-client`.
 *
 * This file is NOT exported. It owns the wire-level details of
 * talking to the registry API:
 *
 *   - Building absolute URLs from the API base URL.
 *   - Issuing `fetch` calls with the right method, headers, and body.
 *   - Mapping HTTP status codes to {@link RegistryFailure}.
 *   - Catching transport errors (`fetch` `TypeError`) and mapping
 *     them to `RegistryNetworkError`.
 *
 * The public SDK API (`createClient`) wraps these helpers
 * and re-validates the response against `TemplateV2Schema`.
 */

import { TemplateV2 as TemplateV2Schema } from "@workspace/contracts/v2"

import { toRegistryError } from "./errors.js"
import type {
  CatalogEntry,
  FetchedTemplate,
  ObjectKey,
  RegistryFailure,
  Result,
  TemplateInfo,
} from "./types.js"
import { ok as okResult, err as errResult } from "./types.js"

/** Default path for the fetch-descriptor API route. */
const FETCH_DESCRIPTOR_PATH = "/api/v1/registry/fetch-descriptor"
/** Default path for the catalog API route. */
const CATALOG_PATH = "/api/v1/registry/catalog"

/**
 * Resolve a path against the API base URL.
 *
 * Throws (does NOT return a Result) because a malformed `apiUrl` is
 * a programmer error in the caller — it's not a runtime/transport
 * condition. Caught by the SDK factory at construction time.
 */
const resolveUrl = (apiUrl: string, path: string): string => {
  // `new URL` is strict: requires an absolute base, throws on garbage.
  // We strip a trailing slash on the base for forgiveness; the SDK
  // documents "no trailing slash" but be lenient.
  const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
  return new URL(path, `${base}/`).toString()
}

/**
 * Parse a `Response` whose body is the descriptor payload.
 *
 * Maps HTTP status codes to {@link RegistryFailure} and re-validates
 * the descriptor against `TemplateV2Schema` (defence in depth — the
 * server is supposed to have validated, but we re-check so the
 * consumer can't get a corrupted descriptor even if the server has
 * a bug).
 */
const parseDescriptorResponse = async (
  response: Response,
  slug: string,
): Promise<Result<FetchedTemplate, RegistryFailure>> => {
  if (response.status === 404) {
    return errResult<RegistryFailure>({ _tag: "RegistryNotFound", slug })
  }
  if (response.status === 401 || response.status === 403) {
    return errResult<RegistryFailure>({
      _tag: "RegistryAuthRequired",
      slug,
    })
  }
  if (response.status >= 500) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }

  // 2xx — parse the body
  const json: unknown = await response.json().catch((cause: unknown) => {
    throw toRegistryError(
      {
        _tag: "RegistryInvalidDescriptor",
        slug,
        cause,
      },
      `Registry returned non-JSON body for ${slug}`,
    )
  })

  if (typeof json !== "object" || json === null) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "expected an object",
    })
  }

  const candidate = json as {
    descriptor?: unknown
    files?: unknown
  }

  // Validate descriptor
  const descriptorParsed = TemplateV2Schema.safeParse(candidate.descriptor)
  if (!descriptorParsed.success) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: descriptorParsed.error,
    })
  }

  // Validate files map
  if (
    typeof candidate.files !== "object" ||
    candidate.files === null ||
    Array.isArray(candidate.files)
  ) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "expected `files` to be a Record<string, string>",
    })
  }
  const filesRaw = candidate.files as Record<string, unknown>
  const files: Record<ObjectKey, string> = {}
  for (const [path, value] of Object.entries(filesRaw)) {
    if (typeof value !== "string") {
      return errResult<RegistryFailure>({
        _tag: "RegistryInvalidDescriptor",
        slug,
        cause: `expected \`files[${path}]\` to be a string URL`,
      })
    }
    files[path] = value
  }

  return okResult<FetchedTemplate>({
    descriptor: descriptorParsed.data,
    files,
  })
}

/**
 * Parse a `Response` whose body is the catalog payload.
 */
const parseCatalogResponse = async (
  response: Response,
): Promise<Result<readonly CatalogEntry[], RegistryFailure>> => {
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug: "(catalog)",
      cause: `HTTP ${response.status}`,
    })
  }
  const json: unknown = await response.json().catch((cause: unknown) => {
    throw toRegistryError(
      {
        _tag: "RegistryInvalidDescriptor",
        slug: "(catalog)",
        cause,
      },
      "Registry returned non-JSON catalog",
    )
  })

  if (
    typeof json !== "object" ||
    json === null ||
    !("catalog" in json) ||
    !Array.isArray((json as { catalog: unknown }).catalog)
  ) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug: "(catalog)",
      cause: "expected `{ catalog: CatalogEntry[] }`",
    })
  }

  // Catalog shape is permissive in V1: just validate that each entry
  // is an object with at least slug/title. Tighten later.
  const raw = (json as { catalog: unknown[] }).catalog
  const catalog: CatalogEntry[] = []
  for (const entry of raw) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as { slug?: unknown }).slug !== "string" ||
      typeof (entry as { title?: unknown }).title !== "string"
    ) {
      return errResult<RegistryFailure>({
        _tag: "RegistryInvalidDescriptor",
        slug: "(catalog)",
        cause: "catalog entry missing slug or title",
      })
    }
    catalog.push(entry as unknown as CatalogEntry)
  }
  return okResult<readonly CatalogEntry[]>(catalog)
}

/**
 * Internal: fetch the descriptor for `slug` from the registry API.
 *
 * Maps transport errors to `RegistryNetworkError` and validation
 * errors to `RegistryInvalidDescriptor`. Never throws to the caller —
 * the public SDK API catches here and converts to `Result`.
 */
export const getTemplateFromApi = async (
  apiUrl: string,
  slug: string,
  ref: string | undefined,
  fetchImpl: typeof fetch,
): Promise<Result<FetchedTemplate, RegistryFailure>> => {
  let response: Response
  try {
    response = await fetchImpl(resolveUrl(apiUrl, FETCH_DESCRIPTOR_PATH), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, ...(ref ? { ref } : {}) }),
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }
  return parseDescriptorResponse(response, slug)
}

/**
 * Internal: fetch the catalog from the registry API.
 */
export const listTemplatesFromApi = async (
  apiUrl: string,
  fetchImpl: typeof fetch,
): Promise<Result<readonly CatalogEntry[], RegistryFailure>> => {
  let response: Response
  try {
    response = await fetchImpl(resolveUrl(apiUrl, CATALOG_PATH), {
      method: "GET",
      headers: { "content-type": "application/json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug: "(catalog)",
      cause,
    })
  }
  return parseCatalogResponse(response)
}

/**
 * Parse a `Response` whose body is a TemplateInfo payload.
 *
 * Same shape of validation as the descriptor parser, but laxer —
 * TemplateInfo has fewer required fields and no Zod schema. We just
 * shape-check the JSON object.
 */
const parseInfoResponse = async (
  response: Response,
  slug: string,
): Promise<Result<TemplateInfo, RegistryFailure>> => {
  if (response.status === 404) {
    return errResult<RegistryFailure>({ _tag: "RegistryNotFound", slug })
  }
  if (response.status === 401 || response.status === 403) {
    return errResult<RegistryFailure>({
      _tag: "RegistryAuthRequired",
      slug,
    })
  }
  if (response.status >= 500) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }
  if (!response.ok) {
    return errResult<RegistryFailure>({
      _tag: "RegistryFetchFailed",
      slug,
      cause: `HTTP ${response.status}`,
    })
  }

  const json: unknown = await response.json().catch((cause: unknown) => {
    throw toRegistryError(
      {
        _tag: "RegistryInvalidDescriptor",
        slug,
        cause,
      },
      `Registry returned non-JSON body for info(${slug})`,
    )
  })

  if (typeof json !== "object" || json === null) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "expected an object",
    })
  }

  const candidate = json as {
    slug?: unknown
    title?: unknown
    description?: unknown
    layer?: unknown
    latestVersion?: unknown
    versions?: unknown
    category?: unknown
    labels?: unknown
    updatedAt?: unknown
  }

  if (
    typeof candidate.slug !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.latestVersion !== "string" ||
    !Array.isArray(candidate.versions)
  ) {
    return errResult<RegistryFailure>({
      _tag: "RegistryInvalidDescriptor",
      slug,
      cause: "missing required fields (slug, title, latestVersion, versions)",
    })
  }

  // Validate the versions array contents.
  const versions: string[] = []
  for (const v of candidate.versions as unknown[]) {
    if (typeof v !== "string") {
      return errResult<RegistryFailure>({
        _tag: "RegistryInvalidDescriptor",
        slug,
        cause: "versions[] must contain only strings",
      })
    }
    versions.push(v)
  }

  const layer =
    candidate.layer === "open-community" ||
    candidate.layer === "pro" ||
    candidate.layer === "enterprise"
      ? candidate.layer
      : "open-community"

  const info: TemplateInfo = {
    slug: candidate.slug,
    title: candidate.title,
    ...(typeof candidate.description === "string"
      ? { description: candidate.description }
      : {}),
    layer,
    latestVersion: candidate.latestVersion,
    versions,
    ...(typeof candidate.category === "string"
      ? { category: candidate.category }
      : {}),
    ...(Array.isArray(candidate.labels)
      ? { labels: candidate.labels as string[] }
      : {}),
    ...(typeof candidate.updatedAt === "string"
      ? { updatedAt: candidate.updatedAt }
      : {}),
  }
  return okResult<TemplateInfo>(info)
}

/**
 * Internal: fetch the TemplateInfo for `slug` from the registry API.
 *
 * GET /api/v1/registry/templates/:slug/info
 */
export const getInfoFromApi = async (
  apiUrl: string,
  slug: string,
  fetchImpl: typeof fetch,
): Promise<Result<TemplateInfo, RegistryFailure>> => {
  // Encode slug for URL path. We assume slugs are namespace/name
  // (e.g. "@deessejs/nextjs-saas"). encodeURIComponent preserves
  // "/", "@", and alphanumerics.
  const encodedSlug = encodeURIComponent(slug)
  const path = `/api/v1/registry/templates/${encodedSlug}/info`
  let response: Response
  try {
    response = await fetchImpl(resolveUrl(apiUrl, path), {
      method: "GET",
      headers: { "content-type": "application/json" },
    })
  } catch (cause) {
    return errResult<RegistryFailure>({
      _tag: "RegistryNetworkError",
      slug,
      cause,
    })
  }
  return parseInfoResponse(response, slug)
}
