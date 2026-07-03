# Templates library — index

The system around DeesseJS templates, as experienced by users (devs, agents, founder). Three coupled surfaces, one product goal: **turn "I want a SaaS template" into a live app in under 2 minutes, with one click**.

**Date**: 2026-07-02. **Current state**: not started. **Owner**: tech lead.

## Purpose

Document the shape of the templates library — what surfaces exist, how they fit together, what's MVP and what's post-MVP, who owns what.

This is **the index**. Each surface has its own doc with the deep dive:

- **Registry** — the data source. See [`template-conventions.md`](../12-apps/cli/template-conventions.md) (lives in the CLI docs because the manifest.json schema is the contract the CLI consumes).
- **Gallery** — the web app routes. See [`templates-gallery.md`](./templates-gallery.md).
- **Deploy button** — the UI component. See [`deploy-button.md`](./deploy-button.md).

The four docs together cover everything a contributor needs to know.

## Why this exists

The DeesseJS "template product" has three failure modes if we don't think about it explicitly:

1. **Drift** — the gallery shows a template whose `manifest.json` is stale. Solved by reading from the registry repo at build time (ISR + revalidate).
2. **Dead-end** — a user finds a template but can't figure out how to deploy it. Solved by the `<DeployButton>` being primary CTA on every template page.
3. **Lock-in** — a user picks a template and finds it can't be customized. Solved by the modular contract (each template is a deletable instance of the DeesseJS pattern, not a frozen artifact).

The three surfaces exist to prevent these three failure modes.

## The four surfaces

| Surface | What it is | Where it lives | Public? | Owner |
|---|---|---|---|---|
| **Registry** | The data source for all templates: `manifest.json` files + screenshots | `deessejs/templates-registry` repo | Public | tech lead |
| **Gallery** | The web app pages where users discover, filter, compare templates | `apps/web/src/app/templates/*` | Public | web-tech-lead |
| **Deploy button** | The component that turns "I picked this template" into "I have a live app" via Vercel | `packages/ui/src/deploy-button.tsx` | n/a (component) | web-tech-lead |
| **Demo button** | The friction-free "see it in action" CTA — a link to the team's hosted live demo | `packages/ui/src/demo-button.tsx` | n/a (component) | web-tech-lead |

The boundaries:

- **Registry → Gallery**: the gallery reads the registry at build time (ISR). One-way dependency.
- **Gallery → Deploy + Demo buttons**: the gallery renders both buttons on each template page. The Deploy is the primary CTA; the Demo is the secondary "preview first" CTA.
- **Deploy button → Vercel**: the button generates a URL to `vercel.com/new/clone`, the user leaves our site. The Vercel Deploy Button does the rest (fork, build, deploy).
- **Demo button → external URL**: the button is a plain link to the team's hosted demo. No orchestrator. Just a URL the user opens.
- **Registry ↔ CLI**: the CLI also reads the registry (`gh:owner/repo` URLs and registered names). Same registry, different consumer.

## Personas (who each surface serves)

| Persona | Primary surface | What they do |
|---|---|---|
| **Dev in discovery** | Gallery + Demo button | Browse, filter, compare, "see demo first" before committing |
| **Dev in deployment** | Deploy button | One click → live app on Vercel |
| **Founder/PM DeesseJS** | Gallery + Registry | Curate, present on marketing site, ensure quality |
| **Template author (internal)** | Registry | Add a new template, update metadata, push screenshots, deploy a demo |
| **Agent (future)** | Registry (direct read) | Discover available templates, get metadata, run `deesse init` programmatically |
| **Template contributor (external, post-MVP)** | Registry (PR) | Propose new templates via GitHub PR |

The gallery is the **onboarding surface for humans**. The registry is the **onboarding surface for agents**. The demo button is the **peek before commit** option for the "not sure yet" majority. The deploy button is the **conversion event** for the committed users.

## What lands at MVP

Aligned with the CLI roadmap (`../12-apps/cli/roadmap.md`):

| Deliverable | Surface | MVP? |
|---|---|---|
| `deessejs/templates-registry` repo with 3 templates (minimal, starter, lite) | Registry | ✅ |
| Each MVP template ships with a `manifest.json.demo.url` pointing to a manually-deployed demo | Registry | ✅ (manual deploy for MVP) |
| `apps/web/src/app/templates/page.tsx` — gallery with filters | Gallery | ✅ |
| `apps/web/src/app/templates/[slug]/page.tsx` — individual template with hero CTA row | Gallery | ✅ |
| `<DeployButton>` component | Deploy button | ✅ (basic, no stores parameter) |
| `<DemoButton>` component — paired with `<DeployButton>` on the hero | Demo button | ✅ |
| OG images via `@vercel/og` | Gallery | ✅ |
| `/templates/sitemap.xml` and `/templates/feed.json` | Gallery | ✅ |
| Bilingual EN/FR | Gallery | M2 (EN only at MVP) |

The MVP scopes match the CLI's M7 (first npm release). The deploy button ships **without the `stores` parameter** at MVP — Cloud support is a Cloud-track concern, not a gallery-track concern.

**Demo hosting at MVP** is manual: an engineer deploys each template to a known Vercel project (`deessejs-demo-{slug}`), copies the URL into the template's `manifest.json.demo.url`, and pushes to `templates-registry`. The schema already supports the M0.2 automated case (`manifest.json.demo.lastDeployed`, `branch`, `provider`) so the migration is data-only, not structural.

## What's deferred past MVP

| Feature | When | Why deferred |
|---|---|---|
| Compare side-by-side (UC4) | M0.2 | Useful but not ship-blocking; needs UX iteration |
| Full-text search (UC5) | M0.2 | Filters cover the 90% case at MVP with 3 templates |
| Submit external template (UC7) | M3+ | Needs review process + CMS |
| Per-template changelog (UC8) | M3+ | GitHub Releases URL is enough at MVP |
| Usage stats (UC9) | M3+ | Only valuable once we have >10 templates deployed |
| "Copy CLI command" button | TBD | Bridge to the agent-first CLI; one-line addition once CLI is stable |
| Bilingual FR | M0.2 | Ship in EN first, validate UX, then translate |
| `stores` parameter on Deploy button | When Cloud has a Vercel Marketplace integration | The killer feature, but requires Cloud |

## Open questions (6, awaiting founder)

1. **Naming du registry repo**: `deessejs/templates-registry` vs. `deessejs/registry` vs. integrated in `apps/web`.
2. **OG images**: auto-générées par `@vercel/og` à chaque requête vs. pré-générées et stockées comme PNG.
3. **Search au MVP**: ship sans search (juste filtres) vs. avec Fuse.js dès le début.
4. **URL pattern des filtres**: `?useCase=saas,blog&framework=nextjs` (multi-value) vs. `?uc=saas-blog&fw=nextjs` (court, jolis).
5. **Sitemap**: global `/sitemap.xml` qui inclut tout vs. dédié `/templates/sitemap.xml` (soumission Google Search Console séparée).
6. **"Copy CLI command" button**: ship dès le MVP pour connecter gallery au CLI agent-first, ou attendre CLI stable.

See [`project-deessejs-templates-library-needs.md`](../../../../.claude/agent-memory/tech-lead/project-deessejs-templates-library-needs.md) for the full analysis (9 use cases, 3 tiers, 6 questions).

## Conventions specific to this area

- **One source of truth.** The registry repo is the only place where template metadata lives. The gallery reads from there. Don't duplicate metadata in `apps/web`.
- **No client JS unless necessary.** The gallery is server-rendered (RSC + ISR). Filters update via URL state. Search is the only client-side feature (Fuse.js at MVP, Algolia post-50 templates).
- **SEO is feature parity with marketing pages.** Sitemap, OG images, JSON-LD structured data, JSON Feed. The gallery is part of the public surface; it ranks like the rest of the marketing site.
- **The deploy button is THE conversion event.** Every page in the gallery has it. Tests assert it's above the fold. Analytics track clicks per template.
- **Bilingual is the principle, EN-only is the MVP constraint.** All copy lives in `messages/<locale>/templates.json` from day 1, even if only `en` is filled.

## Cross-references

### Sibling docs in this folder

- [`./templates-gallery.md`](./templates-gallery.md) — gallery routes, filters, ISR, SEO
- [`./deploy-button.md`](./deploy-button.md) — the `<DeployButton>` component
- [`./demo-button.md`](./demo-button.md) — the `<DemoButton>` component (the friction-free sibling)

### Other architecture docs

- [`../12-apps/cli/template-conventions.md`](../12-apps/cli/template-conventions.md) — the `manifest.json` schema, including the `demo` field (lives in CLI docs because it's the CLI's contract, but the registry uses it too)
- [`../12-apps/cli/README.md`](../12-apps/cli/README.md) — the init CLI; same registry, different consumer
- [`../12-apps/cli/architecture.md#agent-first-contract`](../12-apps/cli/architecture.md#agent-first-contract) — the agent-first principles that drive the registry's API shape
- [`./pages.md`](./pages.md) — current page inventory; the templates gallery routes will be added when implementation starts

### Product docs

- [`../../product/features/16-marketing.md`](../../product/features/16-marketing.md) — the marketing surface (the gallery is part of marketing)
- [`../../product/features/15-blog.md`](../../product/features/15-blog.md) — the blog; sister surface to the gallery, both grow `apps/web`

### Reference / research

- [`../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md`](../../../../.claude/agent-memory/tech-lead/reference-vercel-templates-system.md) — the Vercel Templates research that informed this design
- [`../../../../.claude/agent-memory/tech-lead/reference-agent-first-cli-principles.md`](../../../../.claude/agent-memory/tech-lead/reference-agent-first-cli-principles.md) — the agent-first thesis that drives the registry's API-first shape
