# Blog Starter

Blog starter with MDX content, syntax highlighting, and OG image generation.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Content:** MDX via content-collections
- **Syntax highlighting:** Shiki + rehype-pretty-code
- **OG images:** `@vercel/og` rendered at build time
- **Search:** Pagefind (static)

## Getting started

```bash
deessejs init blog-starter
cd blog-starter
pnpm install
pnpm dev
```

## Conventions

- Articles live under `content/posts/{slug}/index.mdx`
- Authors are first-class types under `content/authors/`
- Tag pages are auto-generated
