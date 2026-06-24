---
name: project-apps-docs-stack-decision
description: apps/docs (product docs site at repo root) stack decision on 2026-06-24 — Fumadocs + shared packages/ui, scope deferred
metadata:
  type: project
---

On 2026-06-24, the user decided the stack for `apps/docs` (the standalone product docs site at repo root that explains the DeesseJS template):

- **Framework**: Fumadocs (Next.js-native docs framework, consensus 2026 winner per PkgPulse/StarterPick/MakerStack/Docsio)
- **Sharing**: Reuse `packages/ui` from the root workspace (shadcn primitives + DESIGN.md tokens). Fumadocs ships a shadcn preset (`fumadocs-ui/css/shadcn.css`) that adopts shadcn colors automatically.
- **Scope for v0.0.1**: deferred — user said "on verra après" — will revisit after scaffolding starts.

**Why:**
- Research surfaced Fumadocs as the 2026 consensus winner for Next.js docs (vs Nextra v4, Starlight, Mintlify, Docusaurus).
- supastarter (our ref for [[reference-supastarter-mailing-pattern]]) uses Nextra, but Fumadocs wins on three DeesseJS-specific points:
  1. `fumadocs-openapi` generates API reference pages from OpenAPI 3.x specs — fits [[project-orpc-better-auth-endpoints]] because oRPC emits OpenAPI.
  2. Our [[project-shadcn-final-state]] already has packages/ui with Tailwind v4 + shadcn tokens; Fumadocs' shadcn preset maps directly to it.
  3. Override cost of removing `next-themes` (Fumadocs default, conflicts with [[DESIGN.md §1.6]] "No JavaScript theme manager") is ~1h — small vs long-term cost of hand-maintaining API reference without fumadocs-openapi.

**How to apply:**
- When scaffolding apps/docs: follow `apps/web`'s Next.js 16 + Tailwind v4 + packages/ui pattern ([[project-shadcn-final-state]], [[reference-shadcn-monorepo-pitfalls]]).
- For Fumadocs theme integration: use `fumadocs-ui/css/shadcn.css` preset + import `packages/ui/globals.css` per the recipe in [Fumadocs discussion #1338](https://github.com/fuma-nama/fumadocs/discussions/1338).
- For dark mode: override `fumadocs-ui/provider` to use `data-mode` (DESIGN.md convention) instead of `next-themes`. Or use Fumadocs' `<ThemeProvider>` with custom value setter.
- Watch for `prose` conflict: Fumadocs has its own Tailwind Typography fork. If we ever need `@tailwindcss/typography`, set `className: wysiwyg`.
- When apps/template/apps/api (oRPC) has a stable OpenAPI spec, wire `fumadocs-openapi` to consume it. Not in v0.0.1.
- For the OpenAPI generation step: read [[reference-orpc-openapi]] (to be created when the time comes) — oRPC's `OpenAPIHandler` emits spec compatible with fumadocs-openapi generator.

**Out of scope (separately tracked):**
- `apps/template/apps/docs` (M2 docs sibling of web/cli in template workspace) — still empty, planned for later per [[project-m1-mail-checkpoint]].
- `apps/lite/apps/docs` — not started; will mirror template when scaffolded.

**Sources used:**
- https://www.fumadocs.dev/docs/comparisons (official comparison vs Nextra/Mintlify/Docusaurus)
- https://www.pkgpulse.com/guides/fumadocs-vs-nextra-v4-vs-starlight-documentation-sites-2026 (3-way 2026 comparison)
- https://github.com/fuma-nama/fumadocs/discussions/1338 (Tailwind v4 + shadcn monorepo recipe)
- https://www.fumadocs.dev/docs/ui/theme (shadcn preset + theme tokens)
- https://supastarter.dev/docs (our reference for mail pattern — uses Nextra but Fumadocs wins on our specific needs)
- [[DESIGN.md]] §1.6 (no next-themes rule)

---

## Strategy decisions (same session, 2026-06-24)

### 1. Docs surfaces — 2 surfaces, not 3

**Decision**: apps/docs (root) handles the **external/public doc site**. apps/template/apps/docs (M2) handles the **embedded doc for buyers who clone the template**. apps/lite/apps/docs is NOT a third distinct surface — it's just lite's mirror of template's docs.

**Why**:
- Public doc (apps/docs) and embedded doc (apps/template/apps/docs) serve different audiences (visitors vs buyers). They have different lifecycles (public = SEO + frequently updated, embedded = versioned with the cloned template).
- Layout Tabs in Fumadocs can separate **products** (Template / Cloud / API) within a single doc site — but NOT separate **deployment contexts** (public vs embedded).
- Trying to serve both contexts from one site forces compromises (one search, one design system, one SEO, one deploy).

**Open question for later**: how to share content between the two surfaces without drift. Options to evaluate when both exist: (a) shared `packages/content/` at root, (b) `apps/template/apps/docs` imports `.mdx` from a remote URL, (c) accept drift and use lint/CI to flag divergence. Defer to M2 when apps/template/apps/docs gets scaffolded.

### 2. Layout Tabs — Template (paid) + Lite (free) from v0

**Decision**: enable Layout Tabs in apps/docs v0.0.1 with **two tabs**:
- **Template** (paid)
- **Lite** (free / open-source starter)

Use the **explicit array form** in `baseOptions()`:
```tsx
tabs={[
  { title: 'Template', url: '/docs/template', description: '...' },
  { title: 'Lite',     url: '/docs/lite',     description: '...' },
]}
```

**Why**:
- Confirmed 2026-06-24: DeesseJS ships as TWO products (Template paid + Lite free), not one. Each has its own doc audience.
- Template = the paid SaaS template buyers clone. Lite = a free/open-source starter. They share branding but diverge on features and price.
- A doc site without tabs would either mix the two audiences (confusing) or pick one and lose the other.

**Content structure**:
- `apps/docs/content/docs/template/*.mdx` → slugs `['template', ...]`
- `apps/docs/content/docs/lite/*.mdx` → slugs `['lite', ...]`
- Shared meta pages (e.g. "What is DeesseJS?", "Why DeesseJS?") can live at `apps/docs/content/docs/index.mdx` or `apps/docs/content/docs/(shared)/...` (route group, doesn't affect slugs).
- Each tab gets its own sidebar from its own subtree of the page tree.

**Open question**: do Template and Lite share common pages (e.g. "Getting Started", "Architecture overview") or are they fully separate docs? — ask user before writing content. If shared, use a `(shared)` route group to host them once and link from both tabs.

**See**: [[reference-fumadocs-api#4.4 Root folders = Layout Tabs (3 ways to enable)]] for the 3 ways to configure tabs.

### 3. Deploy target — Vercel for v1

**Decision**: deploy apps/docs on Vercel for v1.

**Why**:
- OG image generation works out of the box (uses Node runtime + sharp).
- Search Orama server-side works without adaptation.
- Cloudflare Pages would require forcing Node runtime explicitly (Fumadocs docs: "doesn't work on Edge runtime" — see [[reference-fumadocs-api#8.1 Edge runtime = NO-GO]]).
- Static export breaks search + dynamic OG — too much loss for v1.

**Action item**: set `sidebar={{ prefetch: false }}` in `baseOptions()` from day 1. Fumadocs docs explicitly warn: prefetch on Vercel causes higher serverless function usage and can hit limits. See [[reference-fumadocs-api#14. `sidebar.prefetch: true` is expensive on Vercel]].

**Future path**: when we want to leave Vercel (cost, lock-in), migrate to static export + Algolia (search) + pre-computed OG. Out of scope for v1.

### 4. packages/ui promotion — defer until apps/docs needs it

**Decision**: don't promote `apps/template/packages/ui` → root `packages/ui` yet. Do it when apps/docs needs to consume it.

**Why**:
- Today apps/docs doesn't import any packages/ui component yet (still on default neutral theme).
- The refactor (move packages/ui to root + update all importers in apps/template) is a separate ~2h chunk.
- Doing it now without a concrete consumer = work without validation.

**Trigger condition**: when we start wiring apps/docs to shadcn components (theme switch to shadcn.css, packages/ui globals.css import). That's when the promotion becomes necessary, not before.

### 5. Theme preset — `black` (not `neutral`) for apps/docs public

**Decision**: use the `black` Fumadocs preset for apps/docs (`@import 'fumadocs-ui/css/black.css'`), not the default `neutral`.

**Why**:
- Confirmed 2026-06-24 by user. The `black` preset has light bg = hsl(0, 0%, 98%) (almost white) and dark bg = hsl(0, 0%, 0%) (PURE black). Neutral is grey-er (light 96%, dark 7%).
- Matches [[DESIGN.md §0]] "agentic" positioning: "dev-tool native", "terminal/code aesthetics", "restrained neutrals dominate; primary color is a punctuation accent".
- Stark black/white contrast embodies "Apple restraint + agentic" wedge better than neutral's middle-grey mush.
- Stand-out choice vs competitors (most docs use neutral-like greys).

**Risks acknowledged**:
- Pure black/white can feel "intimidating" to non-dev visitors. Mitigate by reserving pure black for dark mode (most docs read in light by default) and ensuring callout colors stay readable.
- The 11 Fumadocs presets available: `neutral` (default), `black`, `vitepress`, `dusk`, `catppuccin`, `ocean`, `purple`, `solar`, `emerald`, `ruby`, `aspen`, plus `shadcn` (adopts custom tokens).

**Fallback**: if `black` proves too stark after visual review → revert to `neutral`. Single-line CSS import change.

**For embedded docs** (apps/template/apps/docs, apps/lite/apps/docs — later): `neutral` likely better, since cloned-by-buyers sites prioritize comfortable reading over brand edge. Re-evaluate when those surfaces are scaffolded.

**See**: [[reference-fumadocs-api#7. CSS variables and theme presets]] for the full preset inventory and the `--color-fd-*` token list that each preset defines.