# Fumadocs

## Decision

**Fumadocs** as the docs and blog engine for every Next.js app that ships documentation.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Fumadocs is used by:

- `apps/template/apps/docs/` — the buyer's docs site (ships with the template).
- `apps/docs/` — our docs site (`docs.deessejs.com`).
- Any other instance that has a docs sub-app.

Fumadocs is **not** used for:

- The marketing site (that's plain Next.js).
- The blog (Fumadocs includes a blog mode, used per feature 15.1).

## What Fumadocs gives us

1. **MDX content with TypeScript.** Docs are MDX files; code blocks are type-checked.
2. **Versioning.** Per-release docs (buyer v1.0, v1.1, etc.).
3. **Search.** Built-in client-side search.
4. **Code snippets with copy button.** shadcn-style.
5. **API reference auto-generation** (per feature 14.6). Pulls from our OpenAPI spec.
6. **Dark mode.** Matches the buyer's product theme.
7. **Mobile responsive.** (Though docs are desktop-first per the design principle.)
8. **"Edit on GitHub" link.** Buyers can PR corrections.
9. **Diátaxis structure.** Tutorials, how-to, reference, explanation — separated.

## Why Fumadocs (not Docusaurus, not Nextra, not custom MDX)

| Alternative | Why not |
|---|---|
| **Docusaurus** | React-based but separate runtime from Next.js. Hard to share components with the buyer's app. |
| **Nextra** | Older, less active. Fumadocs has better MDX + RSC integration. |
| **Astro + Starlight** | Different framework (Astro). Doesn't integrate with our Next.js app. |
| **VitePress** | Vue-based. Doesn't match our React stack. |
| **Custom MDX** | We'd reinvent Fumadocs badly. Search, versioning, code highlighting — all of it. |

Fumadocs wins on:

- **Next.js-native.** Same runtime as the buyer's app. Shares components, theme, fonts.
- **MDX with TypeScript.** Code blocks are type-checked against our actual SDK.
- **Active development.** Recent releases, responsive maintainers.
- **Diátaxis out of the box.** Structure is opinionated and good.

## Architecture

```
Next.js app
├── content/docs/                     ← MDX files
├── content/blog/                     ← MDX files (blog mode)
├── app/(docs)/                       ← Docs routes (Fumadocs)
└── lib/fumadocs/                     ← Config
```

Two docs sites in our repo:

1. **`apps/docs/`** (our docs about DeesseJS) at `docs.deessejs.com`.
2. **`apps/template/apps/docs/`** (buyer's docs about their product) — bundled with the template.

Per ADR 0012, the two docs are **completely separate** — no shared content, no shared MDX, no shared translations.

## Conventions

- **MDX with TypeScript.** Every code block is type-checked against our actual SDK.
- **Diátaxis structure.** Each doc is a tutorial, how-to, reference, or explanation — not mixed.
- **Versioned.** Major versions get their own docs (buyer v1.0, v1.1, etc.).
- **Searchable.** Client-side search indexes all MDX content.
- **API reference auto-generated** from our OpenAPI spec (per feature 14.6).
- **Dark mode** matches the product's theme.
- **"Edit on GitHub"** link to the buyer's repo (so buyers can PR corrections).

## Constraints

- **No HTML in MDX.** Use components.
- **Code blocks use real imports.** `import { foo } from '@deessejs/sdk'` resolves at build time.
- **Internal links use absolute paths.** No relative paths (breaks on file rename).

## Failure modes

| Failure | Mitigation |
|---|---|
| Build error in MDX | CI fails the build. The doc is fixed before merge. |
| Search index out of date | Search is built at build time. Rebuild on every content change. |
| API reference drift | Auto-generated from OpenAPI. Always in sync with the SDK. |

## Cross-references

- [`../../product/features/14-documentation.md`](../../product/features/14-documentation.md) — the documentation feature inventory.
- [`../../product/features/15-blog.md`](../../product/features/15-blog.md) — the blog feature inventory.
- [`../04-api-surface/orpc-internal.md`](../04-api-surface/) — OpenAPI pipeline that feeds the API reference.
- [`./nextjs.md`](./nextjs.md) — the Next.js runtime.
