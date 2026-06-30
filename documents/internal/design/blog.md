# Blog design spec — DeesseJS marketing site

> Design specification for the blog + release notes feature on `apps/web/` (DeesseJS marketing site).
> Implementation source of truth: spec `15-blog.md` (engine choice, file structure).
> This doc covers the visual + interaction layer.

**Status:** Draft v1 — pending review before Phase 1 code.
**Owner:** head-of-design
**Last updated:** 2026-06-26

---

## 1. Principles

Five load-bearing principles. Every design decision in this doc traces back to one of these.

1. **Long-form first.** The post detail page is a reading experience. Everything else — chrome, cards, badges — recedes so the words dominate. Reading width is capped at ~70ch. Line-height 1.7+. Body type is the largest in the design system.

2. **Quiet chrome.** Post listings should feel curated, not streamed. Generous whitespace, restrained color, no decorative gradients or shadows. Cards have a single 1px border; nothing else competes with the title.

3. **Type-driven hierarchy.** The post page has no visual ornament beyond type scale and color. No icons in body copy. No decorative dividers. Whitespace + tracking + weight carry the structure.

4. **Semantic motion.** Transitions communicate state changes (hover, focus, route entry). Nothing decorates. Hover lifts are 2px max. Duration 150ms. Easing `ease-out`. `prefers-reduced-motion` disables transforms.

5. **Every post is a showcase.** DeesseJS sells itself through the blog. Posts are written in MDX so we can use our own `<Callout>`, `<Figure>`, `<Comparison>` components — visible proof that the design system works in long-form. No copy-pasted shadcn defaults.

---

## 2. Color & category palette

The release notes feature (Keep a Changelog convention) needs 6 semantic category colors. These are **new tokens** that don't exist in the current design system — they get added to `packages/ui/src/styles/globals.css` under `@theme inline`.

### Mapping

| Category | Token | Light | Dark | Icon (lucide) |
|---|---|---|---|---|
| Added | `--color-added` | `oklch(0.696 0.17 162.48)` (emerald) | `oklch(0.696 0.17 162.48)` | `Plus` |
| Changed | `--color-changed` | `oklch(0.623 0.214 259.815)` (blue) | `oklch(0.623 0.214 259.815)` | `ArrowRight` |
| Fixed | `--color-fixed` | `oklch(0.551 0.027 264.364)` (neutral) | `oklch(0.707 0.022 261.325)` | `Wrench` |
| Removed | `--color-removed` | `oklch(0.637 0.237 25.331)` (red) | `oklch(0.637 0.237 25.331)` | `Minus` |
| Deprecated | `--color-deprecated` | `oklch(0.769 0.188 70.08)` (amber) | `oklch(0.769 0.188 70.08)` | `AlertTriangle` |
| Security | `--color-security` | `oklch(0.606 0.25 292.717)` (purple) | `oklch(0.606 0.25 292.717)` | `Shield` |

### Why these specific colors

- Picked from the **Tailwind v4 default palette** (already battle-tested for AA contrast on white/black).
- `oklch()` values preserve Display P3 on supporting browsers, fall back gracefully on sRGB.
- Dark mode uses the same tokens (the colors are mid-luminance, work on both backgrounds). Where needed, the **dark variant** gets a slightly lighter fixed color (the neutral needs more contrast on black).
- Each color is used **only** as background fill of the badge with a derived foreground (`color-mix(in oklch, var(--color-X) 15%, var(--foreground))`). We never use the raw color as text or border.

### New tokens to add (under `@theme inline` in `globals.css`)

```css
--color-added: oklch(0.696 0.17 162.48);
--color-changed: oklch(0.623 0.214 259.815);
--color-fixed: oklch(0.551 0.027 264.364);
--color-removed: oklch(0.637 0.237 25.331);
--color-deprecated: oklch(0.769 0.188 70.08);
--color-security: oklch(0.606 0.25 292.717);

.dark {
  --color-fixed: oklch(0.707 0.022 261.325);
}
```

### Open question

**Q1.** Should the 6 categories have light/dark variants for the foreground (`color-mix` percentage), or always use the same `--foreground`? Default: derive per-category via `color-mix(in oklch, var(--color-X) 15%, var(--foreground))`. This gives each category a slight tint, makes the badges more recognizable.

---

## 3. Long-form typography

The post detail page is the most important surface of the blog. Typography decisions here:

### Body

- **Size**: `17px` mobile, `18px` desktop (1.0625rem / 1.125rem). Slightly larger than the marketing copy.
- **Line height**: `1.75` (loose for readability).
- **Font**: `--font-sans` (Geist, already loaded in `layout.tsx`).
- **Color**: `--foreground`.
- **Max width**: `42rem` (672px). Optimal reading width is 60-75ch; 42rem ≈ 70ch at 18px Geist.

### Headings

| Level | Size (mobile → desktop) | Weight | Tracking | Margin top | Margin bottom |
|---|---|---|---|---|---|
| h1 | `text-4xl → text-5xl` | `font-bold` | `tracking-tighter` | `mt-0` | `mb-8` |
| h2 | `text-3xl → text-4xl` | `font-semibold` | `tracking-tight` | `mt-16` | `mb-4` |
| h3 | `text-2xl → text-3xl` | `font-semibold` | `tracking-tight` | `mt-12` | `mb-3` |
| h4 | `text-xl` | `font-semibold` | `tracking-tight` | `mt-8` | `mb-2` |
| h5 | `text-lg` | `font-semibold` | `tracking-tight` | `mt-6` | `mb-2` |
| h6 | `text-base` | `font-semibold` (uppercase tracking-wider optional) | `tracking-wide` | `mt-6` | `mb-2` |

**Anchors**: h2-h6 get an `id` derived from text (slugified), and a hover-only `#` link to the left of the heading. Implemented via MDX components override.

### Body elements

| Element | Style |
|---|---|
| `<p>` | `mt-6 first:mt-0` — no margin on first paragraph after heading |
| `<a>` | `text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground/60` — internal links get `next/link`, external get `target="_blank"` |
| `<ul>` / `<ol>` | `my-6 ml-6 list-outside` — `ul` uses `list-disc`, `ol` uses `list-decimal`. Marker color inherits from text |
| `<li>` | `mt-2` — loose spacing between items |
| `<blockquote>` | `my-8 border-l-2 border-foreground/20 pl-6 italic text-muted-foreground` |
| `<hr>` | `my-12 border-border/40` |
| `<code>` (inline) | `font-mono text-[0.9em] bg-muted/50 px-1.5 py-0.5 rounded` |
| `<pre>` (block) | Shiki output — no override needed, inline styles win |
| `<img>` | `my-8 rounded-lg border border-border/40` (auto via MDX components override) |
| `<figure>` | `my-8` (wrapper) |
| `<figcaption>` | `mt-3 text-sm text-muted-foreground text-center` |

### Tables

- `my-8 w-full text-sm`
- Header row: `border-b border-border/60 font-semibold`
- Body rows: `border-b border-border/30`
- Cell padding: `py-3 px-4 text-left`

### Code blocks

- Already wired via Shiki (`github-dark` theme).
- Inline padding `p-4`, no border (Shiki's `<pre>` already has background).
- Horizontal scroll if too wide.
- Copy button: deferred to Phase 4 (nice-to-have, not core).

---

## 4. Five primitives

These are the foundational components. Every blog surface composes them.

### 4.1 PostCard

**Used in**: blog index, tag pages, author pages, related posts block, search results.

**Props**:
- `post` — typed `Post` (from `content-collections`)
- `variant` — `'hero' | 'compact' | 'text-only'` (default `'compact'`)
- `showDescription` — `boolean` (default `true`)
- `showCover` — `boolean` (default `true`)
- `showAuthor` — `boolean` (default `true`)
- `priority` — `boolean` for `next/image` priority (first card on index = `true`)

**Variants**:

**compact** (default — used in grid):
```
┌─────────────────────────────────────┐
│ [cover image, 16:9, rounded-lg]     │  ← only if showCover && post.cover
├─────────────────────────────────────┤
│ [tag] [tag] [tag]                   │  ← TagChip list, text-xs
│                                     │
│ Title (text-xl font-semibold,       │  ← clamp 2 lines
│ tracking-tight)                     │
│                                     │
│ Description (text-sm muted,         │  ← clamp 2 lines
│ line-clamp-2)                       │
│                                     │
│ ─                                   │
│ [avatar] Author · Jan 1 · 8 min    │  ← AuthorByline inline
└─────────────────────────────────────┘
```

**hero** (used for the most recent post on /blog index):
```
┌──────────────────────────────────────────────────┐
│  [cover image, 21:9, full-bleed inside card]     │
├──────────────────────────────────────────────────┤
│  [tag] [tag]                                     │
│                                                  │
│  Title (text-3xl md:text-4xl font-bold,          │
│  tracking-tighter)                               │
│                                                  │
│  Description (text-base muted, line-clamp-3)     │
│                                                  │
│  ─                                               │
│  [avatar] Author · Jan 1 · 12 min               │
└──────────────────────────────────────────────────┘
```

**text-only** (for posts without cover, used when `showCover={false}`):
```
┌─────────────────────────────────────┐
│ [tag] [tag]                         │
│                                     │
│ Title (text-2xl font-semibold)      │
│                                     │
│ Description                         │
│                                     │
│ ─                                   │
│ [avatar] Author · Jan 1 · 5 min    │
└─────────────────────────────────────┘
```

**Container**: `border border-border/40 rounded-2xl overflow-hidden bg-card/30 transition-all duration-150`

**Hover**: `hover:border-foreground/20 hover:-translate-y-0.5 hover:shadow-md`

**Focus**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**Edge cases**:
- Post without cover → fall back to `text-only` variant visually (even if `compact` was passed)
- Title > 2 lines → `line-clamp-2`
- Description missing → hide that row
- Author missing avatar → show initials placeholder (2 letters from `name`)
- Reading time = 0 → hide (very short posts)

### 4.2 AuthorByline

**Used in**: top of post detail page, inside PostCard footer.

**Props**:
- `author` — typed `Author`
- `date` — `string` (ISO date)
- `readingTime` — `number` (minutes)
- `updated` — `string?` (ISO date, optional)
- `size` — `'sm' | 'md'` (default `'md'`)
- `showAvatar` — `boolean` (default `true`)
- `linkToAuthor` — `boolean` (default `true` on post detail, `false` inside PostCard to avoid double-link)

**Layout (md size)**:
```
┌──────────────────────────────────────────────────┐
│ [avatar 40px]  Author Name                        │
│               Jan 1, 2026 · 8 min read           │
│               Updated Jan 15, 2026 (optional)     │
└──────────────────────────────────────────────────┘
```

**Layout (sm size, used in cards)**:
```
[avatar 24px] Author · Jan 1 · 8 min
```

**Avatar fallback**: If `author.avatar` is missing, show 2-letter initials on a muted background (`bg-muted text-muted-foreground`).

**Accessibility**: Avatar is `aria-hidden` if decorative. Author name is the primary text. If `linkToAuthor`, the whole byline is wrapped in a `<Link>` with `aria-label="Posts by {author.name}"`.

**Edge cases**:
- Author without `bio` → just name, no subtitle
- Updated same as date → don't show updated line
- Reading time < 1 → show "< 1 min" instead of "0 min"

### 4.3 CategoryBadge

**Used in**: changelog detail page (each category section), changelog index (per release card).

**Props**:
- `category` — `'added' | 'changed' | 'fixed' | 'removed' | 'deprecated' | 'security'`
- `size` — `'sm' | 'md'` (default `'sm'`)
- `showIcon` — `boolean` (default `true`)

**Layout**:
```
┌─────────────┐
│ [+] Added   │  ← icon + label, pill
└─────────────┘
```

**Styling per category**:
- Background: `bg-[var(--color-X)]/15`
- Foreground: `text-[var(--color-X)]` (or `color-mix(in oklch, var(--color-X) 80%, var(--foreground))` for more contrast)
- Border: `border border-[var(--color-X)]/20`
- Padding: `px-2.5 py-0.5` (sm), `px-3 py-1` (md)
- Font: `text-xs font-medium` (sm), `text-sm font-medium` (md)
- Radius: `rounded-full`
- Icon: `h-3 w-3` (sm), `h-3.5 w-3.5` (md), `aria-hidden`

**States**: static (no hover state needed).

**Edge cases**:
- Unknown category → render plain text, no color (defensive)
- Empty label → don't render (shouldn't happen, schema enforces enum)

### 4.4 TagChip

**Used in**: PostCard (top row), post detail (bottom), tag pages.

**Props**:
- `tag` — `string`
- `href` — `string` (optional, defaults to `/blog/tag/${tag}`)
- `active` — `boolean` (default `false`, set to `true` when on the tag's own page)
- `size` — `'xs' | 'sm'` (default `'xs'`)

**Layout**:
```
┌──────────┐
│ #react   │  ← hash prefix, low contrast
└──────────┘
```

**Styling**:
- Default: `text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/30`
- Hover: `hover:text-foreground hover:border-foreground/30 hover:bg-muted/50`
- Active (current tag): `text-foreground border-foreground/30 bg-foreground/5`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`

**Edge cases**:
- Empty tag string → don't render
- Very long tag (>20 chars) → truncate with ellipsis

### 4.5 ReadingTime

**Used in**: PostCard footer, AuthorByline, anywhere we show post meta.

**Props**:
- `minutes` — `number`
- `showIcon` — `boolean` (default `true`)
- `size` — `'sm' | 'md'` (default `'sm'`)

**Layout (sm)**:
```
[clock icon] 8 min read
```

**Styling**:
- `text-xs text-muted-foreground` (sm), `text-sm text-muted-foreground` (md)
- Icon: `h-3 w-3 mr-1` (inline with text)
- Icon: `lucide-react` `Clock`

**Edge cases**:
- 0 minutes → "< 1 min read"
- Exactly 1 → "1 min read" (singular)

---

## 5. Three page templates

### 5.1 /blog (index)

```
┌──────────────────────────────────────────────────┐
│  The DeesseJS blog                               │  ← text-4xl font-bold
│  Engineering, agents, and shipping.              │  ← text-base muted
│                                                  │
│  [All posts] [Tag] [Tag] [Tag]    [RSS] [Search] │  ← filter bar
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ HERO POST (most recent, covers the row)    │  │  ← PostCard variant=hero
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ PostCard    │ │ PostCard    │ │ PostCard   │ │  ← 3-col grid on lg
│  │ compact     │ │ compact     │ │ compact    │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
│                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ PostCard    │ │ PostCard    │ │ PostCard   │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
│                                                  │
│  [← Older]                          [Newer →]    │  ← pagination
└──────────────────────────────────────────────────┘
```

**Layout decisions**:
- **Hero post** = first card, takes full width, uses `variant="hero"` with `priority` image
- **Grid**: 1-col mobile, 2-col `md`, 3-col `lg`
- **Gap**: `gap-6` (24px)
- **Filter bar**: scrollable horizontally on mobile, dropdown on desktop
- **Pagination**: 12 posts per page (Phase 2 starts without pagination; Phase 3 adds it)
- **Empty state**: if 0 posts, show centered "No posts yet — subscribe via RSS"

### 5.2 /blog/[slug] (post detail)

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [back to /blog]                                 │  ← text-sm link
│                                                  │
│  Title (text-4xl md:text-5xl font-bold,          │  ← H1
│  tracking-tighter, max-w-3xl)                    │
│                                                  │
│  Description (text-lg muted, max-w-2xl, mt-4)    │  ← subtitle
│                                                  │
│  ─                                               │
│                                                  │
│  [avatar 40] Author Name                         │  ← AuthorByline size=md
│              Jan 1, 2026 · 8 min read            │
│                                                  │
│  ─                                               │
│                                                  │
│  [cover image, full-width, rounded-2xl, mt-12]   │  ← if post.cover
│                                                  │
│  ──────────── BODY ────────────                   │
│                                                  │
│  Lorem ipsum body content, max-w-2xl              │  ← max-w-2xl (~672px)
│  mx-auto, rendered MDX                           │
│                                                  │
│  ## Heading                                      │
│                                                  │
│  More body...                                    │
│                                                  │
│  ──────────── BODY END ────────────               │
│                                                  │
│  [tag] [tag] [tag]                               │  ← TagChip list
│                                                  │
│  ─                                               │
│                                                  │
│  Continue reading                                │  ← text-sm uppercase muted
│                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ PostCard    │ │ PostCard    │ │ PostCard   │ │  ← related posts (15.9)
│  │ compact     │ │ compact     │ │ compact    │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
└──────────────────────────────────────────────────┘
```

**Layout decisions**:
- **Max width** for title: `max-w-3xl` (768px), allows for longer titles
- **Max width** for body: `max-w-2xl` (672px), optimal reading width
- **Hero cover image** is optional, full-width inside `max-w-4xl`
- **TOC sidebar**: NOT in v1. Considered for Phase 4 if posts grow long.
- **Share buttons**: NOT in v1. Author can add manually in MDX if needed.
- **Comments**: NOT in v1. Q3 with the user.
- **Related posts**: 3 cards, tag-overlap algorithm (spec 15.9).

### 5.3 /blog/author/[handle] + /blog/tag/[tag]

Same template, used for both:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  # react                       ← tag              │
│  OR                                               │
│  [avatar 64] Author Name       ← author           │
│              Bio line if present                  │
│                                                  │
│  N posts                                         │
│                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ PostCard    │ │ PostCard    │ │ PostCard   │ │  ← same grid as index
│  └─────────────┘ └─────────────┘ └────────────┘ │
│                                                  │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

**Tag page header**: just `# tag-name` (text-5xl) + post count.
**Author page header**: avatar (larger, 64px), name, bio (text-muted), post count.

---

## 6. Motion

| Element | Property | Duration | Easing | Notes |
|---|---|---|---|---|
| Card hover | `translate-y: -2px` + `shadow` | `150ms` | `ease-out` | Quiet lift |
| Link hover | `decoration-opacity` 0.3 → 0.6 | `150ms` | `ease-out` | Subtle |
| Tag chip hover | `bg`, `border`, `color` | `150ms` | `ease-out` | All transition-color |
| Page entry | none | — | — | No fade-in (slow) |
| TOC scroll-spy | `border-color` | `100ms` | `ease-out` | If added in Phase 4 |

**Reduced motion**: All transforms wrapped in `@media (prefers-reduced-motion: no-preference)`. Inside reduced-motion context, hover state uses `border-color` change only, no `translate-y`.

```css
@media (prefers-reduced-motion: reduce) {
  .post-card-hover:hover {
    transform: none;
  }
}
```

Or simpler: implement with Tailwind's `motion-safe:` and `motion-reduce:` variants.

---

## 7. Responsive

Mobile-first. Breakpoints follow Tailwind defaults (`sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`).

| Surface | Mobile (< 768) | Tablet (768-1024) | Desktop (> 1024) |
|---|---|---|---|
| Blog index grid | 1 col | 2 col | 3 col |
| Hero card | text-2xl title, full-width | text-3xl title, full-width | text-4xl title, full-width |
| Post detail body | 17px, `max-w-2xl` with `px-4` | 18px, `max-w-2xl` with `px-6` | 18px, `max-w-2xl` with `px-8` |
| Post title (h1) | text-4xl | text-5xl | text-5xl |
| Cover image | full-width, 16:9 | full-width, 16:9 | full-width, 21:9, max-h-[480px] |
| TagChip list | wrap, full width | wrap, full width | wrap, full width |
| AuthorByline | avatar 32, name + date stack | avatar 40, inline | avatar 40, inline |
| Filter bar | horizontal scroll | horizontal scroll | inline with search |

**Touch targets**: All clickable elements (chips, cards, links) have minimum 44×44px hit area on mobile.

---

## 8. Edge cases

| Case | Behavior |
|---|---|
| **No posts yet** | Empty state on /blog: "No posts published yet." + RSS link. No hero card. |
| **Single post** | Hide pagination on index. |
| **Post without cover** | PostCard auto-falls-back to `text-only` visual variant (even if `compact` passed). |
| **Post without description** | Hide description row in PostCard and subtitle in post detail. |
| **Post with no tags** | Hide TagChip list in PostCard and post detail footer. |
| **Very long title (>80 chars)** | line-clamp-2 on cards, allow full title on detail page (wraps naturally). |
| **Author without avatar** | Initials placeholder (first letter of first 2 words of name) on `bg-muted`. |
| **Author without bio** | Just name + count on author page. |
| **Author without handle** | Schema enforces handle; if missing → author lookup fails → post falls back to `author: { handle: 'unknown', name: 'Unknown' }`. |
| **Tag with 0 posts** | Don't render the tag in filter bar. Tag page should still exist for SEO if externally linked. |
| **Draft in dev** | Visible in dev with `border-dashed` and `Draft` badge overlay. Hidden in prod. |
| **Scheduled post** | Visible in dev (if scheduled within 24h) with `Scheduled` badge. Hidden in prod. |
| **MDX compile error** | Build fails with line number. Show in dev console immediately. |
| **Cover image 404** | Fallback to `<div class="bg-muted/30 h-48" />` (no broken image icon). |
| **Reading time 0** | Hide the indicator. |

---

## Decision log

Decisions made while writing this doc, with rationale.

| Decision | Rationale |
|---|---|
| **content-collections** as engine | Per spec 15-blog.md. Sponsor-backed, Next 16 first-class, Zod 3 consistent with stack. No reason to deviate for `apps/web/`. |
| **MDX-in-repo** for authoring | Internal team only (devs), git-native, no CMS overhead. Can add Decap later if team grows. |
| **Cover images in repo** (not R2) | Marketing site is small scale (~20-50 posts). `next/image` + git LFS or regular git is enough. R2 is overkill. |
| **6 category colors as new design tokens** | Add `--color-added/changed/fixed/removed/deprecated/security` to globals.css under `@theme inline`. |
| **Body font 17-18px, line-height 1.75** | Optimal readability for long-form technical content. Larger than marketing copy. |
| **Reading width 42rem (672px)** | 60-75ch at 18px Geist, the readability sweet spot. |
| **Hero card on index = most recent post** | Curation signal: the freshest content gets the spotlight. |
| **No TOC sidebar in v1** | Posts are short-to-medium length. TOC adds complexity without value yet. |
| **No share buttons in v1** | Authors can embed them manually if needed. Native browser share is good enough. |
| **No comments in v1** | See Q3 below. |
| **No search in v1** | See Q4 below. |
| **Filter bar = scrollable on mobile** | Tag list can grow. Horizontal scroll is the standard pattern. |
| **Related posts = 3 cards, tag-overlap** | Per spec 15.9. ML-based out of scope. |
| **Motion = quiet (150ms ease-out)** | Principle 4 — semantic motion, no decoration. |
| **Hover lift = 2px max** | Subtle, not bouncy. Aligns with the rest of the marketing site. |

---

## Open questions (need user input before code)

**Q1.** Foreground color for category badges — `text-[var(--color-X)]` (raw) or `color-mix(in oklch, var(--color-X) 80%, var(--foreground))` (more contrast)?
→ Default: `color-mix`. Gives each category a recognizable tint while staying readable.

**Q2.** Newsletter signup — include in v1 or defer?
→ Currently deferred to Phase 5 (after core blog ships). If we want it for lead gen, we add Resend + a `<NewsletterForm>` component + the `/api/newsletter` endpoint. Worth confirming.

**Q3.** Comments — Giscus (GitHub-based) or skip?
→ Currently skipped. Giscus would be free, GitHub-auth-based, no vendor lock-in. Worth flagging for the team.

**Q4.** Internal search — Pagefind (build-time, free), Algolia (hosted, paid), or none?
→ Currently skipped. Pagefind is a strong default if we add it.

**Q5.** Cover image source — author uploads to repo (git LFS?), or external URLs only?
→ Default: external URLs only (Unsplash, etc.). Keeps repo lean. Author provides URL in frontmatter.

**Q6.** Posts count display — show on tag/author pages? On index?
→ Default: yes on tag/author pages (helps users know what they're browsing), no on index.

---

## Cross-references

- Spec: `documents/internal/product/features/15-blog.md` — engine decision, file structure, delete-test
- Marketing structure: `documents/internal/design/landing-page-structure.md` — homepage patterns, glued grids, semantic tokens
- Design system: `DESIGN.md` (root) — semantic tokens, primitives inventory
- UI package: `packages/ui/CLAUDE.md` — shadcn conventions, exports
- Existing Shiki usage: `apps/web/src/components/homepage/code-preview.tsx` (uses `<CodeBlock>`)

---

## Phases (recap)

| Phase | Scope | Deliverable |
|---|---|---|
| **0 — Design** (this doc) | Primitives + pages + tokens | `blog.md` ← you are here |
| **1 — Foundation** | content-collections.ts, 1 sample post, pipeline validate | Pipeline compiles, post renders |
| **2 — Routes** | /blog index, /blog/[slug], RSS, OG images | Blog browsable |
| **3 — Discovery** | Author pages, tag pages, related posts, hero card | Full browse experience |
| **4 — Quality** | JSON-LD, rehype-sanitize, a11y audit, Lighthouse | 10/10 done checklist |
| **5 — Optional** | Newsletter, comments, search, TOC, share buttons | Feature additions |
