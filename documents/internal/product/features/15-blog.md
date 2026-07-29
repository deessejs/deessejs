# 15. Blog (for the buyer's product)

> MDX-in-repo, type-safe, SEO. Standard SaaS blog surface; nothing differentiated here, but it's a table-stakes feature for the marketing site. Powered by **content-collections** (Zod-native, Next 16 first-class, sponsor-backed — same choice as supastarter). The documentation engine is a separate concern, scoped to the documentation site (14-documentation.md).

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 15.1 | MDX content | ✅ | C | content-collections (Zod schemas, compileMDX, MDXContent). See Architecture decisions. |
| 15.2 | Categories / tags | ✅ | C | Standard taxonomy |
| 15.3 | Authors | ✅ | C | Per-post author with bio + avatar |
| 15.4 | Cover images | ✅ | C | R2, optimized |
| 15.5 | SEO (meta, OG, Twitter cards) | ✅ | C | Next.js metadata API |
| 15.6 | RSS / Atom feed | ✅ | C | Standard |
| 15.7 | Sitemap | ✅ | C | Includes posts and tags |
| 15.8 | Newsletter signup | ⚪ | U | **Skipped in v1.** No `<NewsletterForm />` component, no `/api/newsletter` endpoint. If the buyer wants one, they wire it themselves. Keeps spec 15 free of vendor coupling. |
| 15.9 | Related posts | 🟡 | U | Tag-based in v1; ML-based out of scope |
| 15.10 | Reading time | ✅ | C | Calculated from MDX |
| 15.11 | Series (multi-post) | 🟡 | U | v1 ships as tags; v2 ships first-class series |
| 15.12 | Drafts / scheduled posts | ✅ | C | Status field, visible to authors only |
| 15.13 | Public release notes (user-facing) | ✅ | U | MDX-in-repo, fully manual authoring. Lives at `/changelog`. Inspired by Linear / Vercel / Stripe. Single source of truth — no auto-generated git-tags changelog. |
| 15.14 | Release categorization (Added/Changed/Fixed/Removed/Deprecated/Security) | ✅ | U | Keep a Changelog convention. Frontmatter enum, rendered as colored badges. |
| 15.15 | Cross-link to related content | ✅ | C | Each release note can list `relatedPosts: string[]` (blog slugs) for deeper context. Manual — buyer decides what to link. |
| 15.16 | RSS subscription for release notes | ✅ | C | Shares 15.6 RSS infrastructure; `/changelog/feed.xml` for users who want push updates without vendor lock-in. No in-app or email fan-out in v1. |

**Notes:**
- Blog is intentionally table-stakes. The depth is in the docs and the product, not the blog.
- **Status reality (2026-06-26):** the ✅ marks above are aspirational v1 targets, not current state. Zero blog files exist in `apps/template/` today. The features README claims "M4 → Blog ✅ all", which would make the M8 delete-test pass trivially on absence — a structural lie for the modular contract (20.1). This spec must be implemented before M8.
- **No in-app notifications for release notes (2026-06-26).** 15.15 in-app fan-out via `packages/notifications` is **removed**. Subscription model is **RSS-only** (15.16) — `/changelog/feed.xml` is the entire subscription surface. Rationale: keeps spec 15 free of soft deps on packages/notifications and Trigger.dev, makes the modular contract trivial. If a buyer wants in-app release notifs, they wire it themselves; the MDX collection is the integration point.
- **Single changelog surface (2026-06-26).** Spec 15 owns the entire changelog — `/changelog`, fully manual MDX. No `/docs/changelog` (dev changelog from git tags) is shipped. Rationale: separate dev vs user changelogs double the maintenance cost and confuse buyers about which one is canonical. If a dev changelog is later needed, it can be added back as a separate spec.
- **What 2026 options are dead:** `next-mdx-remote` was archived by HashiCorp on 2026-04-09 — do not use. `Contentlayer` is unmaintained since 2023 — do not use. `@next/mdx` alone is insufficient (no frontmatter, no Zod, no collection model).

## Architecture decisions (pending, 2026-06-26)

### Content engine

The blog needs a TypeScript-native, Zod-frontmatter, Next-16-compatible content compiler. Three viable options in 2026 (all MIT, all build-time validation):

| Option | Maintainer | Maturity | Next 16 / R 19 | Monorepo / delete-test | Adoption |
|---|---|---|---|---|---|
| **content-collections** (default) | sdorra, 40 contributors, sponsor-funded | Active, multi-framework | ✅ first-class (`@content-collections/next@0.2.11`, peer `^16`) | ✅ single config file, clean removal | supastarter ships it; 27K weekly DLs |
| **Velite** | zce, single maintainer | Active but pre-1.0 (0.3.1) | ✅ used in prod on Next 16 | 🟡 Turborepo / incremental build / Next-plugin roadmap **not done** | Indie blogs (bunnyhoneyclub, shinyaz) |

**Default: content-collections.** Rationale:
- Same engine supastarter ships → validated by the closest competitor.
- Sponsor-backed, multi-framework, no single-maintainer bus factor.
- Next 16 first-class since `0.2.9` (Dec 2025).
- Zod-native schema (`schema: z.object({...})`).
- Single config file (`content-collections.ts`) is the entire engine surface → trivially deletable for 20.1 delete-test.
- Escape hatch documented: buyer can swap to Velite by replacing one config file + removing two packages (in the docs/blog-engine-comparison page).

**Why not Velite as default:** DX is arguably better, but (a) single-maintainer pre-1.0, (b) Turborepo / incremental build / Next-plugin are explicitly **not done** on the official roadmap — directly undermines the monorepo + delete-test contract. (c) Velite uses Zod 4 — major-version mismatch with the DeesseJS stack (Drizzle + Better Auth pin Zod 3).

### Layout (where the blog lives in the buyer template)

content-collections compiles MDX → data; where the routes render is a separate decision.

1. **(b) Recommended.** Blog routes (`app/(content)/blog/[slug]/page.tsx`) live inside the buyer's main Next.js app. No separate docs app needed. Matches supastarter's pattern.
2. **(a).** Separate `apps/blog` workspace package. More isolation; more overhead.
3. **(c).** Blog as a route group inside the documentation app. Rejected: blog is not a doc surface.

### Other decisions still pending

- **Author entity (15.3).** RESOLVED 2026-06-26: MDX file in `content/authors/<slug>.md` (decoupled). Doesn't require Better Auth user — keeps blog independent of auth.
- **JSON-LD Article schema (cross-ref 22.4, marked D — differentiator).** Spec the schema in detail before 15.5 ships. Article + BreadcrumbList + Organization are the minimum rich-result set.
- **Delete test timing (20.1, 23.25).** TDD before impl vs regression after. Default: after — the test is more valuable when the feature actually exists to verify removal.

## How content-collections works in DeesseJS (technical, 2026-06-26)

### File tree (the entire blog surface)

```
buyer-template/apps/web/
├── app/
│   └── (content)/
│       ├── blog/
│       │   ├── [slug]/
│       │   │   ├── opengraph-image.tsx      # 15.5 — auto OG per post
│       │   │   └── page.tsx                 # 15.1, 15.3, 15.9, 15.10
│       │   ├── feed.xml/
│       │   │   └── route.ts                 # 15.6 — RSS
│       │   ├── tag/
│       │   │   └── [tag]/page.tsx           # 15.2 — tag pages
│       │   ├── page.tsx                     # blog index
│       │   └── opengraph-image.tsx          # OG for /blog
│       └── changelog/                       # 15.13-15.16 — public release notes
│           ├── [slug]/
│           │   ├── opengraph-image.tsx      # OG per release
│           │   └── page.tsx                 # 15.13, 15.14, 15.16
│           ├── feed.xml/
│           │   └── route.ts                 # RSS for releases
│           ├── page.tsx                     # /changelog index
│           └── opengraph-image.tsx          # OG for /changelog
├── content/
│   ├── authors/
│   │   └── <handle>.md                     # 15.3 — author entities
│   ├── posts/
│   │   └── <slug>.mdx                      # 15.1, 15.12 — posts
│   └── releases/
│       └── <version>-<slug>.mdx            # 15.13-15.16 — release notes
├── lib/
│   ├── posts.ts                            # post queries, related
│   └── releases.ts                         # 15.13, 15.15, 15.16 — release queries, related-posts join
├── content-collections.ts                  # the entire engine config (single file)
├── mdx-components.tsx                      # @next/mdx discovery (project root)
├── next.config.ts                          # withContentCollections wrapper
├── package.json
└── tsconfig.json                           # paths.content-collections alias
```

### `content-collections.ts` — the single config file

This file is the **entire engine surface**. Removing it disables the blog compilation. That's what makes 20.1 (modular contract) cheap to verify.

```ts
// content-collections.ts (project root of buyer template's web app)
import {
  createDefaultImport,
  defineCollection,
  defineConfig,
} from "@content-collections/core";
import readingTime from "reading-time";
import { MDXContent } from "mdx/types";
import { z } from "zod";

// --- Authors collection (15.3) ---
const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.md",
  schema: z.object({
    handle: z.string(),
    name: z.string(),
    avatar: z.string().url().optional(),
    bio: z.string().optional(),
    content: z.string(), // required by frontmatter parser
  }),
});

// --- Posts collection (15.1, 15.2, 15.10, 15.12) ---
const posts = defineCollection({
  name: "posts",
  directory: "./content/posts",
  include: "*.mdx",
  parser: "frontmatter-only",  // body is compiled by @next/mdx, not by cc
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tags: z.array(z.string()).default([]),
    author: z.string(),                       // FK to authors.handle
    draft: z.boolean().default(false),        // 15.12
    cover: z.string().optional(),             // 15.4
    scheduled: z.string().datetime().optional(), // 15.12 — ISO 8601
  }),
  transform: async ({ _meta, ...post }, { documents, skip }) => {
    // 15.12: skip drafts and future-scheduled at build time
    if (post.draft && process.env.NODE_ENV === "production") {
      return skip("document is a draft");
    }
    if (post.scheduled && new Date(post.scheduled) > new Date()) {
      return skip(`scheduled for ${post.scheduled}`);
    }

    // Resolve author FK (15.3)
    const authorDoc = (await documents(authors)).find(
      (a) => a.handle === post.author,
    );

    // Static-import MDX (smaller bundle, recommended)
    const mdxContent = createDefaultImport<MDXContent>(
      `@/content/posts/${_meta.filePath}`,
    );

    const slug = _meta.path;
    const url = `/blog/${slug}`;
    const minutes = readingTime(post.content ?? "").minutes;

    return {
      ...post,
      author: authorDoc ?? { handle: post.author, name: post.author },
      mdxContent,
      slug,
      url,
      readingTime: Math.max(1, Math.round(minutes)),
    };
  },
});

// --- Releases collection (15.13-15.16) ---
// Public-facing release notes. Single source of truth — no dev changelog elsewhere.
// Lives at /changelog. Manual MDX authoring. RSS-only subscription (no in-app).
const releases = defineCollection({
  name: "releases",
  directory: "./content/releases",
  include: "*.mdx",
  parser: "frontmatter-only",
  schema: z.object({
    title: z.string().min(1).max(120),                       // 15.13
    description: z.string().min(1).max(280),                 // 15.13
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "semver"),  // sort key + display
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    categories: z.array(                                       // 15.14
      z.enum(["added", "changed", "fixed", "removed", "deprecated", "security"]),
    ).default([]),
    cover: z.string().optional(),
    relatedPosts: z.array(z.string()).default([]),            // 15.15 — blog slugs for cross-link
  }),
  transform: async ({ _meta, ...release }) => {
    const mdxContent = createDefaultImport<MDXContent>(
      `@/content/releases/${_meta.filePath}`,
    );
    const slug = _meta.path;
    const url = `/changelog/${slug}`;
    return { ...release, mdxContent, slug, url };
  },
});

export default defineConfig({ content: [authors, posts, releases] });
```

**Why this shape:**
- `parser: "frontmatter-only"` — body stays raw until `@next/mdx` compiles it. Smaller engine surface, fewer cc-internal moving parts.
- `transform` is the only place where blog logic lives. Adding fields (e.g., `wordCount`, `excerpt`) means one file edit.
- `skip()` is the build-time filter for drafts/scheduled (15.12). No runtime gating, no env-var leaks.
- `documents(authors)` is the canonical cross-collection join (15.3 FK).
- **`releases` collection is a sibling of `posts`, not a child** — independent content type, independent routes, independent RSS feed. No coupling to a dev changelog; `relatedPosts` (15.16) is a manual cross-link to blog posts only.

### `next.config.ts` integration (issue #690)

`withContentCollections` returns `Promise<Partial<NextConfig>>` — TypeScript will complain under Next 16 if you wrap it. **Maintainer-recommended fix: export the result directly**, only `await` if a downstream plugin needs sync input.

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // ...other config
};

// Issue #690: just export the promise. Next accepts it.
export default withContentCollections(nextConfig);
```

If a downstream sync plugin is needed, wrap in an async function:

```ts
async function applyPlugins(cfg: NextConfig) {
  const withCc = await withContentCollections(cfg);
  return withNextIntl(withCc); // sync plugin gets sync input
}
export default applyPlugins(baseConfig);
```

**Rule:** `withContentCollections` must be either outermost, or `await`ed before being passed to a sync plugin. Wrapping it inside `withNextIntl(...)` breaks the chain.

### Route patterns

**`app/(content)/blog/[slug]/page.tsx`** — single post page (15.1, 15.3, 15.9, 15.10):

```tsx
import { allPosts, allAuthors } from "content-collections";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = { slug: string };

export function generateStaticParams(): Array<Params> {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author.name }],
    alternates: { canonical: post.url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      url: post.url,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const MdxContent = post.mdxContent;
  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <p>{post.description}</p>
        <p>
          <time dateTime={post.date}>{post.date}</time>
          {" · "}
          {post.readingTime} min read
        </p>
      </header>
      <MdxContent />
    </article>
  );
}
```

**`app/(content)/blog/feed.xml/route.ts`** — RSS (15.6): conventional `@feed/rss` or hand-rolled XML. ~30 LoC. Iterates `allPosts`, sorts by date desc.

**`app/(content)/blog/[slug]/opengraph-image.tsx`** — auto OG (15.5): `next/og` `ImageResponse`, conventional pattern, reads from `allPosts`.

**`app/(content)/blog/page.tsx`** — index page: iterates `allPosts`, paginates (hand-rolled, no built-in).

**`app/(content)/blog/tag/[tag]/page.tsx`** — 15.2 tag pages: `generateStaticParams` derives unique tags from `allPosts.flatMap(p => p.tags)`. Same template as index, filtered.

### Related posts (15.9)

Algorithm in `lib/posts.ts`:

```ts
export function getRelatedPosts(currentSlug: string, limit = 3) {
  const current = allPosts.find((p) => p.slug === currentSlug);
  if (!current) return [];
  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || +new Date(b.post.date) - +new Date(a.post.date))
    .slice(0, limit)
    .map((r) => r.post);
}
```

### MDX components override

`mdx-components.tsx` lives at the **project root** (not under `app/`) — `@next/mdx` discovers it there. Pattern:

```tsx
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Callout } from "@/components/callout";
import { MdxImage } from "@/components/mdx-image";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: ({ href, ...rest }) => {
      const isInternal = href?.startsWith("/") || href?.startsWith("#");
      if (isInternal) return <Link href={href ?? "#"} {...rest} />;
      return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
    },
    img: (props) => <MdxImage {...props} />,
    Callout,
  };
}
```

### Syntax highlighting (Shiki)

content-collections has no built-in highlighter. Wire `@shikijs/rehype` via the `withMDX` plugin:

```ts
import createMDX from "@next/mdx";
import rehypeShiki from "@shikijs/rehype";

const withMDX = createMDX({
  options: {
    rehypePlugins: [[rehypeShiki, { theme: "github-dark" }]],
  },
});
```

Shiki is already in the DeesseJS codebase per recent commits (apps/web uses it for CodeBlock).

### Type inference

`allPosts` is generated as a fully-typed array. The Post type flows from the Zod schema → transform return → `allPosts` type → component props. Zero manual type definitions. Example:

```ts
import type { allPosts } from "content-collections";  // typed export
type Post = (typeof allPosts)[number];
// Post.title: string
// Post.tags: string[]
// Post.readingTime: number
// Post.mdxContent: (props) => JSX.Element
```

### Delete-test surface area (for spec 20.1 / 23.25)

Removing content-collections from the buyer template cleanly:

| Layer | Artifact | Action |
|---|---|---|
| Config | `content-collections.ts` (root) | Delete |
| Wrapper | `withContentCollections(...)` line in `next.config.ts` | Remove |
| Generated | `.content-collections/` directory | Auto-gitignored; remove from tracked state |
| tsconfig | `"content-collections": ["./.content-collections/generated"]` path alias | Remove |
| .gitignore | `.content-collections` line | Remove (if buyer wants clean repo) |
| Imports | `import { allPosts, allAuthors, allReleases } from "content-collections"` | Search + replace across app |
| Pages (blog) | `app/(content)/blog/**` | Delete (or migrate) |
| Pages (changelog) | `app/(content)/changelog/**` | Delete (or migrate) |
| Content | `content/posts/*.mdx`, `content/authors/*.md`, `content/releases/*.mdx` | Delete (or migrate) |
| Lib | `lib/posts.ts`, `lib/releases.ts` | Delete |
| MDX | `mdx-components.tsx` | Delete if not migrating to `@next/mdx` directly |
| Deps | `@content-collections/core`, `@content-collections/next`, `@content-collections/mdx`, `reading-time` | Remove from package.json |
| Optional | `remark-frontmatter`, `remark-mdx-frontmatter` | Remove if not used elsewhere |

**Blog is a leaf feature** — no other DeesseJS feature depends on it. Delete-test is well-scoped; CI verification is straightforward.

### Velite escape hatch (documented for buyers)

Buyers who want Velite's DX (`s.metadata()`, `s.isodate()`, pre-computed reading time) can swap. Effort: **4-8 hours**. Diff:

1. `pnpm remove @content-collections/{core,next,mdx} reading-time`
2. `pnpm add velite concurrently`
3. Delete `content-collections.ts`, create `velite.config.ts` (uses `s.*` DSL instead of `z.*`)
4. Change `import { allPosts } from "content-collections"` → `import { posts } from "#site/content"` (Velite uses different alias)
5. Change `post.mdxContent` → `post.content` (Velite returns raw MDX; render with `next-mdx-remote/rsc` or `@mdx-js/mdx` evaluate)
6. Add `velite dev` watch + `concurrently` in package.json scripts

Document this in `docs/blog-engine-comparison.md` for buyers.

## How release notes work (15.13-15.16, 2026-06-26)

### Single source of truth

`/changelog` is the **only** changelog surface shipped. Fully manual MDX. No git-tag-based auto-generation, no `/docs/changelog`. The buyer authors every release as MDX, controls the wording, and ships when ready.

**Trade-off accepted:** a missed `git tag` doesn't produce a release note automatically. The buyer's release process is: write MDX + bump version. Same effort as a blog post, more authoritative.

### Route patterns

**`app/(content)/changelog/page.tsx`** — index: iterates `allReleases`, sorted by `version` (semver desc). Grouped view by `categories` filter (Added/Changed/Fixed/Removed/Deprecated/Security) — Keep a Changelog convention.

**`app/(content)/changelog/[slug]/page.tsx`** — single release: full content + category badges + related posts (15.15).

**`app/(content)/changelog/feed.xml/route.ts`** — RSS for releases: same pattern as blog RSS but iterates `allReleases`. This is also the **only** subscription mechanism (15.16).

**`app/(content)/changelog/[slug]/opengraph-image.tsx`** — auto OG per release.

### 15.15 — Cross-link to related content

Frontmatter `relatedPosts: string[]` — manual list of blog post slugs that explain the release in depth.

```ts
// lib/releases.ts
import { allPosts, allReleases } from "content-collections";

export function getRelatedPosts(releaseSlug: string) {
  const release = allReleases.find((r) => r.slug === releaseSlug);
  if (!release?.relatedPosts?.length) return [];
  return release.relatedPosts
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter(Boolean);
}
```

Rendering: at the bottom of each release page, if `relatedPosts` is set, render:

> 📖 **Related reading**
> - [How we built dark mode](/blog/dark-mode-deep-dive)
> - [API v2 migration guide](/blog/api-v2-migration)

### 15.16 — RSS subscription

**The only subscription mechanism.** Users who want push updates on new release notes subscribe to `/changelog/feed.xml` in any RSS reader (NetNewsWire, Feedly, etc.).

**Why RSS-only (decision 2026-06-26):**
- Zero vendor lock-in — buyers don't need Resend Audiences, Postmark, ConvertKit, or a custom notification system to ship release notes.
- Zero operational cost — the RSS feed is generated at build time, served as a static file by Next.js.
- Zero coupling with `packages/notifications` (spec 11) or `packages/jobs` (spec 04) — release notes are a fully self-contained feature.
- Aligns with the **agentic positioning** (decided 2026-06-26): agents that want release note updates can subscribe to an RSS feed via tool calls; no need for a DeesseJS-specific API.

**Trade-off accepted:** end users who don't use RSS readers won't get push updates. The buyer's marketing site can still surface "Subscribe via RSS" prominently; if the buyer wants email digests, they wire their own list (cross-ref spec 5.6 — marketing templates 🟡).

### Gotchas relevant to DeesseJS (Next 16 + React 19 + Zod 3)

1. **Issue #690** — TypeScript return-type mismatch in `next.config.ts` under Next 16. **Fix:** export `withContentCollections(nextConfig)` directly (see above).
2. **`withContentCollections` must be outermost** or `await`ed. Wrapping inside `withNextIntl()` breaks.
3. **`mdx-components.tsx` at project root** — not under `app/`. If misplaced, components silently don't apply.
4. **`schema: (z) => ({...})` is deprecated** — use `schema: z.object({...})`.
5. **`defineConfig({ collections: [...] })` is deprecated** — use `defineConfig({ content: [...] })`.
6. **Drafts and scheduled are build-time filters** — no runtime preview without env-conditional logic (e.g., `if (post.draft && process.env.NODE_ENV === "production")`).
7. **`reading-time` is a separate dep** — content-collections does not bundle it. Velite does (`s.metadata()`).
8. **`_meta.path` (slug) vs `_meta.filePath` (full path with extension)** — use `.path` for routes, `.filePath` for `createDefaultImport`.
9. **Serialization** — all values in the final document must be JSON-serializable. Convert dates to ISO strings, not Date objects.
10. **TypeScript path alias required** — without `"content-collections": ["./.content-collections/generated"]` in tsconfig, imports break.

### Versions to pin (DeesseJS-specific)

```json
{
  "dependencies": {
    "@content-collections/core": "0.15.2",
    "@content-collections/next": "0.2.11",
    "@content-collections/mdx": "0.2.x",
    "reading-time": "^1.5.x",
    "zod": "^3.24.x"
  }
}
```

- `zod` pinned to `^3.x` to match the rest of the DeesseJS stack (Drizzle, Better Auth). Velite uses Zod 4 — that's a major-version mismatch and a reason to stick with content-collections for DeesseJS v1.
- `next` and `react` not pinned here — they live in the parent app's `package.json`.

## "Done" framework (per features/README.md)

Every ✅ above must pass the 10-dimension check before shipping. Current score for blog + release notes: **0/10**. Dimensions to satisfy: happy + 2 unhappy paths, documentation page, TypeScript end-to-end, i18n-ready structure, WCAG 2.1 AA, responsive, **modular (delete test)**, Lighthouse ≥ 90, OWASP top 10 (rehype-sanitize on MDX), observability events (`blog.post.published`, `blog.rss.fetched`, `release.published`).

Estimated effort: **2-3 weeks** for the 10-dimension done across 15 features + downstream unblocks (R2 storage for 15.4, JSON-LD for 22.4, delete test for 20.1). No dependencies on `packages/notifications` or `packages/jobs`.

## Cross-references

- Parent: [README.md](./README.md)
- Related: [14-documentation.md](./14-documentation.md) — documentation engine stays scoped here (docs only). Changelog feature (14.14) is **superseded** by spec 15.13-15.16; if a dev changelog is needed later, add a separate spec.
- Related: [05-mail.md](./05-mail.md) — release notes have **no email digest** in v1 (RSS-only via 15.16); 15.8 newsletter signup is skipped in v1.
- Related: [16-marketing-and-sales.md](./16-marketing-and-sales.md) — blog drives SEO for the marketing site (16.8); release notes are SEO-friendly evergreen content.
- Related: [22-seo.md](./22-seo.md) — 15.5 blog SEO + 22.4 JSON-LD Article (D) + 22.19 News sitemap (consumed by both blog + changelog feeds).
- Related: [20-cross-cutting.md](./20-cross-cutting.md) — 20.1 modular contract: blog + release notes must live in `src/features/blog/` to be deletable.
- Related: [23-testing.md](./23-testing.md) — 23.25 delete test covers both blog and release notes.
- See also: tech-lead memory `project-blog-feature-spec-analysis.md` (2026-06-26) — full deep-dive.
- See also: tech-lead memory `project-blog-engine-decision-2026-06-26.md` — content-collections vs Velite comparison with dead-ends (next-mdx-remote archived 2026-04-09, Contentlayer dead since 2023).
