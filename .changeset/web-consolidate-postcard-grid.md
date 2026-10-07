---
"web": patch
---

Consolidates the three divergent `PostCard` grid implementations behind a single `PostCardGrid` component plus a sibling `FeaturedRow`. Replaces the inline `[&>li]:border-r [&>li]:border-b` + four `nth-child` drop rules used by `/blog/author/[handle]` and the "Related reading" block on `/blog/[slug]` with the same `-mr-px -mb-px` + outer `overflow-hidden rounded-xl border` recipe already used by `/blog`, so all three sites share one visual frame and one border contract.

User-visible:

- `/blog/author/[handle]` and the "Related reading" block on `/blog/[slug]` now render inside the same rounded wrapper as `/blog`. The 1-px overflow on the last card when an author has a single post is gone.
- The featured row above the `/blog` main grid no longer carries a `border-b`, eliminating the 2-px double rule between the last featured cell and the first main-grid row.
- The featured row now scales past 2 cards (`index === featured.length - 1` instead of hardcoded `index === 0`).
- Both `<ul>`s on `/blog` get `aria-label="Featured posts"` and `aria-label="All blog posts"` (or `"Posts"` on author/related where there is no featured row).

API surface:

- `@/components/blog/blog-post-grid.tsx` exports `PostCardGrid` (renamed from `BlogPostGrid`) with the same `posts` + `featured` props, plus a new optional `gridCols: "1-2-3" | "1-2-3-4"` (default `"1-2-3-4"`).
- `@/components/blog/featured-row.tsx` is a new named export. Server-compatible. Renders 1-col mobile / 2-col `lg+`. No per-cell `border-b` — the main grid's first row supplies the visual divider.
- `@/components/blog/blog-search.tsx` imports the renamed export and updates the JSX tag. The "featured hidden while searching" invariant (`featured={isSearching ? undefined : featured}`) is preserved verbatim.
- `/blog/author/[handle]` and `/blog/[slug]` route their `<ul>` through `<PostCardGrid posts={…} gridCols="1-2-3" />` and drop their now-unused `PostCard` imports.
- `BlogPostGrid`'s outdated doc comment (it claimed nth-child selectors were in use) is rewritten to describe the canonical Pattern B recipe.

Not user-visible:

- The French in-source comment `Grille de cartes (Zéro nth-child, zéro double bordure)` is replaced with the English doc comment in the rewritten file.

No env var, no DB schema, no changeset to other packages (`web` is the only consumer of `@workspace/ui` changes, and there are none here).