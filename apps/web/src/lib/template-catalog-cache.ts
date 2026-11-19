import { unstable_cache } from "next/cache"

import { liveCache, orpc } from "@/lib/orpc"
import {
  TEMPLATE_CATALOG_CACHE_KEYS,
  TEMPLATE_CATALOG_REVALIDATE_SECONDS,
  TEMPLATE_CATALOG_TAGS,
} from "@/lib/template-catalog-cache-policy"

// Keep each public collection in its own persistent Data Cache entry. The
// functions use no request headers, cookies, or user-specific inputs.
export const getPlatformTemplateCatalog = unstable_cache(
  async () => orpc.templates.list(undefined, liveCache),
  [TEMPLATE_CATALOG_CACHE_KEYS.platform],
  {
    revalidate: TEMPLATE_CATALOG_REVALIDATE_SECONDS.platform,
    tags: [TEMPLATE_CATALOG_TAGS.platform],
  }
)

export const getCommunityTemplateCatalog = unstable_cache(
  async () => orpc.templates.community.list(undefined, liveCache),
  [TEMPLATE_CATALOG_CACHE_KEYS.community],
  {
    revalidate: TEMPLATE_CATALOG_REVALIDATE_SECONDS.community,
    tags: [TEMPLATE_CATALOG_TAGS.community],
  }
)

// unstable_cache incorporates function arguments into the cache key. Slugs
// are therefore isolated, while tags allow invalidating all details by type.
export const getPlatformTemplateDetail = unstable_cache(
  async (slug: string) => orpc.templates.detail({ slug }, liveCache),
  [TEMPLATE_CATALOG_CACHE_KEYS.platformDetail],
  {
    revalidate: TEMPLATE_CATALOG_REVALIDATE_SECONDS.platformDetail,
    tags: [TEMPLATE_CATALOG_TAGS.platformDetail],
  }
)

export const getCommunityTemplateDetail = unstable_cache(
  async (organizationSlug: string, templateSlug: string) =>
    orpc.templates.community.detail(
      { organizationSlug, templateSlug },
      liveCache
    ),
  [TEMPLATE_CATALOG_CACHE_KEYS.communityDetail],
  {
    revalidate: TEMPLATE_CATALOG_REVALIDATE_SECONDS.communityDetail,
    tags: [TEMPLATE_CATALOG_TAGS.communityDetail],
  }
)
