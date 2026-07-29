# Templates gallery — web app routes

The **gallery** is one of the three surfaces of the DeesseJS templates library. It lives in `apps/web/src/app/templates/*` and is the primary UX for humans discovering templates. Date: 2026-07-02.

## Purpose

Document the gallery's route structure, page inventory, data source, filtering UX, rendering strategy, SEO requirements, and edge cases. The index lives in [`templates-library.md`](./templates-library.md). The conversion component (the `<DeployButton>`) lives in [`deploy-button.md`](./deploy-button.md).

## Route structure

```
apps/web/src/app/templates/
├── layout.tsx                            # layout for all /templates/* routes
├── page.tsx                              # gallery landing — filterable grid of cards
├── loading.tsx                           # skeleton for the grid
├── error.tsx                             # error boundary
├── not-found.tsx                         # 404 for /templates
├── [slug]/
│   ├── page.tsx                          # individual template page (hero + deploy + features)
│   ├── loading.tsx
│   ├── opengraph-image.tsx               # auto-generated OG image via ImageResponse
│   └── not-found.tsx                     # when [slug] doesn't match a registered template
├── compare/
│   └── page.tsx                          # M0.2 — compare 2-3 templates side by side
├── feed.xml/
│   └── route.ts                          # RSS feed of new templates (M2)
├── feed.json/
│   └── route.ts                          # JSON Feed of new templates (M2)
├── sitemap.ts                            # generates /templates/sitemap.xml
└── submit/
    └── page.tsx                          # M3+ — submit external template form
```

All routes are **server components** by default. Filters in `page.tsx` are URL-driven (no client state). Search (when added in M0.2) is the only client-side feature.

## Routes and their contracts

### `/templates` — gallery landing

The grid view with filters. The user lands here from:
- The marketing site's primary nav (`Templates` link in the top bar)
- A direct share of a filtered URL (`/templates?useCase=saas&framework=nextjs`)
- An OG card share from a specific template (back-button-like behavior)

**Components used**:
- `<TemplateGrid>` — server component, takes the filtered list as prop
- `<TemplateCard>` — clickable card showing OG image, name, description, framework badge, Use Case badges
- `<TemplateFilters>` — server component rendering `<FilterCheckbox>` per axis (client components for the toggle state)
- `<TemplateSearch>` — M0.2, the search input (client component, Fuse.js)

**URL state**:
```
/templates?useCase=saas,blog&framework=nextjs
/templates?useCase=saas&framework=nextjs&query=stripe
```

State lives in URL searchParams. Filter changes push a new URL via `useRouter().replace()` on the client (no full reload). Shareable. Agent-readable.

**Empty state**: if no templates match the filter combination, show:
```
No templates match these filters.

[Clear filters]  [See all templates]
```

Polished UX is a non-negotiable — this is part of the public marketing surface.

### `/templates/[slug]` — individual template page

The hero page for one template. Layout: hero with OG image + name + description + deploy button, then features list, then stack, then related templates, then changelog link.

**Data source**: `getTemplateBySlug(slug)` reads from the registry repo (see `data-source` below).

**Components used**:
- `<TemplateHero>` — full-width image + name + framework badge + **CTA row** with `<DeployButton>` (primary) and `<DemoButton>` (secondary, if demo URL exists). Above the fold.
- `<DeployButton>` — the conversion CTA, always present. See [`./deploy-button.md`](./deploy-button.md).
- `<DemoButton>` — the friction-free "see it first" CTA. Only rendered if `manifest.json.demo` is set. See [`./demo-button.md`](./demo-button.md).
- `<TemplateFeatures>` — bullet list from `manifest.json` features array
- `<TemplateStack>` — chips listing `framework`, `database`, `auth`, `services` (derived from package.json or manifest.json)
- `<TemplateRelated>` — sibling templates (from `manifest.json.relatedTemplates` or computed similarity)
- `<TemplateChangelog>` — link to GitHub Releases of the template repo

**The CTA row**:

```
┌──────────────────────────────────┐  ┌─────────────────────────────────┐
│   Deploy to Vercel →             │  │   See live demo ↗              │
└──────────────────────────────────┘  └─────────────────────────────────┘
   primary (filled, black)            secondary (outlined, white)
   always rendered                    rendered only if manifest.demo is set
```

The hero copy above the CTA row sets up the choice: "Deploy to fork and customize, or see the live demo first to know what you're getting." This is the moment of choice — two buttons, two intents. See [`./demo-button.md`](./demo-button.md) for the visual specs and the "friction-free" rationale.

**OG image**: `[slug]/opengraph-image.tsx` generates a 1200×630 image dynamically via `ImageResponse` from `@vercel/og`. Takes the template's name + logo color from the manifest.

**Pre-rendering**: at build, all known template slugs are pre-rendered (no client-side fetching for first paint). `generateStaticParams` returns the slugs from the registry. ISR re-validates every 1h to pick up registry updates.

### `/templates/sitemap.xml` — sitemap

Generated at request time (not build) so it picks up newly added templates without rebuild. Format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://deessejs.com/templates</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://deessejs.com/templates/starter</loc>
    <lastmod>2026-07-01T00:00:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

Each template page includes `lastmod` from the template's GitHub repo last commit date.

### `/templates/feed.json` — JSON Feed (agent-readable)

Critical per the agent-first thesis. Format per the JSON Feed v1.1 spec:

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "DeesseJS Templates",
  "home_page_url": "https://deessejs.com/templates",
  "feed_url": "https://deessejs.com/templates/feed.json",
  "items": [
    {
      "id": "starter@v0.3.0",
      "url": "https://deessejs.com/templates/starter",
      "title": "Starter — Auth + DB + mail",
      "content_text": "...",
      "date_published": "2026-07-01T00:00:00.000Z",
      "tags": ["saas", "next.js", "auth", "database"]
    }
  ]
}
```

### `/templates/compare` — M0.2 side-by-side comparison

Takes `?ids=a,b,c` and renders a table:

| Feature | `starter` | `lite` | `minimal` |
|---|---|---|---|
| Auth (Better Auth) | ✅ | ✅ | ❌ |
| Database (Postgres) | ✅ | ❌ | ❌ |
| Mail (Resend) | ✅ | ❌ | ❌ |
| Blog engine | ✅ | ❌ | ❌ |
| Billing (Stripe) | ✅ | ✅ | ❌ |
| Framework | Next.js | Next.js | Next.js |
| Estimated LOC | ~12k | ~6k | ~3k |

Comparison data comes from the manifest's `features` array + computed stats (LOC from GitHub API, deployments from Vercel post-MVP).

## Data source

The gallery reads from **`deessejs/templates-registry`**, a separate repo with this layout:

```
deessejs/templates-registry/
├── README.md
├── templates/
│   ├── starter.json                       # the manifest.json from apps/template/
│   ├── minimal.json                       # the manifest.json from template-minimal
│   └── lite.json                          # the manifest.json from apps/lite
├── screenshots/
│   ├── starter.png                        # OG image for /templates/starter
│   ├── starter-hero.png                   # hero image for the template page
│   └── ...
└── schema/
    └── template.schema.json               # JSON Schema for validation (CI uses it)
```

Each `templates/*.json` is identical to the `manifest.json` at the root of the corresponding template repo. Adding a `templates-registry` symlink or copy is part of the template publication flow.

### Loading strategy

```ts
// apps/web/src/lib/templates/registry.ts (sketch)

import { Octokit } from '@octokit/rest'

const REGISTRY_REPO = 'deessejs/templates-registry'

export async function getAllTemplates(): Promise<TemplateManifest[]> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const { data } = await octokit.repos.getContent({
    owner: REGISTRY_REPO.split('/')[0],
    repo: REGISTRY_REPO.split('/')[1],
    path: 'templates',
  })
  // fetch each *.json file in parallel
  // ...
}

export async function getTemplateBySlug(slug: string): Promise<TemplateManifest | null> {
  // ...
}

export async function getScreenshotUrl(slug: string, variant: 'og' | 'hero'): Promise<string> {
  // returns https://raw.githubusercontent.com/deessejs/templates-registry/main/screenshots/<slug>-<variant>.png
}
```

**Caching**: next.js `unstable_cache` wraps each function with a 1h TTL and tag-based invalidation. When a PR merges into `templates-registry`, a webhook hits `/api/revalidate?tag=templates` to purge.

**Offline**: the function gracefully returns an empty array if GitHub is unreachable (display "temporarily unavailable" empty state, not a 500).

### Local dev override

For development, the function checks `process.env.TEMPLATES_REGISTRY_DIR` — if set, reads from that local directory instead of GitHub. Lets engineers iterate on the gallery UI without pushing to the registry first.

## Filtering UX

### Two-axis filtering

| Axis | Options (MVP) | Source |
|---|---|---|
| **Use Case** | SaaS, Blog, Marketplace, Documentation, Starter, Internal Tool, ... | `manifest.json.useCase` |
| **Framework** | Next.js, Hono, ... (whatever's in `manifest.json.framework`) | `manifest.json.framework` |

Multi-select on each axis. Combinable: `(useCase=saas,blog) × framework=next.js` returns SaaS + Blog templates that use Next.js.

**Registry must declare enough taxonomy** — if a template has no `useCase` set, it's discoverable via search but not by filter. (Missing taxonomy = missing taxonomy, not a filter bug.)

### URL state

```
/templates?useCase=saas,blog&framework=nextjs
```

Multi-value searchParams (comma-separated). Reasoning:
- **Multi-value**: lets one URL express "SaaS OR blog", which users want for comparison
- **Comma-separated**: works with `URLSearchParams.getAll()` cleanly; survives copy-paste; standard HTTP
- **Not slugs**: `uc=saas-blog` would lose the multi-select semantics

Alternative considered: `?useCase=saas&useCase=blog` (one param repeated). Rejected because it's harder to read in tooltips and harder to roundtrip through curl for agents.

### Filter UX rules

- Filters update the URL **without page reload** (`router.replace` on the client)
- "Clear all" link at the top of the filters
- Selected filters visible at the top of the page with an "×" to remove each
- URL is always shareable. The "Copy link" button copies `window.location.href` to clipboard
- Empty state when 0 results (see above)
- Filter state survives navigation (back button restores previous filter combinations)

## Rendering strategy

| Page | Strategy | Justification |
|---|---|---|
| `/templates` (gallery) | ISR with 1h revalidate | The grid is data-driven (registry), changes rarely, must be fast for users |
| `/templates/[slug]` (individual) | ISR with 1h revalidate + `generateStaticParams` | Pre-renders all known templates; rev when registry updates |
| `/templates/[slug]/opengraph-image.tsx` | Dynamic (no cache) | OG images are cheap to compute and rarely requested |
| `/templates/feed.json` | Dynamic (no cache) | Must reflect latest template additions |
| `/templates/sitemap.xml` | Dynamic (no cache) | Same as feed |

**On-demand revalidation**: a webhook from the `templates-registry` repo hits `/api/revalidate?tag=templates` (token-protected) to invalidate the cache when a new template lands or an existing one is updated. The webhook is configured via GitHub App or deploy key.

## SEO requirements

These are the non-negotiable SEO requirements every page in `/templates/*` must hit:

| Requirement | Implementation |
|---|---|
| **`<title>` and `<meta description>`** | `generateMetadata` per page, derived from `manifest.json.name` and `description` |
| **Canonical URL** | `<link rel="canonical" href="...">` |
| **OG image** | Auto-generated via `[slug]/opengraph-image.tsx` (1200×630) |
| **Twitter card** | `summary_large_image` with the same OG image |
| **JSON-LD structured data** | `SoftwareApplication` schema per template page (per memory `reference-json-ld-patterns.md`) |
| **Sitemap entry** | Every template page is in `/templates/sitemap.xml`, priority 0.9 |
| **Robots** | Allowed by default. No `noindex` on templates. |
| **Hreflang** | Bilingual hreflang tags once FR ships (M2) |
| **Page speed** | LCP target < 1.5s on a fresh gallery, < 1s on a cached individual page |

The SEO config matches the rest of the marketing site. Reuse the patterns from `apps/web/src/app/(marketing)/`.

## i18n

- **MVP**: EN only. The page-level copy is in `messages/en/templates.json`.
- **M0.2**: Add FR. The structure already supports both locales; we just translate.
- All filter labels, "Deploy" button text, "View on GitHub", "Clear filters" — all routed through `next-intl`.

The `manifest.json` fields (`name`, `description`, `features`) are language-agnostic at MVP (English only). A future v2 could allow `name.en`, `name.fr` in the manifest for full bilingualism.

## Analytics

Tracked events (Plausible):

| Event | Where | Why |
|---|---|---|
| `template_viewed` | `[slug]/page.tsx` mount | Know which templates get attention |
| `deploy_clicked` | `<DeployButton>` click | The conversion event — primary KPI for the gallery |
| `filter_changed` | `<TemplateFilters>` toggle | Know which filters users actually use |
| `search_query` | M0.2, `<TemplateSearch>` submit | Know what users search for (informs future template addition) |
| `compare_started` | M0.2, "Compare" toggle on card | Engagement signal |
| `external_link_clicked` | GitHub / Demo links on template page | Off-site engagement |

The `deploy_clicked` event is the **north-star metric** for the templates library. If a template gets views but no deploy clicks, either the description is unclear or the deploy flow has friction.

## Edge cases and error states

| Scenario | Behavior |
|---|---|
| Registry unreachable | Gallery shows "temporarily unavailable" empty state, not 500 |
| Manifest schema invalid | Template is excluded from the grid, error logged, Slack alert (post-MVP) |
| Deploy URL parameters invalid | Deploy button is disabled with tooltip "This template has a broken config" |
| Template has no screenshot | Card uses a generic DeesseJS placeholder image |
| User clicks Deploy but is offline | Their browser handles — Vercel's flow starts when they're back |
| Private template (post-MVP) | Deploy button replaced with "Request access" form |

## Boundaries — what this folder doesn't cover

- The registry repo (its own folder under `12-apps/`)
- The `manifest.json` schema (in [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md))
- The CLI consumption of the registry (in [`../12-apps/cli/`](../12-apps/cli/))
- The `<DeployButton>` component contract (in [`./deploy-button.md`](./deploy-button.md))
- DeesseJS Cloud's Vercel Marketplace integration (lives in `documents/internal/product/cloud/` if/when it ships)
- The blog surface ([`15-blog.md`](../../product/features/15-blog.md)) which is similar but separate

## Cross-references

- [`./templates-library.md`](./templates-library.md) — index doc
- [`./deploy-button.md`](./deploy-button.md) — the conversion component (commit path)
- [`./demo-button.md`](./demo-button.md) — the friction-free sibling component (peek path)
- [`./pages.md`](./pages.md) — current page inventory (M1 priority markers align)
- [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md) — the `manifest.json` schema, including the `demo` field
- [`../12-apps/cli/architecture.md#agent-first-contract`](../12-apps/cli/architecture.md#agent-first-contract) — why the gallery is agent-readable (JSON Feed, parseable URLs, etc.)
- [`../01-stack/nextjs.md`](../01-stack/nextjs.md) — Next.js conventions (App Router, ISR, `generateStaticParams`)
- [`../01-stack/`](../01-stack/) — full tech matrix
- [`../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md`](../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md) — the Vercel research (specifically the live-demo pattern)
