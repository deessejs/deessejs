import { toORPCError } from "@orpc/client"
import { fromAsyncThrowable } from "@deessejs/fp"
import type { CommunityTemplateV1, TemplateV1 } from "@workspace/contracts/v1"
import {
  CommunityTemplateV1 as CommunityTemplateSchema,
  CommunityTemplatesListResponseV1,
  TemplateV1 as TemplateSchema,
  TemplatesListResponseV1,
} from "@workspace/contracts/v1"

import { networkError } from "../errors/index.js"
import { maybeWarnAboutOutdatedCli } from "../version/check.js"
import { orpc } from "./client.js"
import {
  readDiskCache,
  responseCacheKey,
  RESPONSE_CACHE_TTL_MS,
  writeDiskCache,
} from "../cache/index.js"

export type Template = TemplateV1 | CommunityTemplateV1

export type FetchOptions = {
  /** Skip the version probe. Used by info and by the version probe itself. */
  skipVersionCheck?: boolean
  useLocalCache?: boolean
  refresh?: boolean
  legacyV1List?: boolean
}

const isFreshCacheEntry = (
  entry: ReturnType<typeof readDiskCache>
): boolean => {
  if (!entry) return false
  const age = Date.now() - Date.parse(entry.fetchedAt)
  return age >= 0 && age < RESPONSE_CACHE_TTL_MS
}

function readCachedTemplates(
  officialKey: string,
  communityKey: string
): Template[] | null {
  const official = readDiskCache(officialKey)
  const community = readDiskCache(communityKey)
  if (
    !official ||
    !community ||
    !isFreshCacheEntry(official) ||
    !isFreshCacheEntry(community)
  ) {
    return null
  }

  const parsedOfficial = TemplatesListResponseV1.safeParse(official.body)
  const parsedCommunity = CommunityTemplatesListResponseV1.safeParse(
    community.body
  )
  if (!parsedOfficial.success || !parsedCommunity.success) return null
  return [...parsedOfficial.data.templates, ...parsedCommunity.data.templates]
}

function writeCachedTemplates(
  officialKey: string,
  communityKey: string,
  result: { templates: TemplateV1[] },
  communityResult: { templates: CommunityTemplateV1[] }
): void {
  const parsedOfficial = TemplatesListResponseV1.safeParse(result)
  const parsedCommunity =
    CommunityTemplatesListResponseV1.safeParse(communityResult)
  if (!parsedOfficial.success || !parsedCommunity.success) return
  try {
    writeDiskCache(officialKey, parsedOfficial.data, null)
    writeDiskCache(communityKey, parsedCommunity.data, null)
  } catch {
    // Cache persistence is best-effort; successful live data remains usable.
  }
}

function parseAddressCache(address: string, body: unknown): Template | null {
  const parsed = address.startsWith("@")
    ? CommunityTemplateSchema.safeParse(body)
    : TemplateSchema.safeParse(body)
  return parsed.success ? parsed.data : null
}

function readCachedAddress(address: string, key: string): Template | null {
  const entry = readDiskCache(key)
  if (!entry || !isFreshCacheEntry(entry)) return null
  return parseAddressCache(address, entry.body)
}

function writeCachedAddress(
  address: string,
  key: string,
  template: Template
): void {
  const parsed = parseAddressCache(address, template)
  if (!parsed) return
  try {
    writeDiskCache(key, parsed, null)
  } catch {
    // Cache persistence is best-effort; successful live data remains usable.
  }
}

async function fetchAddressFromApi(address: string): Promise<Template | null> {
  if (!address.startsWith("@")) return orpc.templates.detail({ slug: address })
  const [, organizationSlug, templateSlug] =
    /^@([^/]+)\/(.+)$/.exec(address) ?? []
  if (!organizationSlug || !templateSlug) return null
  return orpc.templates.community.detail({ organizationSlug, templateSlug })
}

/**
 * Normalise an error thrown from the typed oRPC client.
 *
 * Uses `toORPCError` from `@orpc/client` to do the shape matching. This is
 * the canonical entry point: the lib does the matching internally and
 * exposes `[Symbol.hasInstance]` for the Next.js multi-context case.
 *
 * In V1 the only mapping is `TypeError -> networkError`, because that
 * is the only error the global `fetch` throws for an unreachable network.
 * `ORPCError` instances are propagated as-is: the calling command knows
 * the procedure semantics and decides how to surface them.
 */
export const normaliseError = (e: unknown): Error => {
  // The global fetch throws a TypeError for unreachable networks.
  // `toORPCError` from @orpc/client wraps anything into an ORPCError
  // (replacing the original cause), so we must check TypeError BEFORE
  // calling it.
  if (e instanceof TypeError) {
    return networkError(e.message)
  }
  // For anything that is already (or can be normalised to) an
  // ORPCError, propagate as-is. The calling command knows the
  // procedure semantics and decides how to surface them.
  return toORPCError(e) as Error
}

/**
 * Fetch the templates registry.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. Call templates.list on the shared typed client. Retry on
 *      5xx and 429 is handled by the official oRPC plugins configured
 *      in ./client.ts.
 *   3. Surface typed errors via `normaliseError`.
 *
 * The URL is fixed at `API_RPC_PATH` (imported from
 * `@workspace/api/base-path`). A per-command override is intentionally
 * not part of the public surface in V1.
 *
 * Testing:
 *   - The procedure contract is tested via the Server-Side Client
 *     pattern in `test/contract/orpc-to-cli-error.test.ts`. Call
 *     `appRouter.templates.list()` directly, no HTTP.
 */
export const fetchTemplates = async (
  options: FetchOptions = {}
): Promise<Template[]> => {
  const officialKey = responseCacheKey("templates-official")
  const communityKey = responseCacheKey("templates-community")
  if (options.useLocalCache && !options.refresh) {
    const cached = readCachedTemplates(officialKey, communityKey)
    if (cached) return cached
  }
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli()
  }

  try {
    const [result, communityResult] = await Promise.all(
      options.legacyV1List
        ? [orpc.templates.list(), orpc.templates.community.list()]
        : [orpc.templates.summary(), orpc.templates.community.summary()]
    )
    if (options.useLocalCache)
      writeCachedTemplates(officialKey, communityKey, result, communityResult)
    return [...result.templates, ...communityResult.templates]
  } catch (e) {
    throw normaliseError(e)
  }
}

/** Resolve a catalog slug without requesting the GitHub-enriched listing. */
export const resolveTemplateBySlug = async (
  slug: string
): Promise<Pick<Template, "slug" | "owner" | "repo"> | null> => {
  try {
    return await orpc.templates.resolve({ slug })
  } catch (e) {
    throw normaliseError(e)
  }
}

/** Fetch one currently public template, without reading either catalog. */
export const fetchTemplateByAddress = async (
  address: string,
  options: { useLocalCache?: boolean; refresh?: boolean } = {}
): Promise<Template | null> => {
  const key = responseCacheKey(`template-${encodeURIComponent(address)}`)
  if (options.useLocalCache && !options.refresh) {
    const cached = readCachedAddress(address, key)
    if (cached) return cached
  }
  try {
    const result = await fetchAddressFromApi(address)
    if (result && options.useLocalCache)
      writeCachedAddress(address, key, result)
    return result
  } catch (e) {
    throw normaliseError(e)
  }
}

export const resolveOfficialBlock = async (slug: string) => {
  const result = await fromAsyncThrowable({
    onSuccess: async () =>
      orpc.blocks
        .resolve({
          organizationSlug: "official",
          slug,
        })
        .then((response) => response.block),
    onError: normaliseError,
  })
  return result.match({
    ok: (block) => block,
    err: (error) => {
      throw error
    },
  })
}
