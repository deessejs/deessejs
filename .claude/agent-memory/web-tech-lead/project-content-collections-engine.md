---
name: project-content-collections-engine
description: content-collections config for apps/web — 3 collections (authors/posts/releases), draft + scheduled skip, slug-from-filename, delete-test anchor
metadata:
  type: project
---

`apps/web/content-collections.ts` defines the entire content engine for the LIVE marketing site. Three collections, no plugin extensions, no extra pipelines.

## Collections

### 1. `authors` (md, in `content/authors/`)
- Schema: `handle` (1–60), `name` (1–120), `avatar?`, `bio?`
- No transform. Used as FK target for posts.

### 2. `posts` (mdx, in `content/posts/`, `parser: "frontmatter-only"`)
- Schema: `title` (1–120), `description` (1–280), `date` (YYYY-MM-DD regex), `updated?`, `tags` (default `[]`), `author` (FK), `draft` (default `false`), `cover?`, `scheduled?` (ISO datetime)
- Transform:
  - **Skip drafts in production**: `if (post.draft && process.env.NODE_ENV === "production") return undefined;`
  - **Skip future-scheduled posts**: `if (post.scheduled && new Date(post.scheduled) > new Date()) return undefined;`
  - **Author FK resolution**: throws at build if author doesn't exist — explicit error message with file path
  - **Slug from filename**: strips directory and `.mdx`
  - **Compiles MDX body** via `@content-collections/mdx` → `mdxContent`
  - **Reading time** computed via `reading-time` from raw body
- Output: `{ ...post, slug, url: /blog/${slug}, readingTime, author, mdxContent }`

### 3. `releases` (mdx, in `content/releases/`)
- Schema: `title`, `description`, `version` (semver regex `^\d+\.\d+\.\d+$`), `date`, `categories` (enum: added/changed/fixed/removed/deprecated/security), `cover?`, `relatedPosts` (default `[]`)
- Transform: slug-from-filename + MDX compile. URL = `/changelog/${slug}`.

## Delete-test anchor (the architectural commitment)

The whole content engine is **optional**. You can rip it out without breaking the rest of the monorepo:

```bash
rm -rf apps/web/content \
       apps/web/content-collections.ts \
       apps/web/src/components/blog \
       apps/web/src/components/mdx \
       apps/web/src/app/\(unprotected\)/\(content\)
```

After the rm: `apps/web` still builds, `packages/ui` still builds, the rest of the monorepo is unaffected.

**Why this matters:** any new content feature must keep this property. If a proposed change makes the blog engine a foundation (e.g. requires importing from `apps/web/src/app/(unprotected)/(content)/blog/` into `(marketing)/page.tsx`), reject the change and rework the boundaries.

## Why `frontmatter-only` parser

- Lets the body be compiled by `@content-collections/mdx` (which we want for syntax highlighting + custom components) without content-collections trying to parse the MDX itself.
- Body still accessible as raw string for `reading-time` (via `post.content ?? ""`).

## What's NOT here (and why)

- **No RSS feed** — could be added in `(content)/blog/feed.xml/route.ts` if needed.
- **No pagination** — current blog list is single page.
- **No `[slug]/page.tsx`** — content-collections generates the URL but the actual post page route is not yet wired. Memory: this is M2 work.

**How to apply:** When extending the blog/changelog, keep all logic in `content-collections.ts` (schema + transform) and individual `page.tsx` files. Don't put rendering logic in the transform — it's data-layer.

Related: [[reference-next16-apps-web-quirks]] (pageExtensions required), [[project-blog-feature-spec-analysis]] (the buyer-template blog spec — different scope, NOT your concern)