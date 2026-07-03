---
name: reference-vercel-templates-system
description: Vercel Templates 3-surface architecture (repo / gallery / deploy orchestrator); research 2026-07-02 from vercel.com/templates, vercel/examples, @vercel/examples-ui, deploy button docs
metadata:
  type: reference
---

Researched 2026-07-02 via `fresh` CLI for the DeesseJS template gallery question.

## The 3-surface architecture (load-bearing)

Vercel Templates is NOT one product. It's three decoupled products:

| Surface | What | Where | Why decoupled |
|---|---|---|---|
| Repo source | Real Next.js projects users clone | `github.com/vercel/examples` (mega-repo, 5K+ stars) | The templates exist independently of the gallery |
| Gallery web | Discovery UX (filters, cards, individual pages) | `vercel.com/templates/*` (Next.js on Vercel) | UI can be redesigned without touching templates |
| Deploy orchestrator | The "clone → fork → provision → deploy" flow | `vercel.com/new/clone?repository-url=...` | A click can fan out to many services |

**Implication for DeesseJS**: same 3 surfaces, mapped to our world:
- `deessejs/template-minimal`, `deessejs/template-starter`, ... (repos)
- `deessejs.com/templates/*` (gallery in `apps/web`)
- Buttons that generate `vercel.com/new/clone?repository-url=...` URLs

## Critical insight: the `stores` URL parameter

```json
[{ "type": "blob", "access": "private", "envVarPrefix": "MYBLOG" }]
```

A template declares its service dependencies (Blob, Postgres, Marketplace integrations) as JSON in the URL. Vercel provisions them automatically during the deploy flow. No "go to Stripe Dashboard, create account, copy API key" — everything happens in the wizard.

**This is the killer feature**. For DeesseJS Cloud, the equivalent is a Vercel Marketplace integration so templates can declare `{ "type": "integration", "integrationSlug": "deessejs", "productSlug": "postgres" }` and have Cloud provision the DB.

## URL pattern (3 levels)

```
vercel.com/templates
vercel.com/templates/next.js
vercel.com/templates/next.js/monorepo-turborepo
```

Maps directly to `deessejs.com/templates`, `deessejs.com/templates/next.js`, `deessejs.com/templates/{slug}`.

## @vercel/examples-ui — the design system for templates

Internal npm package that ships:
- React components (Layout, Button, Link, Text, Code, Snippet, DeployButton, Input)
- Tailwind preset (`@vercel/examples-ui/tailwind`)
- Global CSS (`@vercel/examples-ui/globals.css`)

Built with SWC. Compatible with both App Router and Pages Router. Result: every template has consistent visual identity without effort.

For DeesseJS: equivalent would be `@deessejs/template-ui` — internal package providing Tailwind preset + base components. Templates using it get the DeesseJS look for free; those not using it diverge (modular contract friendly).

## Front-matter YAML convention

```md
---
name: Bot Protection with DataDome
slug: bot-protection-datadome
framework: Next.js
useCase: Edge Middleware
relatedTemplates: [...]
---
```

Lives at top of the template's README. Parsed by CI, creates a Draft in Contentful CMS, then published by a Vercel team member.

**DeesseJS divergence**: we have `manifest.json` (separate file), which is better for machine parsing (the agent-first CLI needs it). But for the gallery web, we need to consume that metadata. Options:
- (a) `deessejs/templates-registry` repo with just the metadata + screenshots
- (b) `apps/web` reads each template's `manifest.json` via GitHub API
- (c) Light CMS (Sanity/Payload) for editorial review

My instinct: (a) for MVP, (c) post-MVP when we open to external contributors.

## What NOT to copy

- Mega-repo pattern (we have 1 repo per template by design)
- Plop-based internal scaffolder (we have 3 templates, not 200; over-engineering at MVP)
- Pages Router compatibility in the UI lib (all DeesseJS templates are App Router)

## Sources

- `https://github.com/vercel/examples` — the mega-repo
- `https://github.com/vercel/examples/blob/main/README.md` — contribution guide
- `https://github.com/vercel/examples/tree/main/internal/packages/ui` — `@vercel/examples-ui`
- `https://deepwiki.com/vercel/examples/1.2-template-management-system` — template management system
- `https://deepwiki.com/vercel/examples/1.3-ui-components-library` — UI components library
- `https://vercel.com/docs/deploy-button` — Deploy Button docs
- `https://vercel.com/docs/deploy-button/source` — query params
- `https://vercel.com/templates` — gallery homepage (filter structure observed)
- `https://techstackdetector.com/site/vercel.com/` — stack detection (Next.js + Vercel confirmed)

## Open question to follow up

Does the `stores` parameter + Vercel Marketplace integration fit the DeesseJS Cloud vision? If yes, deep-dive needed on Vercel Marketplace API and how DeesseJS Cloud exposes itself as an integration.