---
name: web-architecture
description: apps/web — public static site (marketing/blog/changelog/legal), NO auth, separate Next.js deploy from apps/app
metadata:
  type: project
---

# apps/web — Public static site

**Role**: public-facing, anonymous, static. Marketing, blog, changelog, legal pages. Separate Next.js deploy from [[app-architecture]].

- No auth, no `/login`, no `/signup`, no dashboard here.
- When the header/footer links to `/login` or `/signup`, those routes live in `apps/app` — link is intentional cross-app navigation.
- When the header/footer/MDX links to `/docs`, that route lives in `apps/docs` ([[docs-architecture]]) — also intentional cross-app nav.
- Both apps share `packages/ui` for components and `packages/ui/lib/config` for `APP_CONFIG`.

## README mismatch — known

The `apps/web/README.md` mentions route groups `(protected)/` and `(unprotected)/` in its structure section. **These do not exist here** — that auth pattern lives only in `apps/app`. The README is wrong on this point; the route groups are NOT a web concern.

## Landing page (`src/app/page.tsx`) — deferred, not a priority

Currently a `Button` "Project ready!" placeholder. Per user decision on 2026-07-07, this is **explicitly not a priority** and is left as-is for now. Do not propose to "fix" or build out the landing page unprompted.

**Why:** user judges the placeholder acceptable for the template's current state.

**How to apply:** skip landing-page work in recommendations and gap analyses for `apps/web` until the user signals otherwise.

## src/ structure

```
apps/web/
├── src/
│   ├── app/           # Next.js routes
│   ├── components/     # App components
│   ├── lib/          # Helpers, blog lib, utils
│   └── stores/        # Zustand stores (NO lib/stores)
├── content/           # MDX content
│   ├── authors/
│   ├── posts/
│   └── releases/
└── content-collections.ts
```

`@/*` dans tsconfig → `src/*`

## Zustand stores

**Location**: `src/stores/cookies/cookie-consent.ts`

Pattern:

```ts
export const useCookieConsentStore = create<State & Actions>()((set, get) => ({
  consent: loadStored() ?? DEFAULT,
  hasDecided: loadStored() !== null,

  acceptAll: () => {
    persist(full)
    set({ consent: full, hasDecided: true })
  },
  // ...
}))
```

Pas de provider. Chaque composant appelle `useCookieConsentStore()` directement.

**Ne pas utiliser `useSyncExternalStore`** — break le prerendering Next.js.

## Blog + Changelog

- `content-collections.ts` génère les types `allPosts`, `allAuthors`, `allReleases`
- Collections : `posts`, `authors`, `releases`
- Multi-auteur, tags libres, drafts, reading time, MDX+Shiki
- Routes : blog (liste, slug, tag, author), changelog (index, slug)
- SEO : OG images, RSS feeds, sitemap, JSON-LD
- Search : Fuse.js dialog accessible via `⌘K`/`Ctrl+K` ou bouton sur les pages blog/changelog
