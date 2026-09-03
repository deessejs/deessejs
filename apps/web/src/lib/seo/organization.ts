import { APP_CONFIG } from "@/lib/app-config"

/**
 * SEO identity for DeesseJS, consumed by the global Organization and
 * WebSite JSON-LD scripts and the root metadata (og:site_name,
 * twitter:card, etc.).
 *
 * The Organization schema.org entity is the central node in the
 * crawler graph. Every Article, Person, or Service JSON-LD emitted by
 * a child route references it via `@id` rather than re-declaring the
 * name/url/logo, so the publisher link stays single-sourced.
 *
 * Source of truth:
 *   - name, description, url: `APP_CONFIG` in src/lib/app-config.ts
 *   - logo: `/icon.svg` served by `apps/web/src/app/icon.svg`
 *   - contactPoint: support@deessejs.com (also linked in the footer)
 *   - sameAs: only profiles confirmed real in the codebase. Add new
 *     entries here only after the URL has been verified to exist —
 *     broken sameAs entries are a long-term SEO liability.
 */

export const ORG_ID = `${APP_CONFIG.url}#organization`
export const WEBSITE_ID = `${APP_CONFIG.url}#website`
export const LOGO_URL = `${APP_CONFIG.url}/icon.svg`
export const GITHUB_URL = "https://github.com/deessejs"

export type SameAs = ReadonlyArray<string>

/**
 * Confirmed external profiles that identify DeesseJS as an
 * organization. Kept as a frozen tuple so consumers can rely on the
 * shape and the build can statically verify no duplicates.
 */
export const ORG_SAME_AS: SameAs = [GITHUB_URL] as const

export type OrganizationNode = {
  "@context": "https://schema.org"
  "@type": "Organization"
  "@id": string
  name: string
  url: string
  logo: string
  description: string
  foundingDate: string
  contactPoint: {
    "@type": "ContactPoint"
    contactType: "customer support"
    email: string
    availableLanguage: ReadonlyArray<string>
  }
  sameAs: SameAs
}

/**
 * Build the Organization JSON-LD payload. Pure function — same
 * inputs, same output — so it can be unit-tested in isolation and
 * passed through `JSON.stringify` at the render site.
 */
export function buildOrganizationJsonLd(): OrganizationNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    logo: LOGO_URL,
    description: APP_CONFIG.description,
    foundingDate: "2026",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@deessejs.com",
      availableLanguage: ["English"],
    },
    sameAs: ORG_SAME_AS,
  }
}

export type WebSiteNode = {
  "@context": "https://schema.org"
  "@type": "WebSite"
  "@id": string
  url: string
  name: string
  description: string
  inLanguage: string
  publisher: { "@id": string }
}

/**
 * Build the WebSite JSON-LD payload. The `publisher` reference points
 * at the Organization via `@id` — that is the link the crawler uses
 * to anchor DeesseJS-the-site to DeesseJS-the-organization.
 *
 * `potentialAction` (a SearchAction) is intentionally omitted: the
 * Cmd-K search runs on Fuse.js over an in-memory corpus and is not
 * exposed as a queryable URL. Adding a SearchAction pointing at a
 * non-existent endpoint would mislead the crawler.
 */
export function buildWebSiteJsonLd(): WebSiteNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: APP_CONFIG.url,
    name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  }
}