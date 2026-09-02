# DeesseJS — Design canon

The authoring canon for assembling DeesseJS surfaces. Read this before writing a new page or rewriting an existing one. Sections `10`, `11`, and `12` mirror the corresponding sections in `DESIGN.md` (the load-bearing spec at the monorepo root); this file is the canonical surface that humans and agents read in the browser or fetch via `curl https://deessejs.com/design.md`.

## 10. Authoring canon

The system above defines the tokens and primitives. This section defines how to assemble them into a page. Work a page in four passes, in order, before writing the first line of JSX.

### 10.1 The four-pass frame

1. **Frame.** Pick the wrapper recipe from §10.2. Decide the surface role (full-bleed grid, single-column article, detail shell) before any token or copy decision. The wrapper constrains everything downstream.
2. **Compose.** Place the header (§10.4), then sections top-to-bottom using the archetypes in §10.6. Pick section shells (cards, dividers, shared-border grids) before picking typography.
3. **Visual system.** Apply the Tailwind utilities from §2 (tokens) and the typography resolution in §10.5. Decide the radius family once for the view and hold it.
4. **Inspect.** Run the §12 checklist. Loading, empty, error, permission states declared. Cross-link at the bottom. Accessibility sweep passes.

A page that has not been framed does not ship.

### 10.2 Wrapper recipes

Three canvases. Pick one per page; do not invent a fourth.

**Recipe A — Frame-grid (full-bleed shared-border).**

Use when the page is a dense landing surface composed of multiple sections that share borders and read as one card. Canonical exemplar: `apps/web/src/app/(marketing)/page.tsx` (homepage).

Outer wrapper:

```html
<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
  <div class="border border-border bg-background rounded-none">…</div>
</div>
```

Section terminator between cells in a grid: `divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border`. The last row inherits the outer border via `border-b`.

Anti-patterns: Card primitives for in-grid cells (kills shared borders), rounded corners on cells, mixing `gap-*` and `divide-*` in the same grid.

**Recipe B — Article stack (one recipe, three sizes).**

Use when the page is primarily a reading surface with stacked sections, no shared-border grids. Common stem: `mx-auto flex max-w-{N} flex-col gap-{M} px-4 py-16 sm:px-6 lg:py-24`.

Sizes:

- `max-w-3xl gap-12` — prose-heavy single column. Exemplar: `apps/web/src/app/(marketing)/manifesto/page.tsx`.
- `max-w-4xl gap-12` — prose with a sibling surface (ToC aside, sidebar). Exemplar: `apps/web/src/app/(content)/knowledge-base/topics/[topic]/page.tsx`.
- `max-w-6xl gap-16 lg:gap-20` — multi-section catalog or comparison. Exemplars: `apps/web/src/app/(marketing)/pricing/page.tsx`, `apps/web/src/app/(marketing)/ecosystem/page.tsx`.

Anti-patterns: mixing `gap-*` values inside one page, using `<article>` for non-prose surfaces, adding side borders.

**Recipe C — Section shell (delegated layout).**

Use when the page delegates layout to a domain component (template detail, blog post body, KB guide body). Outer wrapper: `<section class="px-6 py-16">{component}</section>`. The shell owns outer padding; the component owns internal layout. Exemplar: `apps/web/src/app/(product)/templates/[template_slug]/page.tsx`.

Anti-patterns: padding inside the shell that duplicates the component's own padding; loading/empty/error handled inside `page.tsx` instead of `loading.tsx` / `error.tsx` / `not-found.tsx` route segments.

### 10.3 The grid family — shared borders and dividers

The shared-border pattern is a reusable recipe, not a one-off. The outer wrapper card supplies the outer border; the cells contribute padding and content; the dividers supply the inner borders. Cells never carry their own outer border.

In practice: outer `border border-border bg-background rounded-none`; inner cells use `divide-x divide-y divide-border gap-0`; the last row of each grid uses `border-b border-border` to inherit the wrapper outline so no double strokes appear at section seams.

Rule: cells contribute padding, the wrapper card supplies the outer border. Never both.

### 10.4 The header pattern

The eyebrow → H1 → lead trio is invariant across all surfaces. Do not skip a step.

Eyebrow utility: `text-label-13 uppercase tracking-wider text-muted-foreground`. The `uppercase` is letter-spacing rhythm, not decoration.

H1 size from §10.5 (typography differs by surface layer). Always apply `text-balance` to the H1.

Lead utility: `text-copy-{14|20} text-muted-foreground`. Wrap in `max-w-2xl` to constrain measure.

Optional tagline under the lead: `text-copy-13-mono text-muted-foreground` (codes, identifiers, install hints).

### 10.5 Typography resolution — the marketing/content split

Two conventions exist. The canon encodes them as a rule, not a bug.

Marketing surfaces use the `text-heading-*`, `text-copy-*`, `text-label-*` Tailwind utilities from §2.5. Content surfaces (blog, changelog, KB) use raw Tailwind (`text-3xl` / `text-4xl` + `font-bold` + `tracking-tight` / `tracking-tighter`) because their H1 sits inside an MDX prose plugin cascade — overriding that cascade with a token class fights the plugin.

Mixing the two on the same surface is a bug.

Reference table:

| Role | Marketing utility | Content utility |
| --- | --- | --- |
| Page H1 (hero) | `text-heading-72 tracking-tight text-balance` | `text-4xl font-bold tracking-tighter sm:text-5xl text-balance` |
| Page H1 (catalog) | `text-heading-56 tracking-tight text-balance` | `text-3xl font-bold tracking-tight text-balance` |
| Section H2 | `text-heading-32 tracking-tight` | `text-2xl font-semibold tracking-tight` |
| Card title H3 | `text-heading-24 tracking-tight` | `text-xl font-semibold tracking-tight` |
| Eyebrow | `text-label-13 uppercase tracking-wider text-muted-foreground` | (same) |
| Lead | `text-copy-{14\|20} leading-{6\|7} text-muted-foreground max-w-2xl` | `text-lg leading-7 text-pretty text-muted-foreground` |
| Body | `text-copy-14` or `text-copy-16 leading-6` | (prose plugin cascade) |

Marketing exemplars: `apps/web/src/app/(marketing)/pricing/page.tsx`, `apps/web/src/app/(marketing)/page.tsx`. Content exemplars: `apps/web/src/app/(content)/blog/[slug]/page.tsx`, `apps/web/src/app/(content)/knowledge-base/guides/[slug]/page.tsx`.

### 10.6 Section archetypes

Three archetypes recur. Reach for them; do not invent a bespoke shell.

**Hero.** Centered, eyebrow + H1 + lead + dual CTA + optional tagline. Used at the top of every marketing surface.

**Three-card grid.** `grid-cols-1 md:grid-cols-3 gap-0 divide-y divide-border md:divide-y-0 md:divide-x divide-border`. Each cell is a `<div>` with `flex flex-col gap-3 p-6`. H3 + body + optional CTA. Used for tier comparisons, principle grids, outcome lists.

**End-of-page cross-link.** Pick one of five shapes: prev/next nav (blog), in-topic CTA Card (KB), 2-col final CTA (homepage), footer CTA strip (pricing), "Related reading" card grid (everywhere). Every page terminates with exactly one. The cross-link is reachable from the keyboard tab order.

### 10.7 Page-level async states

Re-state §4.3 at the page level. Every page that fetches data declares all four states. Loading via `loading.tsx` showing the page shell with `<Skeleton />` for content blocks. Empty points to the first action the user should take. Error exposes a request ID and a retry path. Permission is a `(protected)` route boundary, not a per-page concern.

A page that renders one of these states inline must use the design system primitives for that state — never raw `<div>` with copy-pasted shadcn classes.

## 11. Reject list

Twelve items. Each is either a re-statement of a rule already in this document or a constraint validated by the team. Do not negotiate these in review.

1. No em-dash in user-facing copy. Use a comma, colon, or split the sentence. Em-dash is reserved for this document and code comments.
2. No marketing superlatives. No "blazing fast", "best-in-class", "revolutionary", "game-changing", "world-class". State the fact.
3. No decorative gradients. `bg-gradient-*` is rejected on every surface. Solid fills, borders, and tonal surfaces only.
4. No all-caps eyebrows used decoratively. The `uppercase` on `text-label-13` is letter-spacing rhythm. Never two consecutive all-caps strings; never an all-caps CTA.
5. No "please" or "successfully" in user-facing copy. "Project deleted", not "Successfully deleted the project". "Sign in to continue", not "Please sign in".
6. No mixed radius families per view. Pick one (sharp / `rounded-sm` / `rounded-lg` / `rounded-xl`) for the page and hold it. Do not mix `rounded-none` cells with `rounded-xl` cards in the same grid.
7. No raw HTML form controls. Use `@workspace/ui` `Field`, `Input`, `Select`, `Checkbox`, `Switch`. Copying shadcn classes onto a raw `<input>` is rejected by §7 inventory contract.
8. No attention-grabbing motion. No bounces, pulses, or infinite loops on idle state. `animate-pulse` for skeleton states only. All non-essential motion behind `motion-safe:`.
9. No manual `font-size`, `font-weight`, or `line-height` on marketing copy. Always use a token class from §2.5. Content surfaces are the documented exception (§10.5).
10. No `gray-*` text on a `gray-alpha-*` surface, and vice versa. `gray-*` = text and icon fills; `gray-alpha-*` = borders, dividers, overlays, hover. Do not swap them.
11. No `onClick` on a `<div>` for navigation. Use `<Link>` or `<Button>`. Use `<Dialog>` not a hand-rolled modal. Use `<DropdownMenu>` not a hand-rolled popover.
12. No JavaScript theme manager. Light/dark mode is set on `<html data-mode>` by the FOUC script; CSS does the rest.

## 12. Inspection checklist

Run before opening a PR that adds or rewrites a surface page.

1. Wrapper recipe picked and named in the file's leading JSDoc comment. The page opens with a comment naming the wrapper (frame-grid / article-stack:3xl|4xl|6xl / section-shell) and the section order.
2. Header pattern applied. Eyebrow (`text-label-13 uppercase tracking-wider text-muted-foreground`), `<H1>` with the size from §10.5, lead (`text-copy-{14|20} text-muted-foreground`). H1 has `text-balance`.
3. Typography matches the surface layer. Marketing pages use `text-heading-*`; content pages use raw Tailwind H1 (deliberate). No mixing on the same surface. Body copy uses `text-copy-14` or `text-copy-16`.
4. All four async states declared. Page either renders its own loading/empty/error/permission inline, or relies on `loading.tsx` + `error.tsx` + `not-found.tsx` segments. Loading uses `<Skeleton />` for known shapes. Empty points to a first action. Error exposes a request ID.
5. Section archetype used for each block. Hero, three-card grid, two-column split, in-text CTA, or end-of-page cross-link — pick from §10.6. No bespoke section shells.
6. End-of-page cross-link present. Every page terminates with one of: prev/next nav (blog), in-topic CTA Card (KB), 2-col final CTA (homepage), footer CTA strip (pricing), "Related reading" card grid. The cross-link is reachable from the keyboard tab order.
7. Accessibility sweep passes. Focus ring visible on every interactive element. `aria-label` on icon-only buttons. `prefers-reduced-motion` honored. Color contrast at least 4.5:1 for body and 3:1 for large text. `axe-core` clean.
8. No drift from §11. Scan the diff for em-dashes, raw HTML controls, gradient utilities, mixed radius families, manual font sizes, "please", "successfully", attention-grabbing motion. If any appear, the page does not ship.