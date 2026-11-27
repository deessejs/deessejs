// Managed preview URLs expire after five minutes, so the platform catalog
// refreshes them slightly sooner than that.
export const TEMPLATE_CATALOG_REVALIDATE_SECONDS = {
  platform: 240,
  community: 60,
  platformDetail: 240,
  communityDetail: 60,
} as const

export const TEMPLATE_CATALOG_TAGS = {
  platform: "template-catalog:platform",
  community: "template-catalog:community",
  platformDetail: "template-detail:platform",
  communityDetail: "template-detail:community",
} as const

export const TEMPLATE_CATALOG_CACHE_KEYS = {
  platform: "template-catalog-platform-v1",
  community: "template-catalog-community-v1",
  platformDetail: "template-detail-platform-v1",
  communityDetail: "template-detail-community-v1",
} as const
