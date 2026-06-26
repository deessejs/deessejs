@AGENTS.md

# `@deessejs/web` — the marketing site (deep dive)

> The marketing site for DeesseJS. Lives at `apps/web`, owned by the root pnpm workspace. This file is the **operational guide** — `AGENTS.md` is the **safety notice** (read first). The cross-reference document for the blog + changelog content engine is `content-collections.ts` itself; cross-reference for the buyer-facing mirror is `documents/internal/product/features/15-blog.md`.

---

## 1. What this app is, what it isn't

**This is the marketing site.** Hero, features grid, pricing, FAQ, CTA — all the conversion surface. Plus the public blog (`/blog`) and public changelog (`/changelog`).

**This is NOT the buyer template.** The buyer template (`apps/template/apps/web`) is a separate nested pnpm workspace. It has its own `content-collections.ts`, its own `lib/`, its own components. The two apps do not share TypeScript code — they live in different pnpm workspaces and cannot import across.

**Single source of truth per concern:**
- **Design system primitives** → `packages/ui` (consumed via `@workspace/ui/components/ui/*`)
- **App-specific components** → `apps/web/src/components/*` (auth, headers, footers, homepage, blog, pricing, etc.)
- **Blog/changelog engine surface** → `apps/web/content-collections.ts` (single file)
- **Blog/changelog helpers** → `apps/web/lib/blog/*`
- **Pricing data (tiers, founder offer, guarantee, feature matrix, comparison blocks, pricing FAQ)** → `apps/web/src/lib/pricing/*` (mirrors the `lib/blog/*` pattern — extracted from the home page on 2026-06-26 when `/pricing` shipped)
- **Content (MDX + authors)** → `apps/web/content/*`
- **Marketing copy** (hero, features, why-choose, FAQ, CTA) → hardcoded in `app/(unprotected)/(marketing)/page.tsx`

The boundary between `packages/ui` and `apps/web/src/components` is load-bearing:
- **`packages/ui`** is the design system. It must not know about the domain (no `Post` types, no content-collections imports). It only ships shadcn primitives and other globals.
- **`apps/web/src/components`** is app-specific. It knows about the domain, imports types from `#blog/*`, uses content-collections directly.

---

## 2. Route group structure

```
app/
├── favicon.ico
├── globals.css
├── layout.tsx                      ← root: ThemeProvider + Geist fonts + metadata
└── (unprotected)/                  ← public marketing surface
    ├── layout.tsx                  ← HomeHeader sticky, main shell, NO footer
    ├── (marketing)/                ← the home page
    │   ├── page.tsx                ← HomePage (hero + features + why-choose + pricing teaser + FAQ + CTA)
    │   └── pricing/page.tsx        ← dedicated /pricing route with full feature matrix (added 2026-06-26)
    ├── (auth)/                     ← login / signup / forgot-password (UI shells, see §9)
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   └── forgot-password/page.tsx
    └── (content)/                  ← blog + changelog + legal
        ├── blog/
        │   ├── page.tsx            ← blog index (PostCard grid)
        │   ├── [slug]/
        │   │   ├── page.tsx        ← post page (MDX render + related + prev/next)
        │   │   └── opengraph-image.tsx
        │   ├── tag/[tag]/page.tsx  ← tag-filtered index
        │   ├── feed.xml/route.ts   ← RSS 2.0 feed
        │   └── opengraph-image.tsx
        ├── changelog/
        │   ├── page.tsx            ← changelog index (ReleaseEntry list)
        │   ├── [slug]/
        │   │   ├── page.tsx        ← release page (MDX render + related blog posts)
        │   │   └── opengraph-image.tsx
        │   └── feed.xml/route.ts   ← RSS 2.0 feed
        ├── legal/page.tsx          ← placeholder
        ├── privacy-policy/page.tsx ← placeholder
        └── terms/page.tsx          ← placeholder
```

The `(unprotected)` group provides the sticky `HomeHeader` + centered main shell. Pages that need a footer (e.g. the home) render `<HomeFooter />` themselves — it is **not** included in the group layout. This is intentional; do not "fix" it by moving the footer into the layout (the auth and content pages do not want it).

The `(marketing)`, `(auth)`, `(content)` groups are organizational — they share the `(unprotected)` layout but each represents a different surface.

---

## 3. The blog + changelog engine surface

The blog and changelog are powered by **content-collections** (decision 2026-06-26; see `documents/internal/product/features/15-blog.md`).

### The engine surface, in one file

`apps/web/content-collections.ts` is the **entire engine configuration**. Three collections:

- **`authors`** (`content/authors/*.md`) — author entities (handle, name, avatar, bio). Decoupled from Better Auth.
- **`posts`** (`content/posts/*.mdx`) — blog posts. Drafts and scheduled posts are skipped at build time. Author FK resolved via `documents(authors)`. Reading time computed via `reading-time`. MDX body compiled via `compileMDX` from `@content-collections/mdx`.
- **`releases`** (`content/releases/*.mdx`) — public release notes (15.13). Categorized per Keep-a-Changelog convention. Optional `relatedPosts: string[]` for cross-linking to blog posts (15.15).

### The delete-test anchor

Removing the blog + changelog feature from `apps/web` cleanly (this is the load-bearing modular contract — `spec 20-cross-cutting.md`):

```bash
rm -rf apps/web/content \
       apps/web/content-collections.ts \
       apps/web/lib/blog \
       apps/web/src/components/blog \
       apps/web/src/app/\(unprotected\)/\(content\)/blog \
       apps/web/src/app/\(unprotected\)/\(content\)/changelog
```

After this rm:
- `apps/web` still builds (the `(content)` group routes are gone; legal/privacy/terms pages still exist as placeholders).
- `packages/ui` is unaffected.
- The rest of the monorepo is unaffected.

Then remove from `apps/web/package.json`:
```json
"@content-collections/core", "@content-collections/mdx", "@content-collections/next", "reading-time"
```

Then revert from `apps/web/next.config.ts`:
```ts
// Remove: import { withContentCollections } from "@content-collections/next";
// Remove: pageExtensions: [..., "md", "mdx"]
// Change: export default withContentCollections(nextConfig);
// To:     export default nextConfig;
```

Then revert from `apps/web/tsconfig.json`:
```json
// Remove the content-collections path alias
"content-collections": ["./.content-collections/generated"]
```

**The engine surface is one file.** That is the principle. If you find yourself wanting to split `content-collections.ts` into multiple files, you're breaking the delete-test.

---

## 4. Path aliases

Two distinct alias systems:

### TypeScript paths (for type resolution and editor IntelliSense)

```json
// tsconfig.json
"paths": {
  "@/*": ["./src/*"],
  "content-collections": ["./.content-collections/generated"]
}
```

- `@/*` → `apps/web/src/*` (for app code)
- `content-collections` → `apps/web/.content-collections/generated/*` (for `import { allPosts, allReleases } from "content-collections"`)

### Node.js subpath imports (for runtime resolution)

```json
// package.json
"imports": {
  "#components/*": "./src/components/*.tsx",
  "#lib/*":        "./src/lib/*.ts",
  "#hooks/*":      "./src/hooks/*.ts",
  "#blog/*":       "./lib/blog/*.ts"
}
```

- `#components/blog/post-card` → `apps/web/src/components/blog/post-card.tsx`
- `#blog/posts` → `apps/web/lib/blog/posts.ts`
- `#blog/types` → `apps/web/lib/blog/types.ts`

**Both systems are needed.** TS paths are for the editor and `tsc`; subpath imports are for the bundler and runtime. They overlap on app code but diverge for the blog engine (TS path: `content-collections`; subpath import: `#blog/*`).

---

## 5. Component organization

```
src/components/
├── auth/                           ← AuthCard components (login/signup/forgot-password UI)
├── footers/home-footer.tsx
├── headers/home-header.tsx
├── homepage/
│   ├── code-preview.tsx            ← used by HomePage
│   └── pixel-blast.tsx             ← used by HomePage (WebGL hero background)
├── blog/                           ← NEW: blog + changelog components
│   ├── post-card.tsx
│   ├── author-badge.tsx
│   ├── prose.tsx
│   ├── tag-list.tsx
│   ├── release-entry.tsx
│   └── post-meta.tsx
└── code-block.tsx                  ← used by code-preview
```

**Rule:** `packages/ui` is global, `src/components` is app-specific. Components in `src/components/blog/*` are typed against `Post` / `Release` from `#blog/types`. Do not put domain-specific components in `packages/ui`.

---

## 6. MDX rendering — via `@content-collections/mdx/react`

The blog + changelog MDX is rendered via `<MDXContent code={post.mdxCode} />` from `@content-collections/mdx/react`. The `mdxCode` field on each post + release is the JS module source string, produced by `compileMDX(context, document, options)` inside the content-collections transform.

There is **no `mdx-components.tsx`** in this app — MDX rendering is self-contained in content-collections. If you need to override MDX components (e.g. wrap `<a>` with Next.js Link), pass `components` to the `<MDXContent>` element:

```tsx
<MDXContent
  code={post.mdxCode}
  components={{
    a: ({ href, children }) => <Link href={href ?? "#"}>{children}</Link>,
  }}
/>
```

Shiki is wired in `content-collections.ts` via `@shikijs/rehype` with dual `github-light` / `github-dark` themes. CSS controls which theme shows.

---

## 7. Next.js 16 gotchas (worth re-reading `AGENTS.md`)

| Pitfall | Symptom | Fix |
|---|---|---|
| `params` is `Promise<{...}>` | TS error "Object is possibly 'undefined'" | `const { slug } = await params;` |
| `searchParams` is also `Promise<{...}>` | Same as above | Same pattern |
| `withContentCollections` return type | TS error about `Promise<NextConfig>` | Export the wrapper directly: `export default withContentCollections(nextConfig);` — do **not** wrap in async function (see §8) |
| `lucide-react@1.21.0` | Suspicious version (Lucide is normally 0.x) | If upgrading, watch for breaking changes |
| Three.js + Webpack | "Module not found" on WASM-oniguruma | Already handled: `serverExternalPackages: ["shiki"]` (extend if needed) |

---

## 8. The `withContentCollections` wrapper (issue #690)

`withContentCollections` returns `Promise<Partial<NextConfig>>`. Under Next 16 strict typing, wrapping it inside another plugin breaks. The maintainer-recommended fix:

```ts
// apps/web/next.config.ts
import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = { /* ... */ };
export default withContentCollections(nextConfig);
```

Export the promise directly. Next awaits it at build time.

If you later add a sync plugin that needs sync input, the chain becomes:

```ts
async function applyPlugins(cfg: NextConfig) {
  const withCc = await withContentCollections(cfg);
  return withNextIntl(withCc); // sync plugin gets sync input
}
export default applyPlugins(baseConfig);
```

**Rule:** `withContentCollections` must be either outermost (preferred) or `await`ed before being passed to a sync plugin.

---

## 9. Auth pages — the demo-vs-real ambiguity

`apps/web/src/app/(unprotected)/(auth)/{login,signup,forgot-password}/page.tsx` render the `LoginCard` / `SignupCard` / `ForgotPasswordCard` components. These are UI shells — there is no Hono mount, no Better Auth client, no database behind them.

**Current state:** the cards display the UI but cannot perform real auth. This is a deliberate demo mode (the marketing site shows what auth looks like in the buyer's app) — but it is not labelled as such, which is a known UX gap.

**Two paths forward:**
- **(a) Demo mode (current):** add a small banner "Preview only — real auth lives in your app" on each auth page.
- **(b) Real auth:** mount Hono + Better Auth in `apps/web`, route through real OAuth/email flow. Effort: 2-4 hours, requires `apps/web` to have its own backend.

**Decision pending.** Tracked in `documents/internal/product/open-questions.md` (TODO).

---

## 10. Cross-references

- **Buyer-facing mirror of the blog engine:** `documents/internal/product/features/15-blog.md` — the canonical spec for content-collections. The `apps/web` integration mirrors this spec, scoped to the marketing site.
- **Design system package:** `packages/ui/CLAUDE.md` — the operational guide for shadcn/ui in a monorepo. Required reading before adding primitives.
- **Repo-wide positioning:** `DESIGN.md` (canonical) vs `documents/internal/product/positioning.md` (stale as of 2026-06-26 — drift tracked in tech-lead memory).
- **Build roadmap:** `documents/internal/product/build-roadmap.md` — M0–M8 milestones.
- **Cross-cutting modular contract:** `documents/internal/product/features/20-cross-cutting.md` — 20.1 modular contract.
- **Delete test:** `documents/internal/product/features/23-testing.md` — 23.25 delete test.

---

## 11. Common pitfalls specific to this app

| Pitfall | Symptom | Fix |
|---|---|---|
| Moving `mdx-components.tsx` under `app/` | MDX components stop applying silently | Move it back to project root |
| Wrapping `withContentCollections` in async function | TS error or runtime "Config is undefined" | Export directly: `export default withContentCollections(nextConfig);` |
| Adding a post without creating the author | Build fails with "references unknown author" | Create `content/authors/<handle>.md` first |
| Using `process.env.NODE_ENV` checks in transform | Works, but `transform` is called only at build time, not per-request | Use `if (post.draft && process.env.NODE_ENV === "production") return undefined;` (already implemented) |
| Adding `<PostCard>` etc. to `packages/ui` | Couples design system to blog domain | Put blog components in `apps/web/src/components/blog/*` |
| Tag URL encoding | `/blog/tag/C++` 404s | Use `encodeURIComponent(tag)` in routes, `decodeURIComponent` in render |
| `getAllPosts()` order | Posts appear in random order | Already sorted by date desc in `lib/blog/posts.ts` |
| Forgetting `generateStaticParams` | Page works in dev, 404 in build | Add `export function generateStaticParams()` returning `allPosts.map(p => ({ slug: p.slug }))` |
| Forgetting `generateMetadata` | No OG tags on share | Already implemented in `[slug]/page.tsx` — copy the pattern |