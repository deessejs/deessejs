---
name: reference-content-collections-next16-patterns
description: Reference doc for the content-collections + Next 16 + React 19.2 integration patterns that worked for DeesseJS marketing site (apps/web), with full code examples and delete-test anchor
metadata:
  type: reference
---

# content-collections + Next 16 + React 19.2 — DeesseJS reference

This is the **canonical reference** for how DeesseJS integrates content-collections with Next 16's RSC and React 19.2. It exists because the path from "content-collections exists" to "Next 16 builds and renders MDX correctly" has 4 non-obvious gotchas that cost 2 hours of build cycles the first time.

## TL;DR — the 4 gotchas

| # | Gotcha | Fix |
|---|---|---|
| 1 | `schema: (z) => ({...})` is **retired** in cc 0.15+ | Use `schema: z.object({...})` directly |
| 2 | `content: z.string()` is **mandatory** in schemas | Add explicit `content` field (no more implicit) |
| 3 | `compileMDX(context, document, options)` returns `Promise<string>` | Use context from transform's 2nd arg (not just `{ cache }`) |
| 4 | `MDXContent` from server.js uses `new Function()` — **fails silently in Next 16 RSC** | Wrap in `"use client"` component (see §6 below) |

## §1. Package versions (pinned 2026-06-26)

```json
{
  "@content-collections/core": "0.15.2",
  "@content-collections/mdx":  "0.2.2",     // NOT 0.2.11 — that version doesn't exist
  "@content-collections/next": "0.2.11",
  "@shikijs/rehype":            "^3.23.0",
  "reading-time":               "^1.5.0",
  "zod":                        "^3.24.x"   // Zod 3, NOT Zod 4 (Velite uses Zod 4)
}
```

## §2. The engine surface — single file

`apps/web/content-collections.ts` is the entire engine config. Deleting this one file disables blog compilation, but the Next.js app continues to build.

```ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeShiki from "@shikijs/rehype";
import { z } from "zod";
import readingTime from "reading-time";

const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.md",
  schema: z.object({
    handle: z.string().min(1).max(60),
    name: z.string().min(1).max(120),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    content: z.string(),  // mandatory in cc 0.15+
  }),
});

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.mdx",
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().min(1),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    scheduled: z.string().datetime().optional(),
    content: z.string(),  // mandatory — used by compileMDX + reading-time
  }),
  transform: async (post, context) => {
    // Skip drafts at build time
    if (post.draft && process.env.NODE_ENV === "production") {
      return context.skip("document is a draft");
    }
    // Skip scheduled
    if (post.scheduled && new Date(post.scheduled) > new Date()) {
      return context.skip(`scheduled for ${post.scheduled}`);
    }
    // FK resolution
    const author = context.documents(authors).find((a) => a.handle === post.author);
    if (!author) throw new Error(`Post references unknown author "${post.author}"`);
    // Slug from filename
    const slug = post._meta.filePath.replace(/^.*\//, "").replace(/\.mdx$/, "");
    // Compile MDX → JS source string
    const mdxCode = await compileMDX(context, post, {
      rehypePlugins: [[rehypeShiki, {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      }]],
    });
    // Reading time
    const stats = readingTime(post.content);
    return {
      ...post,
      slug,
      url: `/blog/${slug}`,
      readingTime: Math.max(1, Math.round(stats.minutes)),
      author,
      mdxCode,
    };
  },
});

// releases collection: same pattern, semver-sorted, Keep-a-Changelog categories

export default defineConfig({
  content: [authors, posts, releases],  // `content` (not deprecated `collections`)
});
```

## §3. Next config wiring — the issue #690 trap

```ts
// apps/web/next.config.ts
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  serverExternalPackages: ["shiki"],         // shiki is ESM-only
  allowedDevOrigins: ["127.0.0.1", "localhost"],  // Next 16 cross-origin
  transpilePackages: ["@workspace/ui", "tw-animate-css"],
};

// CRITICAL: export the wrapper directly. Do NOT wrap in async function.
// Wrapping inside withNextIntl() or similar sync plugins breaks the chain.
export default withContentCollections(nextConfig);
```

## §4. tsconfig.json paths

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "content-collections": ["./.content-collections/generated"]
    }
  }
}
```

The `content-collections` alias points to the auto-generated types from content-collections.

## §5. Project structure (DeesseJS apps/web convention)

```
apps/web/
├── content-collections.ts          # engine surface
├── content/                         # MDX data
│   ├── authors/*.md
│   ├── posts/*.mdx
│   └── releases/*.mdx
├── src/
│   ├── app/(unprotected)/(content)/  # blog + changelog routes
│   ├── components/blog/             # app-specific components
│   │   ├── post-card.tsx
│   │   ├── post-meta.tsx
│   │   ├── release-meta.tsx
│   │   ├── release-entry.tsx
│   │   ├── author-badge.tsx
│   │   ├── tag-list.tsx
│   │   ├── prose.tsx
│   │   ├── article-cta.tsx
│   │   └── mdx-renderer.tsx        # ← the client wrapper (see §6)
│   └── lib/blog/                    # queries, RSS, types
└── public/
```

**Boundary rule:** `packages/ui` (root) ships global design system primitives. `apps/web/src/components/blog/*` ships app-specific components that know about Post/Release/Author types.

## §6. THE CRITICAL FIX — MDXContent client wrapper

`<MDXContent code={mdxCode} />` from `@content-collections/mdx/react` resolves via package exports to:
- `react-server` condition → `server.js` (uses `new Function()`)
- `import` condition → `client.js` (also `new Function` but in browser)

**In Next 16 RSC, the server.js path is picked, and `new Function()` is silently blocked.** Result: markdown renders as plain text instead of HTML.

**Fix:** force the client path by wrapping in a `"use client"` component.

```tsx
// apps/web/src/components/blog/mdx-renderer.tsx
"use client";

import { MDXContent } from "@content-collections/mdx/react";

export function MdxRenderer({ code }: { code: string }) {
  return <MDXContent code={code} />;
}
```

The `code` string is serializable → crosses the server/client boundary cleanly. Use `<MdxRenderer code={post.mdxCode} />` in server components.

**Symptoms of the bug:** build succeeds, page loads, but `# Headers` shows as literal text instead of `<h1>` HTML. No error in console — silent failure.

**Why this works:** `"use client"` triggers the bundler to use the `import` condition from the package exports, which loads `client.js` (browser-safe `new Function()`).

## §7. Delete-test anchor (modular contract 20.1)

Removing the blog + changelog feature from `apps/web` cleanly:

```bash
rm -rf apps/web/content \
       apps/web/content-collections.ts \
       apps/web/src/lib/blog \
       apps/web/src/components/blog \
       apps/web/src/app/\(unprotected\)/\(content\)/blog \
       apps/web/src/app/\(unprotected\)/\(content\)/changelog
```

Plus revert in `package.json` (drop 4 deps), `next.config.ts` (drop `withContentCollections`), `tsconfig.json` (drop `content-collections` alias), `.gitignore` (drop `.content-collections/` line).

**The rest of the monorepo is unaffected.** This was the load-bearing test for the modular contract.

## §8. Tailwind v4 prose styling — arbitrary variants

`prose-p:my-4` syntax requires `@tailwindcss/typography` plugin (NOT installed in DeesseJS). Use Tailwind v4 native arbitrary variants instead:

```tsx
className="[&_p]:my-4 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-2 ..."
```

Targets descendants of the Prose wrapper. Zero deps, works out of the box with Tailwind v4.

## §9. RSS 2.0 feed generator

Hand-rolled, no extra deps. Spec 15.16: RSS-only subscription (no in-app, no email).

```ts
// apps/web/src/lib/blog/feed.ts
function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function buildBlogFeed(posts: Post[], siteOrigin: string): string {
  // ...wrap in <rss version="2.0"><channel>...</channel></rss>
}
```

Route handler at `app/(unprotected)/(content)/blog/feed.xml/route.ts`:

```ts
export const dynamic = "force-static";
export function GET() {
  const xml = buildBlogFeed(getAllPosts(), "https://deessejs.com");
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
```

## §10. When to NOT use this pattern

- **You're on Next 13/14/15:** server.js MDXContent works fine. No client wrapper needed.
- **You need full-text search:** content-collections doesn't index content for search. Add Algolia, Meilisearch, or pg_trgm separately.
- **You need user-generated content:** content-collections is build-time. For UGC, use a DB-backed CMS.
- **You have >1000 posts:** cc compile time scales linearly. Consider dynamic SSG with ISR.

## §11. Related memory

- `reference-content-collections-next16-mdx-wrapper.md` — the specific MDXContent client wrapper fix (shorter version)
- `project-blog-engine-decision-2026-06-26.md` — why content-collections over Velite, fumadocs, next-mdx-remote
- `feedback-aliases-and-lib-location.md` — `@/*` alias + `lib/` inside `src/` convention

## §12. Estimated setup time

For someone starting fresh with this exact stack: 4-6 hours, mostly fighting the same 4 gotchas in §1 + §6. After this doc, expect 1-2 hours (engine setup + 1-2 components + 1 page + RSS).