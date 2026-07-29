# 22. SEO

> SEO across marketing site, blog, docs, and public API. Baseline is meta + OG + sitemap. The differentiators are JSON-LD structured data, rich snippets, and Lighthouse SEO audit in CI (blocks PRs that regress).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 22.1 | Meta tags (title, description, keywords) | ✅ | C | Next.js metadata API, per-page |
| 22.2 | Open Graph tags | ✅ | C | og:title, og:description, og:image, og:url, og:type |
| 22.3 | Twitter cards | ✅ | C | summary, summary_large_image |
| 22.4 | JSON-LD structured data | ✅ | D | Organization, Product, Article, FAQ, BreadcrumbList, HowTo, SoftwareApplication |
| 22.5 | Sitemap (XML) | ✅ | C | Pages + blog posts + docs |
| 22.6 | Sitemap index (multiple sitemaps) | ✅ | U | For sites with many sections |
| 22.7 | robots.txt | ✅ | C | Per-environment (staging blocks) |
| 22.8 | Canonical URLs | ✅ | C | Prevent duplicate content |
| 22.9 | Hreflang tags | 🔵 | — | v2 with i18n. en only in v1. |
| 22.10 | 404 page (helpful) | ✅ | C | Search box, popular links, support link |
| 22.11 | 500 page (helpful) | ✅ | C | Status link, support link |
| 22.12 | Server-side redirects (with logging) | ✅ | C | 301 / 302 / 307, logged for monitoring |
| 22.13 | Rich snippets (FAQ, HowTo, Product) | ✅ | D | JSON-LD per content type, validated |
| 22.14 | Image alt text enforcement | ✅ | C | Lint rule, blocks PR without alt |
| 22.15 | Heading hierarchy (h1 → h6) | ✅ | C | Lint rule |
| 22.16 | SEO audit (Lighthouse SEO category) | ✅ | D | CI pass, blocks PR below threshold. **Most templates don't ship.** |
| 22.17 | Per-page metadata | ✅ | C | Next.js metadata API, type-safe |
| 22.18 | Social sharing preview (debug tool) | ✅ | U | `/og-debug?url=...` shows what Twitter / Facebook see |
| 22.19 | News sitemap (for blog) | ✅ | U | Google News inclusion |
| 22.20 | Image sitemap | ✅ | U | For image-heavy content |
| 22.21 | AMP | ⚪ | — | Deprecated by Google. Skip. |
| 22.22 | PWA manifest | 🟡 | — | Related but separate. PWA is opt-in. |
| 22.23 | Page speed (Lighthouse ≥ 90) | ✅ | C | Per 19.11 |
| 22.24 | Mobile-friendly | ✅ | C | Per 10.21 |
| 22.25 | Core Web Vitals monitoring | ✅ | D | LCP, FID, CLS measured in CI. **Most templates don't ship.** |
| 22.26 | IndexNow (instant indexing) | 🟡 | U | Optional; tells search engines about new content immediately |
| 22.27 | Schema.org validation (CI) | ✅ | C | JSON-LD validated against schema.org |
| 22.28 | Internal linking suggestions | ⚪ | — | v2. Buyer can wire Yoast-like tools. |

**Notes:**
- 22.1-22.8 are baseline. Most templates ship 22.1, 22.2, 22.3, 22.5, 22.7, 22.8.
- 22.4 (JSON-LD) and 22.13 (rich snippets) are differentiators — most templates skip structured data entirely.
- 22.16 (Lighthouse SEO audit in CI) and 22.25 (Core Web Vitals in CI) are the wedge proof for SEO discipline. They make "we ship good SEO" a CI-enforced claim, not a marketing claim.
- 22.18 (social sharing debug) is small but valued by marketing teams — they can preview before publishing.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../positioning.md`](../positioning.md) — long-tail SEO strategy (completeness + DX keywords)
- Related: [15-blog.md](./15-blog.md) — 15.5 blog SEO
- Related: [16-marketing-and-sales.md](./16-marketing-and-sales.md) — 16.8 marketing site SEO
- Related: [14-documentation.md](./14-documentation.md) — docs are indexed
- Related: [10-ui.md](./10-ui.md) — 10.21 mobile responsive
- Related: [19-performance-and-dx.md](./19-performance-and-dx.md) — 19.11 Lighthouse in CI
- Related: [12-i18n.md](./12-i18n.md) — 22.9 hreflang deferred with i18n
