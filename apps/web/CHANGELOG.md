# web

## 0.2.0

### Minor Changes

- 3f40fd1: Add the `/playbook` lead-magnet landing page: single email field +
  optional consent checkbox + a `Resend Topic` subscription for
  future-marketing opt-in + transactional PDF email via the existing
  `mailer` singleton. Includes in-memory rate-limit and email-dedup
  primitives on the orpc side that mirror the existing Hono
  middleware. Funnel aliases `/ig`, `/x`, `/in` capture social-media
  clicks onto the same page.

  The consent checkbox subscribes the contact to a Resend Topic, which
  models a subscription preference. A Segment is for internal ranking
  and is not used. `RESEND_PLAYBOOK_TOPIC_ID` names the Topic and is
  required in production, so the checkbox cannot look like it works
  while recording nothing.

  The PDF deliverable is at `apps/web/public/playbook.pdf`, and the
  signup email links it at `<WEB_URL>/playbook.pdf`. The three funnel
  pages are force-dynamic and noindex so they never resolve to a stale
  redirect and search engines skip them.

  ## Operational prerequisites
  - `RESEND_PLAYBOOK_TOPIC_ID` must be set in every environment that
    serves production traffic. It is the id of a Resend Topic, created
    in the dashboard under Audience, Topics. The env schema rejects a
    missing value at startup in production, so this is a startup
    failure rather than a silent no-op.
  - The marketing emails go out as Broadcasts or Automations, which
    carry the Resend-managed unsubscribe footer. The PDF email points
    there, since a transactional send carries no unsubscribe link of
    its own.

### Patch Changes

- ac69a68: Implements the session-aware header for `apps/web`.

  Anonymous visitors on the marketing site now see `Log in` and `Sign up` buttons in the header (linking cross-app to `apps/app`'s auth pages).
  Authenticated visitors see an avatar dropdown with `Dashboard` and `Sign out` (with a confirmation dialog).
  The right-side `Coming soon` placeholder on both desktop and mobile is gone.

  User-visible:

  - The desktop header right cluster on every public page of `deessejs.com` now renders either two CTA buttons (anonymous) or an avatar trigger (authenticated), instead of the disabled `Coming soon` button.
  - The mobile Sheet footer renders the same control set, adapted to a stacked layout with full-width buttons.
  - Clicking `Sign out` from the avatar dropdown opens a confirmation dialog.
    Confirming signs the user out via `authClient.signOut()` and redirects to `app.deessejs.com/login` with a full page reload, so the next paint shows the anonymous CTA set.

  API surface:

  - `@workspace/env` gains `PARENT_DOMAIN: z.string().min(1).optional()` in `serverInputShape`, materialised in `serverEnv`.
    The production gate in `serverSchema.superRefine` fails when `PARENT_DOMAIN` is undefined under `NODE_ENV=production`, so `packages/auth` cannot enable cross-subdomain cookies without an explicit value.
  - `@workspace/auth` enables `crossSubDomainCookies: { enabled: true, domain: serverEnv.PARENT_DOMAIN }` and `defaultCookieAttributes: { sameSite: "none" }` in `packages/auth/src/auth.ts` when `PARENT_DOMAIN` is set.
    No-op in dev when the field is unset.
    The production `trustedOrigins` list is now derived from `serverEnv.WEB_URL`, `APP_URL`, and `DOCS_URL` (each normalised through `new URL(x).origin`), so adding a new deployed origin only requires updating the URL fields, not this file.
  - `apps/web` gains `apps/web/src/lib/auth-client.ts`, which instantiates `createAuthClient` from `better-auth/react` with `baseURL: clientEnv.NEXT_PUBLIC_API_BASE_URL` and `basePath: API_AUTH_PATH` (imported from `@workspace/api/base-path`, the subpath).
    The barrel `@workspace/api` is not imported because it would drag `@workspace/auth` into the client bundle.
  - `apps/web/src/components/headers/user-menu.tsx` is the new client component mounted by `SiteHeader` in both desktop and mobile slots.
    Pure helpers `getInitials` and `getAvatarUrl` are extracted into `user-menu-helpers.ts` for unit testing.
  - `apps/web/next.config.ts` adds `vercel.com/api/www/avatar` to `images.remotePatterns` and the matching `dangerouslyAllowSVG` / `dangerouslyAllowLocalIP` flags, mirroring `apps/app/next.config.ts`.

  Vercel env (operational, no code change):

  - Set `PARENT_DOMAIN=deessejs.com` on `apps/app`'s Vercel project for production.
    Without it, the env schema gate fails at startup and the auth client never resolves a session on `apps/web`.
  - Confirm `ALLOWED_ORIGINS` on `apps/app`'s Vercel project already includes `https://deessejs.com` (mandated by the inter-app-URL config for the templates fetch; the same value now also covers the credentialed auth-client `get-session` fetch).

- eee4493: Redesign the templates index cards (rotated hero image, latest-guides vocabulary) and remove `saas-starter-multi-tenant` from the registry while it is being stabilised.

  - `@workspace/contracts`: adds an optional `image` field to `TemplateV1`. The field is `string | undefined`, so existing clients continue to parse without change.
  - `@workspace/api`: declares the seven remaining templates' cover images in the static registry. The `enrich` step spreads `...entry`, so `image` propagates automatically. `saas-starter-multi-tenant` is removed.
  - `web`: `templates/page.tsx` stylises the "Ship your template" CTA (transparent background, top border only, no radius). `templates/template-card.tsx` and `templates/template-detail.tsx` consume `template.image` and render the hero with the same `-rotate-3 origin-bottom-right translate-x-[10%] translate-y-[10%]` chrome as the homepage latest-guides carousel. Homepage coding-agents h2 used `lg:text-heading-48` (one step above the rest of the homepage) — now aligned at `lg:text-heading-40`.

- af040af: Implements first-class inter-app URLs in `@workspace/env`,
  removing the relative-path construction in three consumers.

  User-visible:

  - `https://deessejs.com/templates` and
    `https://deessejs.com/templates/[slug]` now render the populated
    catalog and the detail page respectively. Previously, the
    marketing site's oRPC client fetched `/api/v1/rpc/templates/list`
    relative to `deessejs.com`, which does not host the backend (the
    catch-all lives in `apps/app/app/api/[[...route]]/route.ts` on
    `app.deessejs.com`). The marketing site was showing the documented
    empty state and `/templates/[slug]` returned a Next.js 500.
  - `npx @deessejs/cli list` (and every other published CLI command)
    now resolves the API host to `https://app.deessejs.com` by
    default, instead of failing because it resolved the URL against
    the user's working directory.

  API surface:

  - `@workspace/env` gains four server fields (`WEB_URL`, `APP_URL`,
    `DOCS_URL`, `API_BASE_URL`) and four client fields
    (`NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`,
    `NEXT_PUBLIC_DOCS_URL`, `NEXT_PUBLIC_API_BASE_URL`). Defaults are
    localhost ports in dev and the canonical Vercel domains in
    production. A `.refine` rejects trailing slashes at parse time.
  - `apps/web/src/lib/orpc.ts` builds the oRPC URL via
    `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
  - `apps/app/proxy.ts` builds the auth probe URL via
    `new URL(path, serverEnv.API_BASE_URL)`.
  - `apps/cli/src/api/client.ts` and `apps/cli/src/version/check.ts`
    read `process.env.API_BASE_URL` directly (the published tarball
    cannot depend on the private `@workspace/env` package). Override
    via shell env (`API_BASE_URL=https://staging.example.com
deessejs list`).

  Tests:

  - New unit suite at `packages/env/tests/unit/schema.urls.test.ts`
    pins the URL contract (defaults parse, production URLs parse,
    trailing slashes rejected, non-URLs rejected).

  Vercel env (operational, no code change):

  - Production: `API_BASE_URL=https://app.deessejs.com` and the
    `NEXT_PUBLIC_API_BASE_URL` mirror must be set on `apps/web`'s
    Vercel project.
  - Production: `ALLOWED_ORIGINS` on `apps/app`'s Vercel project must
    include `https://deessejs.com` for the cross-origin
    no-credentials fetch from the marketing site (see the
    Cross-origin considerations section of the inter-app URL
    config).
  - Preview deployments: each Vercel preview defaults to
    `https://app.deessejs.com` (the schema default). A future
    write-up covers preview-vs-preview wiring.

- 7a507e0: Use the public staging app domain for web catalog and authentication requests.
- ba74f0c: Fixes issue #81: the `/templates` index page rendered the empty-state for up to ten minutes after a single transient failure of `orpc.templates.list()`. Two interacting anti-patterns caused it:

  - `apps/web/src/lib/orpc.ts` hard-coded `next: { revalidate: 600, tags: ["templates"] }` on every oRPC call, so every RSC call-site shared a single Next.js data-cache key.
  - The four call-sites for `orpc.templates.list()` (`templates/page.tsx` index, `templates/[template_slug]/page.tsx` `generateStaticParams` / `generateMetadata` / detail page) swallowed errors as `[]`. The first thrown error cached `{ templates: [] }` for ten minutes.

  What's in this patch:

  - The `RPCLink` fetch wrapper now reads per-call `options.context.cache` and threads a namespaced tag (`templates:live` vs `templates:static`) and revalidate window onto the request. Without context the wrapper falls back to the previous site-wide behavior (`revalidate: 600`, tag `"templates"`) so any future call-site that forgets to set context does not silently change semantics.
  - Two ergonomic helpers are exported from `apps/web/src/lib/orpc.ts`: `liveCache` (`revalidate: 0`, tag `templates:live`) for live runtime + on-demand metadata, and `staticParamsCache` (`revalidate: 600`, tag `templates:static`) for `generateStaticParams`. They wrap the underlying `context.cache` shape so call-sites stay readable.
  - Live runtime call-sites now re-throw on fetch error so the segment's existing `error.tsx` client boundary renders the "Try again" state instead of silently caching an empty body. The detail-page catch deliberately does NOT call `notFound()` — a fetch error is not a 404.
  - During `next build` (`NEXT_PHASE === "phase-production-build"`) the runtime call-sites fall back to their previous graceful-degradation behavior so the build still ships when the API is unreachable. Production runtime always re-throws.
  - `generateStaticParams` keeps its `try/catch → []` so a flaky API does not break CI.
  - The misleading "build-time-only" comment in `templates/page.tsx` and the misleading "render a minimal placeholder" comment in the detail page are replaced with accurate descriptions.
  - The previously tautological per-call context type (`MarketingCallContext`) is renamed to `FetchCacheOptions` to avoid conflation with the server-side `BaseContext` (`packages/api/src/orpc/base-context.ts`). They are separate types with separate lifecycles; the rename makes the distinction self-documenting at call-sites.
  - The translation logic is extracted into a pure function `buildFetchIsrInit(init, cacheDirective)` colocated with the wrapper. A new vitest suite (`apps/web/src/lib/orpc.test.ts`) pins the translation contract — defaults, `liveCache`, `staticParamsCache`, partial directives, non-mutation of the input `init`, and pass-through of `headers` / `method` / `body`. The whole marketing site has unit-test infrastructure added (`vitest.config.ts`, `@workspace/vitest-config` devDep, `test` script) so future helpers can be tested the same way.

  No public consumer-facing API change. `/templates` and `/templates/[slug]` continue to render the same way they did before, except a transient upstream failure now resolves through the error boundary instead of pinning the empty-state.

- 468effd: Gives every catalog category a display label and allowlists the deployed template images.

  `CATEGORY_LABELS` held `saas`, `ai` and `landing` while the registry uses seven categories, so
  the intersection was `saas` alone. Six of the seven templates could not be reached through any
  type filter, and `?type=ai` returned nothing even for `eve-starter`, whose curated labels
  include `ai`. Six labels are added: `desktop`, `docs`, `marketing`, `content`, `library` and
  `ai-agent`.

  This is a visible correction, not a behavior-preserving change. The Type filter grows from three
  options to nine. Seven of them now return their row; `ai` and `landing` stay at zero, because no
  template's category is `ai` or `landing`, and `eve-starter`'s category is `ai-agent`, a separate
  key. Both keys are kept: they are the public slugs of two type filters, and removing them would
  change what the sidebar renders for no other reason.

  Adds `packages/api/src/templates-images.ts`, the allowlist of the seven template images deployed
  in `apps/web/public`, exported as the `@workspace/api/templates-images` subpath so a writer can
  validate a submitted filename against the list without accepting a path.

  `packages/api/tests/unit/category-maps.test.ts` pins the map against the registry and the
  allowlist against the deployed files. `apps/web/tests/unit/template-category-filters.test.ts`
  pins the filter itself, which moved out of the page into `apps/web/src/lib/template-filters.ts`
  so it can be asserted on directly.

- c06ac07: Consolidates the three divergent `PostCard` grid implementations behind a single `PostCardGrid` component plus a sibling `FeaturedRow`. Replaces the inline `[&>li]:border-r [&>li]:border-b` + four `nth-child` drop rules used by `/blog/author/[handle]` and the "Related reading" block on `/blog/[slug]` with the same `-mr-px -mb-px` + outer `overflow-hidden rounded-xl border` recipe already used by `/blog`, so all three sites share one visual frame and one border contract.

  User-visible:

  - `/blog/author/[handle]` and the "Related reading" block on `/blog/[slug]` now render inside the same rounded wrapper as `/blog`. The 1-px overflow on the last card when an author has a single post is gone.
  - The featured row above the `/blog` main grid no longer carries a `border-b`, eliminating the 2-px double rule between the last featured cell and the first main-grid row.
  - The featured row now scales past 2 cards (`index === featured.length - 1` instead of hardcoded `index === 0`).
  - Both `<ul>`s on `/blog` get `aria-label="Featured posts"` and `aria-label="All blog posts"` (or `"Posts"` on author/related where there is no featured row).

  API surface:

  - `@/components/blog/blog-post-grid.tsx` exports `PostCardGrid` (renamed from `BlogPostGrid`) with the same `posts` + `featured` props, plus a new optional `gridCols: "1-2-3" | "1-2-3-4"` (default `"1-2-3-4"`).
  - `@/components/blog/featured-row.tsx` is a new named export. Server-compatible. Renders 1-col mobile / 2-col `lg+`. No per-cell `border-b` — the main grid's first row supplies the visual divider.
  - `@/components/blog/blog-search.tsx` imports the renamed export and updates the JSX tag. The "featured hidden while searching" invariant (`featured={isSearching ? undefined : featured}`) is preserved verbatim.
  - `/blog/author/[handle]` and `/blog/[slug]` route their `<ul>` through `<PostCardGrid posts={…} gridCols="1-2-3" />` and drop their now-unused `PostCard` imports.
  - `BlogPostGrid`'s outdated doc comment (it claimed nth-child selectors were in use) is rewritten to describe the canonical Pattern B recipe.

  Not user-visible:

  - The French in-source comment `Grille de cartes (Zéro nth-child, zéro double bordure)` is replaced with the English doc comment in the rewritten file.

  No env var, no DB schema, no changeset to other packages (`web` is the only consumer of `@workspace/ui` changes, and there are none here).

- 19fe93a: Aligns the KB index topic card with the sibling PostCard pattern (`commit 992efbc`). Drops the orphan `topic.tags` row on the topic cards (no filter, no link, capped at 3 silently), aligns type scale (`text-xl font-medium tracking-tight`), footer padding (`mt-auto px-6`), and hover cues (drops the unique `group-hover:underline` so topic cards animate the same way as guide cards).

  A11y:

  - The Topics grid's `TopicCard`, the Featured Guides grid's `GuideCardCompact`, and the per-page `GuideCard` now render the card title as a real `<h3>` (was a `CardTitle` `<div>`). The KB section's outline now goes `<h2>Topics</h2>` → `<h3>Agents</h3>` etc. — screen readers and search engines can index the topics as headings.
  - The decorative `ArrowRight` and `Clock` icons now carry `aria-hidden="true"`. Their containing link's `aria-label` already names the topic / guide / reading-time, so the icons add no information.

  User-visible on `/knowledge-base`:

  - Topics grid: no tags row, title typography aligned with Featured Guides, hover background only (no underline), footer hugs the bottom edge.
  - Featured Guides + All Guides + per-page Guide: identical visual, but the DOM now contains real `<h3>` headings — no styling change.

  Build-time:

  - `kb-card-grid.tsx` header doc rewritten to acknowledge the multi-row grid limitation with `divide-y divide-x` (`tailwindlabs/tailwindcss#13400`). No class change. Migration to Pattern B is intentionally deferred to a PR that aligns `PostCardGrid`, `KbCardGrid`, and `TemplateGrid` together.

  Not user-visible: drop of three unused imports in `knowledge-base/page.tsx` (`CardContent`, `CardTitle`, `TopicTagPill`) after the `TopicCard` simplification.

  No env var, no DB schema, no changeset to other packages.

- Updated dependencies [15dd75e]
- Updated dependencies [ac69a68]
- Updated dependencies [5e9a36a]
- Updated dependencies [03eabde]
- Updated dependencies [eee4493]
- Updated dependencies [bbe9519]
- Updated dependencies [af040af]
- Updated dependencies [3f40fd1]
- Updated dependencies [ba74f0c]
- Updated dependencies [fbd06d7]
- Updated dependencies [0d0f793]
- Updated dependencies [990b38c]
- Updated dependencies [898c8ab]
- Updated dependencies [ebd1cd2]
- Updated dependencies [2dd0c6e]
- Updated dependencies [f806fc0]
- Updated dependencies [a1cf6f8]
- Updated dependencies [dc7fd29]
- Updated dependencies [d37a109]
- Updated dependencies [468effd]
- Updated dependencies [2befd40]
- Updated dependencies [e48d446]
  - @workspace/api@0.1.0
  - @workspace/env@0.1.0
  - @workspace/contracts@0.0.2
  - @workspace/ui@0.1.0
  - @workspace/analytics@0.0.2
  - @workspace/cookies@0.0.2

## 0.1.0

### Minor Changes

- b456379: Add the `/pricing` route on the marketing site, implementing the three-layer catalog pricing strategy defined in `documents/internal/product/pricing.md`.

  Page composition:

  - Hero, three-layer cards (Open Community, Pro, Enterprise), detailed comparison table.
  - A "What lifetime means here" section with four bullets covering the future-template guarantee, no lock-in, amortized cost, and the 14-day refund window.
  - Refund and license bullets, with a Pro Education note and a `mailto:` link to request access.
  - Persona block, FAQ accordion, and a footer CTA strip with a primary `Browse the catalog` action and a secondary `Email us` mailto.

  Marketing-side copy is driven by a single config object (`apps/web/src/lib/pricing.ts`). All strings mirror the strategy doc verbatim, so the doc stays the single source of truth.

  Strategy-doc updates reflected in the page:

  - Pro is now a one-shot $299 lifetime package, full Pro catalog, no per-template price, no renewal, no subscription.
  - The 12-month update window and 50% renewal sections are removed from `documents/internal/product/pricing.md`.
  - The freelancer re-sell clause is kept as-is.

  V1 has no checkout: Pro CTAs point at `mailto:hello@deessejs.com`. The CTA wording is factual, no guru-selling copy. No em dashes in the page or in the strategy doc body.
