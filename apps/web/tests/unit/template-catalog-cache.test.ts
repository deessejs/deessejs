import { describe, expect, it } from "vitest"

import {
  TEMPLATE_CATALOG_CACHE_KEYS,
  TEMPLATE_CATALOG_REVALIDATE_SECONDS,
  TEMPLATE_CATALOG_TAGS,
} from "../../src/lib/template-catalog-cache-policy.js"

describe("public template cache policy", () => {
  it("keeps platform and community catalog entries independently keyed and tagged", () => {
    expect(TEMPLATE_CATALOG_CACHE_KEYS.platform).not.toBe(
      TEMPLATE_CATALOG_CACHE_KEYS.community
    )
    expect(TEMPLATE_CATALOG_TAGS.platform).not.toBe(
      TEMPLATE_CATALOG_TAGS.community
    )
    expect(TEMPLATE_CATALOG_TAGS.platformDetail).not.toBe(
      TEMPLATE_CATALOG_TAGS.communityDetail
    )
  })

  it("refreshes signed platform previews before expiry and bounds community freshness", () => {
    expect(TEMPLATE_CATALOG_REVALIDATE_SECONDS.platform).toBe(240)
    expect(TEMPLATE_CATALOG_REVALIDATE_SECONDS.community).toBe(60)
    expect(TEMPLATE_CATALOG_REVALIDATE_SECONDS.platformDetail).toBe(240)
    expect(TEMPLATE_CATALOG_REVALIDATE_SECONDS.communityDetail).toBe(60)
    expect(TEMPLATE_CATALOG_REVALIDATE_SECONDS.community).toBeLessThanOrEqual(
      TEMPLATE_CATALOG_REVALIDATE_SECONDS.platform
    )
  })
})
