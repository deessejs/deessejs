# Company identity surface: `deessejs` pages + artificial-intelligence personal digital assistant artifacts <!-- vale fix: Microsoft.HeadingAcronyms --> <!-- vale fix: Microsoft.Terms -->

## Context

The deessejs main app monorepo hosts `apps/web`, the public site of `deessejs`. Started from [`deessejs/saas-template`](https://github.com/deessejs/saas-template). Today, there is **no page** that explains who `deessejs` is, what the company builds, or why. `apps/web/src/app/` only contains `blog`, `changelog`, `cookies`, `privacy`, `terms`, plus a landing template default. The landing `app/page.tsx` is still the starter boilerplate.

**Goal:** Add a "company identity" surface that is quickly readable by both humans (visitors, contributors, GitHub stars) and AI agents (LLM crawlers, coding agents consulting the docs). The surface can be filled in later, but the infrastructure (routes, JSON-LD, `llms.txt`, markdown mirrors) must be in place now.

**Decisions locked with the user:**
- Pages authored as **deessejs** (the company), not template-agnostic.
- Everything lives in `apps/web`.
- **Static**: no content-collections, no MDX, no build step. Data lives in `.ts` files.
- **English**.
- **Structured placeholders**: no copy-writing in this PR. Sections marked `REPLACE WITH COPY` / `TODO:`. <!-- vale fix: write-good.Weasel -->
- Scope "the more the better," every page and artifact that makes sense, without bloating. <!-- vale fix: Microsoft.Quotes -->

**What this plan explicitly excludes:** refactoring `apps/web/src/app/page.tsx` (landing still boilerplate), `apps/web/src/app/.well-known/agent-card.json` (A2A figure, reserved for real callable agents), `llms-full.txt` (consistent with Supabase's "small root, defer to docs"), `humans.txt`, `/.well-known/ai` (IETF draft, unstable).

## Recommended approach

**Single source of truth in TS, two renderings: `page.tsx` for HTML, an adjacent `route.ts` for Markdown.** No content negotiation in `route.ts` because a `page.tsx` and a `route.ts` can't coexist in the same App Router segment. <!-- vale fix: Microsoft.Contractions --> The choice is the adjacent segment `/about/markdown` (instead of `/about.md`): no Next.js rewrites needed, and `/about` stays the canonical HTML, inheriting the layout (header, footer, fonts).

**No `Accept: text/markdown` middleware.** Runtime cost on every request for 0.1% of LLM traffic. LLM crawlers fetch `/llms.txt` or `/about/markdown` directly. That's what gets surfaced for discovery. <!-- vale fix: Microsoft.Contractions --> <!-- vale fix: Microsoft.We -->

## Files to create

### HTML pages (server components)

```
apps/web/src/app/about/page.tsx          # GET /about: Hero + 5 placeholder sections
apps/web/src/app/principles/page.tsx     # GET /principles: Dated principles list
apps/web/src/app/team/page.tsx           # GET /team: Team card grid
```

Each `page.tsx`:
- `export const metadata: Metadata` with `title`, `description`, `alternates.canonical`, `robots` (noindex on placeholder copy: **No**, index now; copy may be light but an identity signal is much better than zero). <!-- vale fix: Microsoft.QuestionMarks -->
- Container `mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8` (between `max-w-2xl` legal and `max-w-6xl` blog, like the changelog).
- `H1`, `H2`, `P`, `Lead`, `Link` imported from `@workspace/ui/components/typography` (per `use-shadcn`).
- `<JsonLd>` helper (see below) for `WebPage` + `BreadcrumbList`.

### Markdown mirrors (route handlers)

```
apps/web/src/app/about/markdown/route.ts       # GET /about/markdown
apps/web/src/app/principles/markdown/route.ts  # GET /principles/markdown
apps/web/src/app/team/markdown/route.ts        # GET /team/markdown
```

Each `route.ts`:
- Calls the markdown renderer from `lib/site/markdown.ts` (same source as the HTML page).
- Returns `new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" } })`.
- No `Vary: Accept` needed (no negotiation).

### AI-agent artifacts

```
apps/web/src/app/llms.txt/route.ts     # GET /llms.txt: 300-800 word index
apps/web/src/app/.well-known/route.ts  # GET /.well-known/security.txt: RFC 9116
```

**`/llms.txt`** follows the strict spec (per Phase 1.B research):

```md
# deessejs

> One-paragraph mission statement. Add at build time.

We build modern SaaS infrastructure for developers, with opinionated starters,
production-ready defaults, and tools that compose. Deessejs is the company
behind [project A], [project B], and this very site.

## Docs

- [Getting started](https://deessejs.com/blog): short description

## Company

- [About](https://deessejs.com/about): who we are
- [Principles](https://deessejs.com/principles): how we build
- [Team](https://deessejs.com/team): who builds it

## Optional

- [Changelog](https://deessejs.com/changelog): what we ship
- [Blog](https://deessejs.com/blog): what we think
```

Content templated from `lib/site/llms-sections.ts`: a single human editor modifies this file and all pages update.

**`/.well-known/security.txt`**: RFC 9116 minimal:

```
Contact: mailto:security@deessejs.com
Expires: 2027-08-03T00:00:00.000Z
Preferred-Languages: en
```

The `route.ts` handles a `KNOWN: Record<string, Response>` map to support future additions (`mcp.json` when a callable agent exists).

### Single source of truth (TS data files)

```
apps/web/src/lib/site/identity.ts      # name, legalName, tagline, foundingDate, url, email, social[]
apps/web/src/lib/site/principles.ts    # Array<{ date, title, body }>
apps/web/src/lib/site/team.ts          # Array<{ name, role, bio, links[] }>
apps/web/src/lib/site/llms-sections.ts # Array<{ section, items: [{ name, url, description }] }>
apps/web/src/lib/site/markdown.ts      # renderAboutMarkdown(), renderPrinciplesMarkdown(), renderTeamMarkdown()
```

`identity.ts` exports a `SITE` object consumed by the layout (JSON-LD), the pages, and `llms.txt`. If someone adds `twitter.com/deessejs`, they add it **once**, and every surface picks it up.

`markdown.ts` is ~50 lines, no external library. Each function takes data, returns a string. Template-driven:

```ts
export function renderAboutMarkdown(): string {
  return [
    `# About ${SITE.name}`,
    ``,
    `> ${SITE.tagline}`,
    ``,
    `## Mission`,
    SITE.missionBody,
    ``,
    `## What we build`,
    SITE.productsBody,
    // ...
  ].join("\n")
}
```

### Shared components

```
apps/web/src/components/seo/json-ld.tsx           # <JsonLd data={...} />: server component
apps/web/src/components/site/identity-layout.tsx  # Shared wrapper: container + Breadcrumb
```

`<JsonLd>`:
```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

No `"use client"`: server component, JSON serialized at render time.

`<IdentityLayout>`:
```tsx
export function IdentityLayout({ children, breadcrumb }: {
  children: React.ReactNode
  breadcrumb: { label: string; href?: string }[]
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
          {breadcrumb.map((b, i) => (
            <BreadcrumbItem key={i}>
              <BreadcrumbSeparator />
              {b.href ? <BreadcrumbLink href={b.href}>{b.label}</BreadcrumbLink> : <BreadcrumbPage>{b.label}</BreadcrumbPage>}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {children}
    </div>
  )
}
```

## Files to modify

### Header nav: `apps/web/src/components/headers/site-header.tsx`

Append to `NAV_LINKS` (lines 9-13):

```ts
const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/principles", label: "Principles" },
]
```

Order chosen: content surfaces on the left, identity on the right. `Team` stays footer-only (quiet).

### Footer: `apps/web/src/components/footers/app-footer.tsx`

Add `<Link href="/about">About</Link>` inside the existing `<nav>`, after "Docs".

### Root layout: `apps/web/src/app/layout.tsx`

Add `<JsonLd data={ORGANIZATION_LD} />` inside `<body>` (before `<AppProviders>`). Data sourced from `lib/site/identity.ts`.

Existing `metadata`: `title: APP_CONFIG.name` → sufficient. No template needed because each page's title overrides via local `export const metadata`.

### Sitemap: `apps/web/src/app/sitemap.ts`

Append to `staticPages` (after line 8, before `blogPosts`):

```ts
// Company identity
{ url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
{ url: `${APP_URL}/principles`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
{ url: `${APP_URL}/team`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
{ url: `${APP_URL}/about/markdown`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
{ url: `${APP_URL}/principles/markdown`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
{ url: `${APP_URL}/team/markdown`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
{ url: `${APP_URL}/llms.txt`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
{ url: `${APP_URL}/.well-known/security.txt`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.1 },
```

### Robots: `apps/web/src/app/robots.ts`

**No changes.** `allow: "/"` already covers all new routes. **Do not** add `Disallow: /llms.txt` (Phase 1.B research forbids it).

## Placeholder strategy

Three markers, in a cascade of urgency:

| Marker | Where | Meaning |
|---|---|---|
| `REPLACE WITH COPY` | In `lib/site/*.ts` (data) | Urgent: factual copy (mission, dates, founders). grep-friendly. |
| `TODO:` | In `page.tsx` (sections) | Less urgent: editorial copy. |
| `<Muted>Placeholder for X, see TODO in lib/site/X.ts</Muted>` | On every section reading from data | In-page breadcrumb for the copywriter. |

`/about` pattern:
```tsx
<section>
  <H2>Mission</H2>
  <P>
    {/* TODO: 2-3 sentences. First sentence declarative, no marketing fluff.
        Example shape: "We build [X] for [Y] because [Z]." */}
  </P>
  <Muted>Placeholder for mission, see TODO in lib/site/identity.ts</Muted>
</section>
```

`/principles` pattern:
```ts
// lib/site/principles.ts
{
  date: "2026-08-01",
  title: "Principle placeholder 1",
  body: "REPLACE WITH COPY: one short paragraph stating a guiding belief. Date is the date this principle was adopted, not authored.",
}
```

## Endpoints to verify (post-implementation)

Run by a senior TypeScript engineer, in order:

```bash
# 1. Build
pnpm --filter web dev

# 2. HTML pages
curl -s http://localhost:3000/about         | grep -E '<h1|JsonLd'
curl -s http://localhost:3000/principles    | grep -E '<h1|JsonLd'
curl -s http://localhost:3000/team          | grep -E '<h1|JsonLd'

# 3. Markdown mirrors
curl -I http://localhost:3000/about/markdown
# Expected: 200 + content-type: text/markdown; charset=utf-8
curl -I http://localhost:3000/principles/markdown
curl -I http://localhost:3000/team/markdown

# 4. AI artifacts
curl -I http://localhost:3000/llms.txt
# Expected: 200, content-type: text/plain; charset=utf-8, 300-800 words
curl -I http://localhost:3000/.well-known/security.txt
# Expected: 200, content-type: text/plain; charset=utf-8

# 5. Sitemap
curl -s http://localhost:3000/sitemap.xml | grep -E 'about|principles|team|llms|well-known'
# Expected: 8 matching <loc> entries

# 6. Robots
curl -s http://localhost:3000/robots.txt
# Expected: User-agent: *\nAllow: /\nSitemap: <url>

# 7. JSON-LD validation
# Open view-source:http://localhost:3000/about, copy each <script type="application/ld+json">
# Paste into https://search.google.com/test/rich-results, no errors.

# 8. Lint + typecheck
pnpm --filter web lint
pnpm --filter web typecheck
```

Final manual check: open `/about` and `/about/markdown` side-by-side. The facts must be identical (both read from `lib/site/identity.ts`).

## Explicit trade-offs

1. **URL `/about/markdown` instead of `/about.md`.** App Router constraint (`page.tsx` + `route.ts` in the same segment = error). We accept a slightly different URL to keep `page.tsx` as the canonical HTML (which inherits the layout, fonts, header, footer). Agents that hardcode `.md` will miss the mirror, but `llms.txt` points to the HTML URL, so they follow.
2. **No `Accept: text/markdown` content negotiation.** Middleware cost on every request for 0.1% of traffic. The Cloudflare/Vercel spec is otherwise satisfied (the Markdown mirror has `Content-Type: text/markdown`).
3. **No MDX, no content-collections, no `remark`.** User's choice. Trade-off: a non-engineer copywriter must edit `.ts` strings. Mitigation: `REPLACE WITH COPY` markers are grep-friendly.
4. **Team page = 4-row placeholder.** When the team grows, either bump the cap or move to MDX. The structure (card grid) stays.
5. **No `mcp.json`, no `agent-card.json`, no `humans.txt`.** `/.well-known/route.ts` is designed to host a future `mcp.json` when a callable agent exists.
6. **Landing `app/page.tsx` not touched.** Still boilerplate. Explicit scope: identity routes, not hero.

## Decisions taken in plan (not re-asked)

| Open question (Plan agent) | Decision | Reason |
|---|---|---|
| Add `/method` page? | No | Phase 1.A calls it "optional"; `/principles` already plays that role. |
| `legalName` of deessejs? | Placeholder `"Deessejs, Inc."` | User will copy the real value. Better than a `null` that breaks Schema.org. |
| Social handles in JSON-LD `sameAs`? | Yes, empty array `[]` | Schema.org is valid without `sameAs`. Later: add GitHub org. |
| `foundingDate`? | Absent from JSON-LD | Missing field is better than wrong value. |
| `/.well-known/security.txt`? | Yes | 2 lines, RFC 9116, hygiene. |
| `/team` in header nav? | No, footer-only | Stay quiet while the team is small. |
| Index pages (robots)? | **Yes** | `terms/privacy/cookies` use `index:false`, but these pages carry real copy useful to agents. Override the default. |

## Critical files

- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\app\layout.tsx`: root JSON-LD injection
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\lib\site\identity.ts`: single source of truth; everything else depends on it
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\lib\site\markdown.ts`: markdown renderer reused by `/about/markdown`, `/principles/markdown`, `/team/markdown`
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\components\seo\json-ld.tsx`: `<JsonLd>` server component used by layout + every page
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\components\headers\site-header.tsx`: `NAV_LINKS` array (l. 9-13) controls desktop + mobile nav order
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\app\sitemap.ts`: `staticPages` (l. 6-55) receives the new entries
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\src\app\robots.ts`: **not modified**; verify only
