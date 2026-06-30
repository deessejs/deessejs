---
name: project-blog-engine-decision-2026-06-26
description: Decision (2026-06-26) — DeesseJS blog uses content-collections, NOT Fumadocs. Fumadocs scoped to docs only. 2026 dead-ends: next-mdx-remote archived, Contentlayer abandoned.
metadata:
  type: project
---

# Blog engine decision — content-collections (2026-06-26)

## TL;DR

- **Blog engine: `content-collections`** (same as supastarter)
- **Fumadocs: out for blog**, stays scoped to documentation site (spec 14)
- The 2026 triangle for a standalone blog is **content-collections vs Velite vs fumadocs-mdx**
- Two formerly-viable options are now dead: `next-mdx-remote` (HashiCorp archive 2026-04-09), `Contentlayer` (unmaintained since 2023)

## Why this changed

First analysis (2026-06-26 morning) recommended Velite as the blog engine and grouped blog+changelog under one Fumadocs umbrella. Both recommendations were wrong:

1. User explicitly ruled out Fumadocs for blog (« Fumadocs c'est pas trop le sujet »). The blog is a marketing surface; Fumadocs UI is docs-shaped chrome. Coupling them forces an unwanted architecture on buyers.
2. `next-mdx-remote` (which I'd listed as an alternative) was archived by HashiCorp on 2026-04-09 — no longer a viable default.
3. Re-reading spec 14.14 confirmed the changelog is a **doc** feature, not a blog feature, contradicting the "blog+changelog = one engine" recommendation.

## Comparison (validated via fresh / Exa.ai research)

| Option | Maintainer | Maturity | Next 16 / R 19 | Monorepo / delete-test | Notable adoption |
|---|---|---|---|---|---|
| **content-collections** | sdorra, 40 contributors, sponsor-funded | Active, multi-framework | ✅ first-class since 0.2.9 (Dec 2025) | ✅ single config file | supastarter ships it; 27K weekly DLs of Next adapter |
| **Velite** | zce, single maintainer | Active but pre-1.0 (0.3.1, 2025-12-08) | ✅ used in prod on Next 16 | 🟡 Turborepo / incremental build / Next-plugin **not done** on roadmap | Indie blogs (bunnyhoneyclub, shinyaz) |
| **fumadocs-mdx standalone** | fuma-nama | Very active (419K weekly DLs) | ✅ explicit (Zod 4, peer `next ^16`, `react ^19.2`) | ✅ `.source/` virtual dir | Fumadocs ecosystem only |
| `next-mdx-remote` | HashiCorp | **Archived 2026-04-09** | v6.0.0 was final | N/A | Legacy lock-in (755K weekly DLs but no future) |
| `Contentlayer` | — | **Dead since 2023** | No App Router > 14 | N/A | Historical (shadcn/taxonomy before Velite fork) |
| `@next/mdx` alone | Vercel | First-party | ✅ | 🟡 no frontmatter, no Zod, no collection | Route-level only, insufficient for blog |

## Decision: content-collections

**Rationale:**

1. **Same engine supastarter ships** → validated by closest competitor for the exact use case (commercial SaaS template).
2. **Multi-framework, sponsor-backed** → no single-maintainer bus factor. The DeesseJS template promises "maintained for the life of your product"; a single-maintainer pre-1.0 dep is a contract violation risk.
3. **Next 16 first-class** since `@content-collections/next@0.2.9` (Dec 2025), peer `next ^12 || ^13 || ^14 || ^15 || ^16`. React 19.2 satisfied.
4. **Zod-native schema** — `defineCollection({ schema: (z) => ({...}) })` matches the rest of the DeesseJS stack (Drizzle, Better Auth, etc.).
5. **Delete-test friendly** — single `content-collections.ts` config file is the entire engine surface. Remove that file + the Next adapter → blog compilation is gone. Trivial for 20.1/23.25.
6. **Escape hatch documented** — buyers who want Velite's DX can swap by replacing one config file + removing two packages. Document in `docs/blog-engine-comparison.md`.

**Why not Velite as default:** DX arguably nicer (`s.mdx()`, `s.metadata()`, `s.isodate()`), but:
- Single-maintainer pre-1.0 (zce, 759 stars vs content-collections 1.2k + 40 contributors).
- Official roadmap explicitly lists **Turborepo**, **incremental build**, **Next.js plugin** as not done → directly undermines the monorepo + clean-removal philosophy (20.1).
- supastarter validation matters more than DX polish here.

**Why not fumadocs-mdx standalone:** Technically viable (the package supports `defineCollections` without `fumadocs-ui`). But:
- The package docs are organized around docs use cases; a buyer Googling "how do I add a blog post" lands in docs-framework material.
- It uses Zod 4 — DeesseJS stack pins Zod 3 elsewhere (Drizzle, Better Auth). Mixing Zod majors is technical debt.
- Buyer-friendly onboarding is worse than content-collections for a blog surface.

## Layout decision (where blog routes render)

Blog compilation = content-collections. Blog routes = Next.js route group inside the buyer's main app.

**(b) Recommended:** blog routes (`app/(content)/blog/[slug]/page.tsx`) inside the buyer's main Next.js app. Matches supastarter. No separate app.

Rejected:
- (a) Separate `apps/blog` workspace package → more isolation, more overhead, less integration with the buyer's actual product.
- (c) Route group inside a Fumadocs docs app → blog is not a doc surface; this forces a docs-flavored layout on a marketing surface.

## Concrete config DeesseJS should ship (pinned in spec)

See `15-blog.md` §"How content-collections works in DeesseJS" for the full technical section (config, transform, route patterns, delete-test surface, gotchas). Key reference points:

- **Single config file** = `content-collections.ts` at project root. Engine surface = this file + `withContentCollections` in `next.config.ts`. Trivially deletable.
- **Issue #690 fix** — `withContentCollections` returns `Promise<Partial<NextConfig>>`. Export the result directly; only `await` if a downstream sync plugin needs sync input. Wrapping `withContentCollections` inside `withNextIntl()` breaks the chain.
- **Transform** = the only place blog logic lives. Add fields (wordCount, excerpt, etc.) = one file edit. `skip()` is the build-time filter for drafts + scheduled posts (15.12).
- **Cross-collection join** = `documents(authors)` inside the post transform. Canonical pattern for FK resolution (15.3 author entity).
- **MDX rendering** = static-import via `createDefaultImport<MDXContent>` (smaller bundle than `compileMDX` runtime).
- **Syntax highlighting** = wire `@shikijs/rehype` via `withMDX` (Shiki already in the DeesseJS codebase).
- **Type inference** = `allPosts` is fully-typed; zero manual type defs needed.
- **Zod version pin**: `^3.24.x` to match Drizzle + Better Auth. **Velite uses Zod 4** — that's a major-version mismatch and an additional reason to stick with content-collections for v1.

## Version pins (DeesseJS-specific)

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

## Delete-test surface (for spec 20.1 / 23.25)

| Layer | Artifact | Action |
|---|---|---|
| Config | `content-collections.ts` (root) | Delete |
| Wrapper | `withContentCollections(...)` in `next.config.ts` | Remove |
| Generated | `.content-collections/` | Auto-gitignored |
| tsconfig | `"content-collections": ["./.content-collections/generated"]` alias | Remove |
| Imports | `import { allPosts, allAuthors } from "content-collections"` | Search + replace |
| Pages | `app/(content)/blog/**` | Delete (or migrate) |
| Content | `content/posts/*.mdx`, `content/authors/*.md` | Delete (or migrate) |
| MDX | `mdx-components.tsx` at project root | Delete if not migrating |
| Deps | `@content-collections/{core,next,mdx}`, `reading-time` | Remove from package.json |

**Blog is a leaf feature** — no other DeesseJS feature depends on it. CI verification is straightforward.

## Velite escape hatch (4-8 hours for buyer)

1. `pnpm remove @content-collections/{core,next,mdx} reading-time`
2. `pnpm add velite concurrently`
3. Delete `content-collections.ts`, create `velite.config.ts` (uses `s.*` DSL)
4. Change `import { allPosts } from "content-collections"` → `import { posts } from "#site/content"`
5. Change `post.mdxContent` → `post.content` (Velite returns raw MDX; render with `next-mdx-remote/rsc` or `@mdx-js/mdx` evaluate)
6. Add `velite dev` watch + `concurrently` in package.json scripts

Document in `docs/blog-engine-comparison.md` for buyers.

## Open follow-up decisions (per spec 15)

These remain undecided and are tracked in spec 15:
- Author entity: MDX file vs Better Auth user (default: MDX file, decoupled)
- Newsletter endpoint: stub 501 vs default provider (default: stub)
- JSON-LD Article schema spec (22.4, marked D): spec in detail before 15.5
- Delete test timing: TDD before impl vs regression after (default: after)

## Why this matters

Wrong engine choice here compounds: blog is a 2-3 week build with 5 downstream specs blocked (05, 14, 16, 22, 20). Picking an engine with a single-maintainer pre-1.0 dep that breaks under Turborepo would force a rewrite mid-M4. content-collections is the boring, validated, sponsor-backed choice.

## How to apply

- When asked "what engine for the blog?" → content-collections, with Velite documented as escape hatch.
- When asked "why not Fumadocs?" → it's scoped to docs (14). Different tool, different surface, different chrome.
- When asked "is Velite viable?" → yes for indie blogs (better DX), not for a commercial template (single-maintainer pre-1.0, Turborepo not done).
- When asked "what 2026 options exist?" → don't recommend next-mdx-remote or Contentlayer; both dead.

Related: [[project-blog-feature-spec-analysis]], [[project-build-state-2026-06-25]], [[feedback-read-spec-titles-and-status-carefully]]