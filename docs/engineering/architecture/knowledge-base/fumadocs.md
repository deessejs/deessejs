# Fumadocs

A study of [Fumadocs](https://fumadocs.dev), the MDX-based
documentation framework used in the site's rendering app.
Built on three upstream pages:

- [Page conventions](https://www.fumadocs.dev/docs/headless/page-conventions)
- [Loader API](https://www.fumadocs.dev/docs/headless/source-api)
- [Collections](https://www.fumadocs.dev/docs/mdx/collections)

This entry lives at the root of `knowledge-base/` because
the rendering app is a single instance. The patterns
documented here are the shape a contributor follows when
adding a new doc page or restructuring the navigation.

## The two parts of Fumadocs

Fumadocs is not a single library. It is two pieces:

1. **fumadocs-core** — the runtime. The `loader()` function,
   the page tree, the navigation, the search index, the
   LLM-text export. Pure data layer, no rendering.
2. **fumadocs-ui** — the React components. `DocsLayout`,
   `DocsPage`, the `<Cards>` and `<Callout>` MDX components,
   the search dialog. Depends on the Next.js layout.

The two are decoupled: a custom UI can be built on top of
`fumadocs-core` alone, and the renderer framework does not
have to be Next.js (the upstream also supports Astro and
Tanstack Start).

## The pipeline at build time

Three scripts cooperate at build time:

1. **`fumadocs-mdx`** (postinstall) — scans the configured
   `content/<dir>`, parses each `.mdx` file, generates the
   `.source/` directory with:
   - `server.ts` — the runtime entry that re-exports the
     parsed pages as `docs` / `docs.<locale>`.
   - `browser.ts` — the client-side entry.
   - `dynamic.ts` — the dynamic loader (for sources that
     change at runtime).
   - `source.config.mjs` — a mirror of the user's
     `source.config.ts`, rewritten for the bundler.
2. **`next typegen`** — generates Next.js route types from
   the file-system app router.
3. **`tsc --noEmit`** — the final type check.

The `server.ts` file is generated, but it is read at
type-check time by the consumer's code (`lib/source.ts`).
If the postinstall fails, the typecheck fails too — that's
the "no docs export" error a contributor sees when the
content directory is empty or the schema is broken.

## The loader — the runtime entry

The loader is the single point of access to the docs
content. It is created in `lib/source.ts`:

```ts
import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
})
```

`loader()` is **server-side only**. It is not browser-safe
and not build-time-magic. It holds the parsed pages in
memory after the postinstall generates them.

The loader exposes four operations a server component uses:

- `source.getPage(slugs)` — a single page by slugs.
- `source.getPages()` — all pages for a locale.
- `source.getPageTree()` — the navigation tree.
- `source.generateParams()` — the Next.js `generateStaticParams`
  output for the catch-all route.

The four together are the contract between the loader and
the rendering layer. A new feature in the docs site
typically adds one of these calls to a `page.tsx` or
`layout.tsx`.

## Slugs and the page tree

Slugs are generated from the file path, not from the
frontmatter:

| path (relative to `content/docs`) | slugs |
|---|---|
| `./index.mdx` | `['index']` |
| `./getting-started.mdx` | `['getting-started']` |
| `./guides/oauth/index.mdx` | `['guides', 'oauth']` |
| `./(group-name)/page.mdx` | `['page']` (parentheses hide the folder) |

The page tree is built by reading the slugs and the
`meta.json` files. The `meta.json` in a folder controls:

- **Order** — `pages` array overrides alphabetical.
- **Visibility** — `pages` is the explicit allowlist; items
  not listed are excluded.
- **Display** — `title`, `icon`, `defaultOpen`,
  `collapsible`.
- **Structure** — separators (`---`), links, root folders
  (rendered as tabs).

A `meta.json` is the right place to control navigation;
touching it does not require touching a single page file.

The frontmatter on a page is **content metadata**, not
navigation metadata. `title`, `description`, `icon` are read
by the loader to build the tree; the page's path determines
its position in the tree. The two are intentionally
separated: a page can move in the file tree without changing
its title, and a title can change without moving the page.

## The schema

`defineDocs` accepts a schema for both pages and meta:

```ts
import { defineDocs } from 'fumadocs-mdx/config'
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})
```

The default `pageSchema` is a Zod 4 schema with
`title: string`, `description: string`, `icon: string`. The
default `metaSchema` is the same shape that `meta.json` files
must conform to.

The schema is the right place to add custom frontmatter
fields. The shape is enforced at build time, so an MDX file
with a missing field fails the typecheck.

## The runtime layout

A Fumadocs app follows a predictable layout:

```
app/
  (home)/page.tsx          landing page
  docs/[[...slug]]/page.tsx doc catch-all
  docs/layout.tsx           docs shell (sidebar + content)
  api/search/route.ts       search backend
  llms.txt/route.ts         LLM index
  llms-full.txt/route.ts    LLM full dump
  llms.mdx/docs/.../route.ts per-page MDX export
  og/docs/.../route.tsx     OpenGraph image
content/docs/                MDX source
lib/
  source.ts                 loader
  shared.ts                 route constants
  layout.shared.tsx         layout options
  cn.ts                     Tailwind helper
```

The `app/docs/[[...slug]]/page.tsx` is the catch-all that
renders any page. The `app/docs/layout.tsx` is the shell
that wraps it. The two are the only files that vary when
the content changes; the rest of the routes are
infrastructure.

## Static vs dynamic content

The page conventions apply to content sources using
`loader()` (such as Fumadocs MDX). Pages are effectively
static files whose structure (slugs and tree position) is
derived from the file system and `meta.json` configuration
— not generated dynamically at runtime.

A `dynamic` collection (the `dynamic: true` option) is the
escape hatch for content that does change at runtime. The
loader is then `dynamicLoader()` instead of `loader()`, and
the cache is invalidated via `source.invalidate()`. This is
the right shape for a docs site that mixes authored content
(static) with API-generated content (dynamic).

## What a contributor follows

When adding a new doc page:

1. Drop the `.mdx` file in `content/docs/<path>.mdx`.
2. Add the frontmatter (`title`, `description`, optional
   `icon`).
3. Reference the page in a `meta.json` if the navigation
   needs the explicit order.

That is the entire contributor workflow. The loader, the
layout, the route handlers, the search backend — all are
infrastructure that picks up the change automatically.

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
Fumadocs works in the current version of the lib, and the
shape of the integration. The **decisions** (which routes
to expose, which content to curate, which LLM endpoints to
enable) live in `docs/engineering/architecture/decisions/`
and the app's `README.md`. When a future change conflicts
with this entry, the entry is wrong, not the code.
