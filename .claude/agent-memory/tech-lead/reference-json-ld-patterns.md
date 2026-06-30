---
name: reference-json-ld-patterns
description: JSON-LD structured data implementation reference for DeesseJS marketing site (Next 16 + RSC). Required schemas, concrete examples, library choice, validation gotchas for 2026 Google Rich Results
metadata:
  type: reference
---

# JSON-LD Structured Data for DeesseJS — 2026 Implementation Reference

**Stack:** Next.js 16 App Router + MDX (content-collections) + Tailwind v4 + shadcn/ui

**When to use:** Any time the user wants SEO structured data on the marketing site. Replaces the prior "no JSON-LD on releases" gap noted in `project-2026-saas-template-landscape.md`.

## TL;DR — the 2026 reality

- **Google FAQ rich result removed globally as of May 7, 2026** — `FAQPage` schema remains valid for AI engines (Perplexity, ChatGPT search, Bing/Copilot grounding)
- **Google Sitelinks Search Box removed Nov 21, 2024** — `WebSite.potentialAction` is dead for Google SERPs but still parsed by AI
- **`Article` rich-result eligibility narrowed** in late 2024 — use `BlogPosting` for blog content
- **`SoftwareReleaseNotes` does NOT exist** as a schema.org type. Only `SoftwareApplication.releaseNotes` (URL property). For changelog: mark up as `BlogPosting` or `Article` with `articleSection: "Release Notes"`
- **`NewsArticle` is reserved for journalism** — don't use on changelog entries

## Recommended schema set for DeesseJS v1 (priority order)

| Priority | Schema | Where | Lift |
|---|---|---|---|
| **P0** | `Organization` | `(marketing)/layout.tsx` + `(auth)/layout.tsx` (site-wide). `@id`: `https://deessejs.com/#organization` | 1 file, ~50 LoC. Powers knowledge panel + AI entity disambiguation |
| **P0** | `WebSite` | Homepage only (`page.tsx`). `name`, `url`, `publisher`. Skip `SearchAction` (dead for Google) | ~10 LoC |
| **P0** | `BreadcrumbList` | Every non-home page. Path-to-text helper called from page bodies | 1 helper, called everywhere. Free SERP path display + AI site topology |
| **P0** | `BlogPosting` + `Person` | `/blog/[slug]/page.tsx`, driven by content-collections. Authors get static `/authors/[handle]/page.tsx` with `Person` markup | ~30 LoC + 1 page per author |
| **P0** | `SoftwareApplication` | Homepage + `/pricing` | Single `Offer` with the headline tier price |
| **P1 (v1.1)** | `FAQPage` | Home page FAQ block + pricing FAQ (only if real user-visible content). Schema stays valid even after Google rich-result removal | Adapter around existing FAQ data |
| **P1 (v1.1)** | `Product` with multi-tier `offers` | `/pricing` — cleaner than 3 nested `hasOfferCatalog` on `SoftwareApplication` | Replaces single Offer |
| **P2 (post-launch)** | `AggregateRating` / `Review` | Only after real G2/Capterra/Product Hunt integration | Google strips self-serving reviews since late 2024 |

## Library choice — hand-rolled + schema-dts

**Recommended:** Hand-rolled `<script type="application/ld+json">` + `schema-dts` (type-only) for TypeScript safety.

**Why NOT next-seo:** Designed for Pages Router era. Under RSC adds bundle weight, runs client-side, JSON-LD output is harder to customize per route group.

**Why NOT next-schema-org or similar:** Adds a dep for ~30 lines of code (a thin wrapper).

## The official Next.js pattern (use this exactly)

```tsx
// lib/json-ld.ts
import type { Thing, WithContext } from 'schema-dts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

/**
 * Serialize a schema.org object to a JSON-LD-safe string.
 * Escapes `<` to prevent XSS injection when content is user-influenced.
 */
export function toJsonLd<T extends Thing>(data: WithContext<T>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export const ORG_ID = `${SITE_URL}/#organization`
export const SITE_ID = `${SITE_URL}/#website`
export const SOFTWARE_ID = `${SITE_URL}/#software`
```

```tsx
// app/(marketing)/layout.tsx — site-wide organization block
import { organization, toJsonLd } from '@/lib/json-ld'

export default function MarketingLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(organization) }}
      />
      {children}
    </>
  )
}
```

## Concrete JSON-LD examples (paste-ready)

### Organization (site-wide)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://deessejs.com/#organization",
  "name": "DeesseJS",
  "url": "https://deessejs.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://deessejs.com/logo.png",
    "width": 112,
    "height": 112
  },
  "description": "The SaaS template that never sleeps. Your agents are the developers.",
  "sameAs": [
    "https://github.com/martyy-code",
    "https://x.com/deessejs"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@deessejs.com"
  },
  "foundingDate": "2026-01-01"
}
```

### WebSite (homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://deessejs.com/#website",
  "name": "DeesseJS",
  "url": "https://deessejs.com",
  "publisher": { "@id": "https://deessejs.com/#organization" },
  "inLanguage": "en"
}
```

### BreadcrumbList (every non-home page)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://deessejs.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://deessejs.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Post Title", "item": "https://deessejs.com/blog/post-slug" }
  ]
}
```

### BlogPosting (per blog post)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://deessejs.com/blog/post-slug#article",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://deessejs.com/blog/post-slug"
  },
  "headline": "Post Title",
  "description": "Post description from frontmatter",
  "image": [
    "https://deessejs.com/og/post-slug-16x9.png",
    "https://deessejs.com/og/post-slug-4x3.png",
    "https://deessejs.com/og/post-slug-1x1.png"
  ],
  "datePublished": "2026-06-26T09:00:00+00:00",
  "dateModified": "2026-06-26T09:00:00+00:00",
  "author": {
    "@type": "Person",
    "@id": "https://deessejs.com/authors/dpereira#person",
    "name": "Diego Pereira"
  },
  "publisher": { "@id": "https://deessejs.com/#organization" },
  "inLanguage": "en"
}
```

### Changelog entry (BlogPosting with articleSection — there is NO `SoftwareReleaseNotes` type)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://deessejs.com/changelog/v1-2-0#article",
  "headline": "DeesseJS v1.2.0 — auth flow UI ships",
  "description": "Login, signup, forgot-password cards out of the box.",
  "image": ["https://deessejs.com/og/changelog/v1-2-0.png"],
  "datePublished": "2026-06-25T10:00:00+00:00",
  "author": { "@id": "https://deessejs.com/#organization" },
  "publisher": { "@id": "https://deessejs.com/#organization" },
  "articleSection": "Release Notes",
  "version": "1.2.0",
  "about": {
    "@type": "SoftwareApplication",
    "name": "DeesseJS",
    "softwareVersion": "1.2.0",
    "url": "https://deessejs.com"
  }
}
```

### SoftwareApplication (homepage + `/pricing`)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://deessejs.com/#software",
  "name": "DeesseJS",
  "url": "https://deessejs.com",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "SaaS Starter Kit",
  "operatingSystem": "Web, macOS, Linux, Windows",
  "image": "https://deessejs.com/og.png",
  "description": "Next.js 16 SaaS template for agent-first products.",
  "softwareVersion": "1.2.0",
  "publisher": { "@id": "https://deessejs.com/#organization" },
  "offers": {
    "@type": "Offer",
    "price": "49.00",
    "priceCurrency": "USD",
    "priceValidUntil": "2027-01-01",
    "availability": "https://schema.org/InStock",
    "url": "https://deessejs.com/pricing"
  },
  "featureList": [
    "Next.js 16 App Router scaffold",
    "MDX via content-collections",
    "Tailwind v4 + shadcn/ui",
    "Built-in JSON-LD scaffolding"
  ]
}
```

### Product with multi-tier pricing (`/pricing`)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://deessejs.com/#product",
  "name": "DeesseJS",
  "brand": { "@type": "Brand", "name": "DeesseJS" },
  "url": "https://deessejs.com/pricing",
  "offers": [
    {
      "@type": "Offer",
      "name": "Founder",
      "price": "149.00",
      "priceCurrency": "USD",
      "priceValidUntil": "2026-09-30",
      "availability": "https://schema.org/InStock",
      "url": "https://deessejs.com/pricing#founder"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "399.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://deessejs.com/pricing#pro"
    },
    {
      "@type": "Offer",
      "name": "Team",
      "price": "899.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://deessejs.com/pricing#team"
    }
  ]
}
```

### FAQPage (use ONLY for real user-visible FAQ content)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://deessejs.com/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is DeesseJS self-hostable?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — every template ships as standard Next.js 16 output. Deploy to Vercel, Netlify, Cloudflare, or your own infrastructure."
      }
    }
  ]
}
```

> **Note:** Google FAQ rich result was removed globally on May 7, 2026. Schema stays valid and AI engines still parse it (Perplexity, ChatGPT search, Bing → Copilot grounding). Ship only where FAQ content is genuinely user-visible.

### Person (author profile)

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://deessejs.com/authors/dpereira#person",
  "name": "Diego Pereira",
  "url": "https://deessejs.com/authors/dpereira",
  "jobTitle": "Founder",
  "worksFor": { "@id": "https://deessejs.com/#organization" },
  "sameAs": [
    "https://github.com/martyy-code",
    "https://x.com/martyy"
  ]
}
```

## Validation gotchas (Google Rich Results Test 2026)

1. **Date format must be ISO 8601 with timezone** — `2026-06-20T14:30:00+00:00` not `2026-06-20T14:30:00`
2. **`publisher.logo` must be a valid `ImageObject`** with crawlable URL ≥112×112px. A bare string fails.
3. **`author` must be a `Person` or `Organization` object, never a string** — `"author": "Jane Doe"` fails
4. **`author.name` must be name-only** — no job titles, no prefixes
5. **Multiple authors = array** — never concatenated string
6. **`image` must be array of crawlable URLs at multiple aspect ratios** ≥50K pixels each (width × height)
7. **Orphan entities invisible** — define Organization once with `@id`, reference everywhere
8. **Schema must match rendered content** — derive both from one source of truth, never hand-maintain
9. **`BreadcrumbList.itemListElement` ordered, `position` starting at 1, ≥2 items**
10. **XSS via `JSON.stringify`** — escape `<` to `<` for ANY user-influenced field (MDX body, FAQ text, post excerpts)
11. **`AggregateRating` requires credible third-party source** — self-serving stripped since late 2024
12. **`applicationCategory` enum values only** — `DeveloperApplication`, `BusinessApplication`, etc. Custom strings get rejected
13. **`Offer.priceValidUntil` always set** — evergreen offers surface stale prices in shopping answers
14. **Multiple `<script type="application/ld+json">` per page are fine** — Rich Results Test parses them all
15. **`mainEntityOfPage` for Article/BlogPosting** — set to `WebPage` with canonical `@id`

## Implementation order for DeesseJS

**Step 1 (1-2 hours):** Add `lib/json-ld.ts` + `Organization` site-wide
**Step 2 (1 hour):** Add `WebSite` to homepage + `BreadcrumbList` helper
**Step 3 (1-2 hours):** Add `BlogPosting` to `/blog/[slug]/page.tsx` (drives from content-collections)
**Step 4 (30 min):** Add `BreadcrumbList` + `BlogPosting` for changelog entries with `articleSection: "Release Notes"`
**Step 5 (1 hour):** Add `SoftwareApplication` to homepage and `/pricing` with the Founder tier offer
**Step 6 (1 hour, v1.1):** Add `FAQPage` to home FAQ block (if real content) + `Product` array on `/pricing`
**Step 7 (2 hours, v1.1+):** Build static `/authors/[handle]/page.tsx` with `Person` markup

**Total P0 effort: ~5-6 hours.**

## How to apply

- When asked "add SEO to the blog" — start with `lib/json-ld.ts` + Organization + BlogPosting (steps 1-3 above)
- When asked "wire changelog for SEO" — use `BlogPosting` with `articleSection: "Release Notes"` (step 4)
- When asked "should we add FAQPage?" — yes on v1.1 but ONLY where FAQ content is genuinely user-visible (don't ship filler schema)
- When debugging a Rich Results Test failure — walk through the 15 validation gotchas above

## Related memory

- `project-2026-saas-template-landscape.md` — JSON-LD noted as P1 for v1.1
- `reference-content-collections-next16-patterns.md` — patterns for the blog/changelog pages
- `reference-json-feed-patterns.md` — JSON Feed implementation (separate concern, similar JSON-LD date formats)
- `project-blog-engine-decision-2026-06-26.md` — why MDX + content-collections for the post pages