import { STACK_PROVIDERS } from "@/lib/seo/stack"
import { APP_CONFIG } from "@/lib/app-config"
import { ORG_ID } from "@/lib/seo/organization"

/**
 * Build the ItemList JSON-LD for the /stack page.
 *
 * The graph shape the crawler builds:
 *   DeesseJS (Organization @id=ORG_ID)
 *     - ItemList "stack" (positioned, ordered)
 *         - Service "Vercel"  -> url=https://vercel.com
 *         - Service "Neon"    -> url=https://neon.tech
 *         - ... (11 entries)
 *
 * Each Service entry exposes the brand `name`, the canonical
 * external `url`, and a short `description` (the role blurb).
 * `provider` is intentionally left out because Service-as-provider
 * is an awkward inversion; better to let the consumer (the human
 * or the crawler) anchor the Service to the Organization through
 * the page's surrounding copy and the global Organization script.
 *
 * `itemListOrder` is "https://schema.org/ItemListOrderAscending"
 * because the array is already presented in editorial order
 * (hosting first, then database, then auth, ...). The crawler uses
 * this to surface a numbered list rich result.
 */
export type StackServiceNode = {
  "@type": "Service"
  "@id": string
  name: string
  url: string
  description: string
}

export type StackItemListNode = {
  "@context": "https://schema.org"
  "@type": "ItemList"
  "@id": string
  name: string
  description: string
  url: string
  numberOfItems: number
  itemListOrder: "https://schema.org/ItemListOrderAscending"
  publisher: { "@id": string }
  itemListElement: ReadonlyArray<{
    "@type": "ListItem"
    position: number
    item: StackServiceNode
  }>
}

export function buildStackItemListJsonLd(): StackItemListNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${APP_CONFIG.url}/stack#itemlist`,
    name: `${APP_CONFIG.name} provider stack`,
    description: `The hosting, database, auth, queue, billing, observability, email, and ORM providers that ship with DeesseJS apps.`,
    url: `${APP_CONFIG.url}/stack`,
    numberOfItems: STACK_PROVIDERS.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    publisher: { "@id": ORG_ID },
    itemListElement: STACK_PROVIDERS.map((provider, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        "@id": `${APP_CONFIG.url}/stack#stack-${provider.slug}`,
        name: provider.name,
        url: provider.homepage,
        description: provider.blurb,
      },
    })),
  }
}