---
name: project-deessejs-templates-library-needs
description: Requirements analysis for the DeesseJS templates library (gallery + registry + deploy button, NOT the CLI); 9 use cases, 3 tiers, 6 founder questions pending
metadata:
  type: project
---

Researched 2026-07-02 in response to founder's request "Je veux qu'on analyses en fait la librairie de templates, les besoins".

## Scope (what this covers and doesn't)

The "templates library" = the 3 surfaces around templates EXCEPT the CLI:
- Registry (data source for templates)
- Gallery web (deessejs.com/templates)
- Deploy button (the bridge from discovery to live app)

The CLI (`deesse init`) is documented separately in `documents/internal/architecture/12-apps/cli/`.

## 9 use cases in 3 tiers

**Tier 1 — MVP ship-blockers**:
- UC1 — Discover by category (Use Case × Framework filters)
- UC2 — Individual template page (hero + features + stack + deploy button)
- UC3 — 1-click deploy (URL generates `vercel.com/new/clone?repository-url=...`)

**Tier 2 — M0.2 (1 month after MVP)**:
- UC4 — Compare side-by-side
- UC5 — Full-text search (Fuse.js at MVP, Algolia post-50 templates)
- UC6 — Newsletter / RSS for new templates (incl. JSON Feed per agent-first thesis)

**Tier 3 — Post-MVP**:
- UC7 — Submit external template
- UC8 — Per-template changelog
- UC9 — Usage stats (social proof)

## 6 founder decisions pending

1. Naming du registry repo (`deessejs/templates-registry` recommended)
2. OG images strategy: auto-generated via `@vercel/og` vs. pre-generated PNGs
3. Search at MVP: ship without or with Fuse.js
4. URL pattern for filters: multi-value searchParams vs. short slugs
5. Sitemap: global vs. dedicated `/templates/sitemap.xml`
6. "Copy CLI command" button connecting gallery to agent-first CLI

## Key tech decisions (with rationale)

- **Registry**: Option A (`deessejs/templates-registry` repo with JSON files) at MVP. Option C (lightweight CMS like Sanity) when UC7 emerges.
- **Gallery framework**: Next.js 16 App Router (already in repo), Tailwind v4 + `@deessejs/template-ui` (to be created)
- **Data fetching**: GitHub raw API + ISR (1h revalidate)
- **Filters state**: URL searchParams (shareable, agent-readable)
- **Deploy button**: server component, generates URL from `manifest.json` — no client JS
- **OG images**: `@vercel/og` ImageResponse with dynamic params

## Stack consistency with existing repo

Reuses: `apps/web/` (Next.js), Tailwind v4, `next-intl`, Plausible analytics, `@deessejs/cli` for the "Copy CLI" button variant.

## Connection to other parts of the system

- Templates = external repos (decided in `12-apps/cli/`)
- `manifest.json` schema = contract from `12-apps/cli/template-conventions.md`
- `stores` parameter = the Cloud integration point (see [[reference-vercel-templates-system]])
- Agent-first thesis ([[reference-agent-first-cli-principles]]) drives the "Copy CLI" button + JSON Feed + parseable URLs

## What was researched to inform this

- [[reference-vercel-templates-system]] — Vercel Templates 3-surface architecture
- [[reference-agent-first-cli-principles]] — agent-first design constraints
- Vercel Deploy Button docs (query params, stores parameter)
- `@vercel/examples-ui` deepwiki (the design system pattern for templates)

## Suggested next deliverable

1. Founder answers the 6 questions
2. Tech lead delivers non-code spec: `templates-registry` structure + `apps/web/src/app/templates/` file tree + `<DeployButton>` component spec
3. First concrete deliverable: static `/templates/starter` page with hardcoded deploy button to validate UX before generalizing

## Status: docs persisted

3 docs created in `documents/internal/architecture/03-web-app/` on 2026-07-02:

- `templates-library.md` — index doc (3 surfaces map, personas, MVP scope, 6 open questions, conventions)
- `templates-gallery.md` — gallery routes (`/templates/*`), data source (GitHub registry repo + ISR), filter UX (URL state), SEO (sitemap/OG/JSON Feed/i18n)
- `deploy-button.md` — `<DeployButton>` component spec (signature, URL composition for Vercel deploy button, edge cases, accessibility, tests, variants roadmap)

The `03-web-app/README.md` was updated to reference these 3 new files in the file list and add a "Templates gallery" entry in the surface map.

## 2026-07-02 update: DemoButton added

Per founder request "on doit aussi avoir un bouton potentiel see demo", a 4th surface was added:

- `demo-button.md` — `<DemoButton>` component spec (mirror of deploy-button.md structure; friction-free CTA, paired with DeployButton on the hero)
- `manifest.json.demo` field added to the schema in `12-apps/cli/template-conventions.md` (string at MVP, `DemoDescriptor` object at M0.2 when CI auto-deploys the demo)
- `templates-library.md` updated to 4 surfaces
- `templates-gallery.md` updated to describe the hero CTA row (Deploy primary + Demo secondary)
- `03-web-app/README.md` updated to list the new doc + add `demo-button.md` note

Rationale (Vercel pattern): most gallery visitors aren't ready to commit to forking the template. Demo = "peek first, decide later" with zero friction (no OAuth, no env vars). Deploy = "commit, fork, customize". Two buttons, two intents.