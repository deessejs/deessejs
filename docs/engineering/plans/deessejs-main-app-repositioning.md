---
title: "Reposition this repo as the DeesseJS main app (started from saas-template)"
author: martyy-code
generated: 2026-08-04
status: approved (categories A/B/C only; category D deferred per user decision 2026-08-04)
labels: [area:branding, area:docs, priority:high]
supersedes:
  - docs/engineering/plans/company-identity-surface.md (partial; see "Relationship to company-identity-surface.md")
related:
  - docs/engineering/plans/saas-template-divergence.md
  - docs/engineering/plans/robust-shared-backend.md
  - docs/engineering/plans/company-identity-surface.md
decisions:
  - id: repo-identity
    date: 2026-08-04
    choice: "Present this repo as the DeesseJS main app, NOT as the saas-template"
    rationale: "The repo IS the deessejs main app. The saas-template is the upstream project it was cloned from."
  - id: casing
    date: 2026-08-04
    choice: "Namespace lowercase 'deessejs' (npm packages, env vars, identifiers); product name Title Case 'DeesseJS' (headings, README, marketing)"
    rationale: "npm conventions + existing code already use lowercase; product name needs visual distinctiveness in prose and headings."
  - id: upstream-relationship
    date: 2026-08-04
    choice: "Wording: 'Started from [deessejs/saas-template](https://github.com/deessejs/saas-template)' with explicit link. NOT 'fork of', NOT 'based on'."
    rationale: "Fork = same project, parallel history. Clone = same starting point, now its own project. saas-template is upstream; this repo is no longer a fork of it (different orgs/products)."
  - id: github-repo-urls
    date: 2026-08-04
    choice: "This repo's GitHub address is https://github.com/deessejs/deessejs. Upstream to link is https://github.com/deessejs/saas-template. NEVER link this repo to deessejs/saas-template."
    rationale: "Confirmed with user 2026-08-04. Origin remote already points to deessejs/deessejs."
  - id: scope
    date: 2026-08-04
    choice: "Categories A (top-level), B (apps/packages identity surfaces), C (env defaults + CLI keyword), E (.claude memory skills rephrasing). Category D (internal docs under documents/internal/** and docs/engineering/**) DEFERRED per user decision 2026-08-04."
    rationale: "User explicitly said 'on touche pas aux docs internes pour le moment'. Categories A/B/C/E ship now; D is a separate later plan."
  - id: delivery
    date: 2026-08-04
    choice: "One plan, multiple commits on chore/deessejs-main-app-repositioning (branched from staging), one PR per category against staging."
    rationale: "Categories are independent, easier review, easier revert if needed. Per AGENTS.md staging-first workflow."
---

# DeesseJS main app, identity repositioning <!-- vale fix: Microsoft.Headings --> <!-- vale fix: Microsoft.HeadingColons -->

_Date: 2026-08-04. Status: draft, pending user review. This plan is analysis + a file-by-file change list. No code lands until the user approves._

## Context

This repo (package name: `next-monorepo`, GitHub: `deessejs/deessejs`) forked from `github.com/deessejs/saas-template` (MIT, July 2026) as the foundation for the deessejs organization's main app. Since the fork, intentional divergence has accumulated on top:

- `apps/cli/` workspace (published as `@deessejs/cli`)
- `packages/contracts/` shared contract package
- `docs/engineering/plans/**` strategy docs
- `AGENTS.md` customizations (staging-first workflow, internal-package policy)
- Refactor of the templates endpoint from `apps/web` into `packages/api`

Today, the repo is **still framed as "SaaS Template"** in 67 user-facing files (per cartography 2026-08-04): the root `README.md` calls itself "SaaS Template" in its H1; `apps/web/README.md` calls itself "the SaaS template"; the email footer reads "© SaaS Template"; and `.env.example` defaults to `NEXT_PUBLIC_APP_NAME=SaaS Template`.

This plan **repositions the repo as the DeesseJS main app** while keeping a clear link to the upstream `deessejs/saas-template` (MIT) that spawned it.

## Goals

- The repo's identity is **DeesseJS** (product name Title Case; namespace lowercase `deessejs`).
- The upstream relationship is **explicit and visible**: a "Started from [saas-template](github-url)" note in the root README, plus the existing `docs/engineering/plans/saas-template-divergence.md` plan, which describes the divergence.
- **Zero mention of "SaaS Template" as the project's identity** in user-facing files (categories A, B, C, E). Generic market term "SaaS template" (lowercase, plural, generic: "SaaS templates," "the SaaS template market") stays in marketing/positioning docs where it functions as a category descriptor, not the project's name. <!-- vale fix: Microsoft.Quotes --> <!-- vale fix: write-good.Passive -->
- **Coordinated with `company-identity-surface.md`** so the public `/about`, `/principles`, `/team` pages (when implemented) use the same `DeesseJS` name and the same data file (`apps/web/src/lib/site/identity.ts`).
- All changes land in commits on `chore/deessejs-main-app-repositioning` (branched from `staging`, per AGENTS.md), grouped by category. No direct push to `main`.

## Non-goals

- Renaming the GitHub repo (`deessejs/saas-template` → `deessejs/deessejs` or similar). That's a separate decision; this plan only edits in-repo content.
- Rewriting product positioning. Marketing terms like "agentic SaaS template," "the SaaS template that never sleeps," and "Apple of SaaS templates" stay where they appear (in `documents/internal/marketing/**`). They're **category descriptors**, not the project's identity.
- Refactoring the landing page (`apps/web/src/app/page.tsx`). `company-identity-surface.md` explicitly excludes it.
- Touching the diverged CLI (`apps/cli/**`) beyond a keyword in `apps/cli/package.json`.
- Touching `pnpm-lock.yaml`, `node_modules/`, `.git/`, or any build artifacts.

## Decisions locked

The four decisions that gated this plan are in the frontmatter `decisions:` log. The implications:

| # | Locked choice | Impact on the rest of the plan |
|---|---|---|
| 1 | Repo identity = DeesseJS main app | Every user-facing file that names the project as "SaaS Template" is rephrased. |
| 2 | Namespace lowercase `deessejs`; product Title Case `DeesseJS` | `deessejs` stays in code (npm, env vars, identifiers); `DeesseJS` is used in headings, prose, marketing. |
| 3 | "Started from [saas-template](github-url)" wording | The root README gets this exact phrasing + explicit link. No "fork of", no "based on". |
| 4 | One plan, multi-commit, one PR per category | Categories are listed below in the order to ship them. |
| 5 | Full user-facing scope | All 67 catalogued files are in scope (4 categories below). |

## Relationship to `company-identity-surface.md`

`docs/engineering/plans/company-identity-surface.md` (status: draft) adds three public-facing pages: `/about`, `/principles`, `/team`, with placeholder copy "deessejs". It already uses `deessejs` as the company name in the proposed `llms.txt` content.

This plan **supersedes the partial** by:

- **Locking** the wording "DeesseJS" (Title Case) as the public product name everywhere.
- **Adding a "Started from saas-template" line** to the root README, which `company-identity-surface.md` does not do.
- **Reframing `company-identity-surface.md`'s line 5** (`The next-monorepo (saas-template) hosts apps/web, the public site of deessejs.`) so it reads `The deessejs main app monorepo hosts apps/web, the public site of deessejs. Started from deessejs/saas-template.`

The two plans are not in conflict. `company-identity-surface.md` covers pages, this plan covers identity surface across the whole repo.

## Identity wording: reference table

| Context | Wording |
|---|---|
| Root README H1 | `DeesseJS` |
| Root README subtitle | `The main app of the deessejs organization. Next.js 16 · Better Auth · Drizzle · Tailwind v4 · Deploy in minutes.` |
| Root README upstream note | `> **Started from [deessejs/saas-template](https://github.com/deessejs/saas-template)** (MIT, July 2026). This repo was cloned from it as the foundation for the deessejs main app and has since diverged. See [docs/engineering/plans/saas-template-divergence.md](docs/engineering/plans/saas-template-divergence.md) for the divergence map.` |
| Product name in prose | `DeesseJS` |
| Namespace in code (npm, env vars) | `deessejs` |
| Default `NEXT_PUBLIC_APP_NAME` | `DeesseJS` |
| Default `RESEND_FROM_NAME` | `DeesseJS` |
| Email footer | `© {year} DeesseJS. All rights reserved.` |
| Marketing copy (internal docs) | Generic "SaaS template" (lowercase) stays as a category descriptor. "DeesseJS" replaces "SaaS Template" only where it's the project's own identity. |

## File-by-file change list

Cartography reference: `67 files` total, split into 4 change categories. Each category ships as one commit + one PR against `staging`.

### Category A: Top-level + root docs (3 commits, 1 PR)

Files: `README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json` (root).

**`README.md` (root):**
- H1: `SaaS Template` → `DeesseJS`.
- Subtitle: replace with `The main app of the deessejs organization.`.
- "What's included" table, line about apps: keep wording but remove any "SaaS Template" frame (the apps are listed as `apps/web (marketing)`, `apps/app (authenticated product)`, `apps/docs (Fumadocs)`, which is already fine).
- Add the **"Started from" upstream note** under the badges block, after the Quick start block, before "## What's included".
- **Keep** the sister-repo pointer to [`deessejs/saas-template-multi-tenant`](https://github.com/deessejs/saas-template-multi-tenant) (user decision 2026-08-04, relevant for single-tenant → multi-tenant upgrade path).
- "Quick start" `git clone` address: change `https://github.com/deessejs/saas-template.git` → `https://github.com/deessejs/deessejs.git` (or whatever the GitHub repo is renamed to, pending decision). <!-- vale fix: Microsoft.GeneralURL -->
- "Support" section: keep `support@deessejs.com` (already correct).
- License: MIT (already correct).

**`AGENTS.md`:**
- No direct mention of "SaaS Template" today, but the file does not say what the repo **is**. Add a short preamble after the `<!-- END:nextjs-agent-rules -->` block:
  > This repo is the **DeesseJS main app**. Started from [deessejs/saas-template](https://github.com/deessejs/saas-template) in July 2026. See [docs/engineering/plans/saas-template-divergence.md](docs/engineering/plans/saas-template-divergence.md) for the divergence map.

**`CLAUDE.md`:**
- Currently `@AGENTS.md`. No change needed; inherits from AGENTS.

**`package.json` (root):**
- `name: "next-monorepo"` → `name: "deessejs"` (internal name; not published).
- `description`: add `"description": "DeesseJS main app: the monorepo that powers the deessejs organization."`.

### Category B: apps + packages identity surfaces (2 commits, 1 PR)

Files: `apps/web/README.md`, `apps/docs/README.md`, `apps/web/content/posts/getting-started.mdx`, `apps/web/content/releases/0.1.0.mdx`, `packages/cookies/README.md`, `packages/email/src/templates/layout.tsx`, `.devcontainer/devcontainer.json`.

**`apps/web/README.md`:**
- Line 3: `Public marketing and landing page for the SaaS template.` → `Public marketing site for DeesseJS, the main app of the deessejs organization.`.
- Line 25 (example env): `NEXT_PUBLIC_APP_NAME="SaaS Template"` → `NEXT_PUBLIC_APP_NAME="DeesseJS"`.
- "Relationship to other apps" section: rephrase "this app" descriptions from "marketing, blog, changelog, legal pages" (no change needed in content; ensure framing is DeesseJS, not SaaS Template).

**`apps/docs/README.md`:**
- Line 3: `Documentation site for the SaaS Template, built with [Fumadocs]` → `Documentation site for DeesseJS, the main app of the deessejs organization. Built with [Fumadocs]`.

**`apps/web/content/posts/getting-started.mdx`:**
- Frontmatter `title` + `description`: replace "SaaS Template" with "DeesseJS."
- First paragraph: rephrase "Welcome to your new SaaS template." → "Welcome to DeesseJS, the main app of the deessejs organization.".

**`apps/web/content/releases/0.1.0.mdx`:**
- Frontmatter + first paragraph: replace "SaaS Template" with "DeesseJS."

**`packages/cookies/README.md`:**
- Line 3: `Cookie consent system for the SaaS template.` → `Cookie consent system for DeesseJS.`.

**`packages/email/src/templates/layout.tsx`:**
- Line 43 (heading): `SaaS Template` → `DeesseJS` (use the env var or a constant sourced from `NEXT_PUBLIC_APP_NAME`).
- Line 51 (footer): `© {new Date().getFullYear()} SaaS Template. All rights reserved.` → `© {new Date().getFullYear()} DeesseJS. All rights reserved.`.

**`.devcontainer/devcontainer.json`:**
- Line 2: `"name": "SaaS Template"` → `"name": "DeesseJS"`.

### Category C: Env defaults + CLI keyword (1 commit, 1 PR)

Files: `packages/env/src/schema.ts`, `packages/env/src/client.ts`, `.env.example`, `apps/cli/package.json`, `docs/guides/better-auth/email.md`.

**`packages/env/src/schema.ts`:**
- L54: `RESEND_FROM_NAME: z.string().min(1).default("SaaS Template")` → `.default("DeesseJS")`.
- L115: `NEXT_PUBLIC_APP_NAME: z.string().min(1).default("SaaS Template")` → `.default("DeesseJS")`.

**`packages/env/src/client.ts`:**
- L33: `NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "SaaS Template"` → `?? "DeesseJS"`.

**`.env.example`:**
- L41: `NEXT_PUBLIC_APP_NAME=SaaS Template` → `NEXT_PUBLIC_APP_NAME=DeesseJS`.
- L58: `RESEND_FROM_NAME="SaaS Template"` → `RESEND_FROM_NAME="DeesseJS"`.

**`apps/cli/package.json`:**
- L14: keyword `"saas-template"` → either remove (deessejs is already in keywords) or replace with `"deessejs-main-app"` for SEO.

**`docs/guides/better-auth/email.md`:**
- L178: example log line `[mailer] │ from:      SaaS Template <onboarding@resend.dev>` → `from:      DeesseJS <onboarding@resend.dev>`.

### Category D: Internal docs (positioning, architecture, design) (1 commit, 1 PR)

Files (28 total under `documents/internal/` and `docs/engineering/`). Strategy:

- **Rephrase where the doc positions DeesseJS as the project itself** (Title Case "SaaS Template" as a name → "DeesseJS").
- **Keep where it's a generic market term** ("SaaS template" lowercase, as a category of products).

**Rephrase (12 files):**

| File | Lines | Change |
|---|---|---|
| `DESIGN.md` | L11, L449 | "The Apple of SaaS templates" → "The Apple of SaaS templates" stays (it's the marketing wedge). But "The SaaS template that never sleeps" wedge reframes to "DeesseJS, the SaaS template that never sleeps." | <!-- vale fix: Microsoft.Quotes -->
| `documents/internal/product/README.md` | L19, L145, L154, L197, L198 | Where "SaaS Template" names the project, replace with "DeesseJS." |
| `documents/internal/product/positioning.md` | L7, L14, L16, L26, L99, L129, L132 | Same. |
| `documents/internal/product/pricing.md` | L21 | Same. |
| `documents/internal/product/lead-magnets.md` | L3, L72, L73, L74, L97, L115, L129, L136, L138, L179, L188, L198 | Same. |
| `documents/internal/product/unmet-needs-2026-06.md` | L5 | Same. |
| `documents/internal/product/deessejs-app-feasibility-2026-06.md` | L3, L7, L25, L13 | Same. |
| `documents/internal/product/app/tech-2026-06.md` | L237 | Same. |
| `documents/internal/marketing/landing/landing-page.md` | L16, L31, L142, L245, L263, L311, L502, L569, L730, L733 | Same. |
| `documents/internal/design/landing-page-structure.md` | L5, L13, L21 | Same. |
| `documents/internal/documentation/outline.md` | L32 | Same. |
| `documents/internal/marketing/launch/seo-content-strategy.md` | L17, L32, L96, L100, L108, L109, L113, L126-129, L140, L241, L243, L249 | Same. |
| `documents/internal/marketing/launch/vs-next-forge-comparison.md` | L37, L39, L41 | Same. |
| `documents/internal/marketing/launch/distribution-playbook.md` | L47, L127-129, L228, L374 | Same. |
| `documents/internal/marketing/launch/product-hunt-launch.md` | L37, L129 | Same. |
| `documents/internal/marketing/launch/npx-skills-parity-spec.md` | L80, L89, L110, L130, L374 | Same. |
| `documents/internal/architecture/05-modular-contract/README.md` | L5 | Same. |
| `documents/internal/architecture/03-web-app/templates-library.md` | L3 | Same. |
| `documents/internal/architecture/12-apps/cli/README.md` | L18 | Same. |
| `documents/internal/architecture/12-apps/cli/research.md` | L155 | Same. |
| `documents/internal/architecture/12-apps/cli/decisions/0003-cli-stack.md` | L75 | Same. |
| `documents/internal/architecture/11-packages/database/decisions/0001-application-layer-isolation-vs-rls.md` | L11 | "DeesseJS is a multi-tenant SaaS template" → "DeesseJS is a multi-tenant SaaS template" stays (it's the category descriptor), but if the line is naming DeesseJS as the project itself, replace "SaaS template" with "SaaS application" or "product." | <!-- vale fix: Microsoft.Quotes -->

**Keep unchanged (generic market term; 8 files):**

| File | Lines | Reason |
|---|---|---|
| `documents/internal/product/competitive-teardowns.md` | L11, L25 | Market analysis, generic term. |
| `documents/internal/product/app/B3-secret-lifecycle.md` | L98 | Industry default reference. |
| `documents/internal/marketing/landing/offer-design-research.md` | L7, L9, L288, L402 | Pricing research, generic term. |
| `documents/internal/marketing/social/social-media-strategy.md` | L64, L92, L116 | Generic SEO term. |
| `documents/internal/marketing/research/competitive-analysis.md` | L170 | SEO search term. |
| `documents/internal/architecture/01-stack/nextjs.md` | L35, L43 | Ecosystem reference. |
| `documents/internal/architecture/01-stack/i18n.md` | L37 | Buyer perception. |
| `documents/internal/architecture/01-stack/tanstack-tables.md` | L40 | Overkill category. |
| `documents/internal/architecture/01-stack/upstash-redis-realtime.md` | L50 | Pricing model fit. |
| `documents/internal/architecture/11-packages/database/decisions/0002-drizzle-v1-rc.md` | L86 | Niche reference. |

**`docs/engineering/plans/saas-template-divergence.md`:** keep as is; it's the divergence map, explicitly about the upstream relationship.

**`docs/engineering/plans/company-identity-surface.md`:** L5: rephrase to `The deessejs main app monorepo hosts apps/web, the public site of deessejs. Started from deessejs/saas-template.`.

**`docs/engineering/plans/robust-shared-backend.md`:** L277: keep (it's a related-doc link).

**`docs/engineering/reports/versioning/05-strategy.md`, `06-implementation-specs.md`, `07-decisions.md`, `09-risks-and-sources.md`:** keep historical context (these are reports), but rephrase where "saas-template" is used as the project's identity vs the upstream. The agent's cartography flagged L12 of `09-risks-and-sources.md` and L32 of `07-decisions.md` as "keep with link"; they reference the upstream `deessejs/saas-template` as a fact, not as identity. Leave them.

### Category E: `.claude/` memory and skills (1 commit, 1 PR)

Files (12 total). Strategy:

**Rephrase (4 files):**

| File | Lines | Change |
|---|---|---|
| `.claude/agent-memory/tech-lead/apps/app.md` | L79 | `NEXT_PUBLIC_APP_NAME ?? "SaaS Template"` → `?? "DeesseJS"`. |
| `.claude/agent-memory/tech-lead/project/package-structure.md` | L8 | "The saas-template monorepo enforces…" → "The deessejs monorepo enforces…" |
| `.claude/agent-memory/tech-lead/project/deploy.md` | L16, L17, L18 | Rename Vercel project names `saas-template-web/app/docs` → `deessejs-web/app/docs`. **Action item**: this also requires renaming the actual Vercel projects via the Vercel dashboard, separate ops task, not in this plan. |
| `.claude/agent-memory/tech-lead/project/apps-cli-publish-readiness.md` | L12 | "Recommended: MIT (matches upstream saas-template)." → "Recommended: MIT." (the upstream relationship is obvious from the AGENTS preamble). |

**Keep unchanged (8 files):**

| File | Lines | Reason |
|---|---|---|
| `.claude/agent-memory/tech-lead/project/template-strategy.md` | L8 | Strategic memo about the upstream; keep the upstream reference. |
| `.claude/agent-memory/tech-lead/feedback-readme-layout-2026.md` | L3, L8, L22 | Historical feedback with a commit reference; keep. |
| `.claude/skills/create-issue/SKILL.md` | L3, L33, L37 | Skill targets the GitHub repo `deessejs/saas-template`; keep the address, update label if needed. |
| `.claude/skills/create-pr/SKILL.md` | L38, L41, L42, L67, L109 | Same. |
| `.claude/skills/implement/SKILL.md` | L62, L63, L81, … | Same. |
| `.claude/skills/review-pr/SKILL.md` | L42, L45, … | Same. |
| `.claude/skills/spec/SKILL.md` | L35 | Same. |
| `.claude/skills/triage/SKILL.md` | L203 | Same. |

## Special cases

### GitHub repo address

The root README's `git clone` address currently is `https://github.com/deessejs/saas-template.git`. If the GitHub repo gets a new name (e.g. `deessejs/deessejs`), update the address here and in all `.claude/skills/**` files.

**If the GitHub repo isn't renamed** (stays as `deessejs/saas-template`): the "Started from" line is still valid. `deessejs/saas-template` is the upstream that this repo originated from, and the same path now points here. <!-- vale fix: Microsoft.Contractions --> <!-- vale fix: write-good.Passive -->

This is the **only open question** that gates the implementation. See "Open questions" below.

### `packages/api/src/templates.ts` and `packages/contracts/tests/template.test.ts`

The slug `repo: "saas-template"` in the templates registry is **technical data**, not the project's identity. It refers to the upstream `deessejs/saas-template` GitHub repo that the CLI clones when a user picks the `saas-starter` template entry. **Keep as is** unless the GitHub repo gets a new name (in which case update the slug to match).

## Out of scope (deferred)

- Renaming the GitHub repo `deessejs/saas-template` → something else. Separate decision, requires repo settings change.
- Renaming the Vercel projects (separate ops task).
- Touching `pnpm-lock.yaml`, `node_modules/`, `.git/`, build artifacts.
- The `/about`, `/principles`, `/team` pages themselves; `company-identity-surface.md` covers those.
- Refactoring the landing page `apps/web/src/app/page.tsx`.

## Open questions

_None. The previous open question (GitHub repo address) closed with the user on 2026-08-04: this repo is `deessejs/deessejs`, the upstream to link is `deessejs/saas-template`._

## Risks and trade-offs

- **29 files in Category D** is the largest single commit. If anyone challenges the wording, the diff will be hard to review. Mitigation: ship per-file with detailed commit messages citing this plan.
- **Email footer / env defaults** change is customer-visible the moment it merges (anyone receiving an email after deploy will see "DeesseJS" instead of "SaaS Template"). Mitigation: ship Category C in the same deploy window as a notification.
- **The default `NEXT_PUBLIC_APP_NAME` change** ripples into any deployed env that didn't override the value. Mitigation: `pnpm env:check` after merge; audit Vercel env vars per project.
- **The `keywords` removal in `apps/cli/package.json`** (`saas-template` keyword) may reduce npm search visibility. Mitigation: replaced by `deessejs-main-app` keyword.

## Endpoints / artifacts to verify (post-implementation)

```bash
# 1. README renders
pnpm --filter web dev   # check root layout + landing renders "DeesseJS"

# 2. Env defaults
pnpm env:check

# 3. Lint + typecheck
pnpm lint
pnpm typecheck

# 4. Grep check: no orphan "SaaS Template" as project name
rg -i 'SaaS Template' --glob '!node_modules' --glob '!pnpm-lock.yaml' --glob '!.git' --glob '!.claude/worktrees'
# Expected: 0 hits in user-facing files, only in:
#   - docs/engineering/plans/saas-template-divergence.md (intentional)
#   - documents/internal/** where "SaaS template" is a market category descriptor
#   - .claude/skills/** where it's a GitHub URL

# 5. CLI build
pnpm --filter @deessejs/cli build

# 6. Smoke-test: root homepage H1
curl -s http://localhost:3000 | grep -E '<h1|DeesseJS'
```

## Critical files (final list)

- `C:\Users\dpereira\Documents\github\ecosystem\d\README.md`: root identity
- `C:\Users\dpereira\Documents\github\ecosystem\d\AGENTS.md`: repo identity preamble
- `C:\Users\dpereira\Documents\github\ecosystem\d\package.json`: name + description
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\web\README.md`: apps/web identity
- `C:\Users\dpereira\Documents\github\ecosystem\d\apps\docs\README.md`: apps/docs identity
- `C:\Users\dpereira\Documents\github\ecosystem\d\packages\email\src\templates\layout.tsx`: customer-visible email footer
- `C:\Users\dpereira\Documents\github\ecosystem\d\packages\env\src\schema.ts`: env defaults (customer-visible)
- `C:\Users\dpereira\Documents\github\ecosystem\d\.env.example`: env defaults reference
- `C:\Users\dpereira\Documents\github\ecosystem\d\.claude\agent-memory\tech-lead\project\deploy.md`: Vercel project names (separate ops task)
- `C:\Users\dpereira\Documents\github\ecosystem\d\docs\engineering\plans\company-identity-surface.md`: coord with public pages plan
- `C:\Users\dpereira\Documents\github\ecosystem\d\docs\engineering\plans\saas-template-divergence.md`: divergence map, kept as the single upstream reference doc