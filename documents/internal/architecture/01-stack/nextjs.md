# Next.js

## Decision

**Next.js** (latest stable, App Router, React Server Components, TypeScript) as the web framework for every Next.js app in the repo.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Next.js runs:

- `apps/template/apps/web/` — the buyer's web app
- `apps/template/apps/docs/` — the buyer's docs site (via Fumadocs)
- `apps/web/` — our seller app (`deessejs.com`)
- `apps/docs/` — our docs site (`docs.deessejs.com`)
- `apps/demo/` — the public demo
- `apps/lite/` — the OSS subset
- `apps/cloud/` — the Cloud operator admin (post-v1)

Next.js is **not** used for:

- `apps/template/apps/cli/` — that's Bun, not Next.js.

## What Next.js gives us

1. **App Router + React Server Components.** The default SSR + streaming + server actions story. RSC lets us draw the server/client boundary explicitly (see `architecture/03-web-app/server-client-boundaries.md`).
2. **File-system routing.** Route groups (`(marketing)`, `(app)`, `(system)`) for layout boundaries without polluting URLs.
3. **Built-in image, font, and metadata optimization.** Less custom code, better Lighthouse scores out of the box (per feature 19.5, 19.6, 22.x).
4. **Server actions.** Forms and mutations without an explicit API route.
5. **Middleware.** Edge middleware for auth checks, redirects, geo-blocking, rate limiting at the edge.
6. **Vercel-deploy-by-default.** Zero-config deploy to Vercel (feature 22.x SEO benefits, preview deploys per PR).
7. **Largest ecosystem.** Every SaaS template library has Next.js examples. Every AI tool generates Next.js by default.

## Why Next.js (not Remix, not Astro, not SvelteKit)

| Alternative | Why not |
|---|---|
| **Remix / RR7** | SaasRock uses it (per competitive teardowns). Smaller ecosystem than Next.js. Server Components story is less mature. |
| **Astro** | Content-first, weak for SaaS apps with heavy interactivity. RSC support is recent. |
| **SvelteKit** | Different language (Svelte). Smaller SaaS template ecosystem. |
| **TanStack Start** | Newer, less mature, smaller ecosystem. |
| **Vite + custom SSR** | We'd reinvent Next.js badly. |

Next.js wins on ecosystem maturity, RSC + server actions, and Vercel deploy story.

## Conventions

- **App Router only.** No Pages Router. New code uses `app/`.
- **TypeScript strict.** `tsconfig.json` extends the shared root config (`packages/tsconfig`).
- **Server Components by default.** Opt into Client Components with `"use client"` only when needed (state, effects, browser APIs).
- **Route groups for layouts.** `(marketing)`, `(app)`, `(system)`, `(docs)` — never appear in URLs.
- **Server actions for forms** (where appropriate). oRPC calls for everything else.
- **No `getServerSideProps` / `getStaticProps`.** The App Router has different primitives.

## Cross-references

- [`../03-web-app/`](../03-web-app/) — the web app's internal architecture (route structure, layouts, boundaries).
- [`../05-modular-contract/`](../05-modular-contract/) — how features live inside `src/features/<name>/`.
- [`../10-decisions/0001-monorepo.md`](../10-decisions/) — the monorepo setup that hosts multiple Next.js apps.
- [`../../product/features/10-ui.md`](../../product/features/10-ui.md) — the UI feature inventory.
