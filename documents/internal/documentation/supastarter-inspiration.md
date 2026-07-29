# Supastarter Documentation — Deep Research & DeesseJS Inspiration

> **Research date:** 2026-06-25
> **Sources:** supastarter.dev/docs/nextjs (14 pages fetched via fresh/Exa.ai)
> **Purpose:** Extract actionable patterns from supastarter's documentation to improve the DeesseJS outline.

---

## 1. What supastarter ships as documentation

### Their 18 top-level doc pages

| # | Page | URL slug | Type |
|---|---|---|---|
| 1 | Introduction | `/docs/nextjs` | Concept + marketing |
| 2 | Setup | `/docs/nextjs/setup` | Tutorial |
| 3 | Project structure | `/docs/nextjs/codebase/structure` | Reference |
| 4 | Configuration | `/docs/nextjs/configuration` | Reference |
| 5 | Database | `/docs/nextjs/database/overview` + sub-pages | Reference + How-to |
| 6 | API | `/docs/nextjs/api/overview` + sub-pages | Reference |
| 7 | Authentication | `/docs/nextjs/authentication/overview` + sub-pages | Reference + How-to |
| 8 | Payments | `/docs/nextjs/payments/overview` + sub-pages | How-to |
| 9 | Storage | `/docs/nextjs/storage/overview` + sub-pages | Reference |
| 10 | AI | `/docs/nextjs/ai/overview` + sub-pages | How-to |
| 11 | Background tasks | `/docs/nextjs/tasks/overview` | Reference |
| 12 | Internationalization | `/docs/nextjs/internationalization` | How-to |
| 13 | Blog | `/docs/nextjs/blog` | How-to |
| 14 | Documentation site | `/docs/nextjs/documentation` | How-to |
| 15 | SEO | `/docs/nextjs/seo/meta-tags` + `/sitemap` | Reference |
| 16 | Deployment | `/docs/nextjs/deployment/overview` + 7 provider sub-pages | How-to |
| 17 | Going to production | `/docs/nextjs/launch` | Checklist |
| 18 | Customization | `/docs/nextjs/customization/onboarding` | How-to |

**Their unique additions vs. our outline:** `Going to production` (checklist), `Customization`, `Project structure`.

---

## 2. Structural patterns worth borrowing

### 2.1 — "Going to production" as a standalone page

Supastarter has a dedicated **launch checklist page** (`/docs/nextjs/launch`) that walks through:
- App architecture review (which app owns what)
- Mail templates + domain verification
- i18n completeness check
- Payment products + webhooks in production mode
- SEO meta tags + sitemap
- Legal pages (privacy policy, ToS, imprint)
- Environment variables review
- Region selection (proximity to DB + audience)

**Why it works:** Buyers don't read docs sequentially — they read them at the moment of need. A "launch" page is the most-visited page in any boilerplate docs. It's a conversion moment.

**Recommendation for DeesseJS:** Convert `deployment/index.mdx` into two pages:
1. **`deployment/index.mdx`** — technical deployment (Vercel, self-hosting, Docker, CI/CD)
2. **`launch/index.mdx`** — the buyer-facing checklist (mail, payments, SEO, legal, env vars, region)

This mirrors supastarter and matches what we already have in our onboarding doc.

### 2.2 — "Project structure" as a page

Supastarter has a dedicated **`codebase/structure`** page showing:
- The monorepo tree (`apps/marketing`, `apps/saas`, `packages/ai`, `packages/api`, etc.)
- Next.js app boundaries (each app has its own `package.json`, `tsconfig`, layouts)
- Configuration scoping (each app has its own `config.ts`)
- Path aliases per app (`@config`, `@auth/*`, `@organizations/*`, etc.)

**Why it works:** Buyers need to understand *where to put things* before they can customize. This page answers "where do I add a new page?" and "which config do I edit?"

**Recommendation for DeesseJS:** Add a **`codebase-structure/index.mdx`** page under the Introduction section. Show:
- The `apps/template/` tree (apps/web, apps/cli, apps/docs, packages/*)
- App boundaries (which app owns what — matches the 12-apps ADR)
- Configuration scoping (`config.ts` per surface, not global)
- Path aliases (`@/*`, future `@auth/*`, `@db/*`)

This is currently spread across ADR-0012 and the product README. Unifying it into one doc makes onboarding faster.

### 2.3 — Configuration scoped by surface, not global

Supastarter's configuration is split by surface:
- `apps/marketing/config.ts` — appName, docsLink, enabledThemes, defaultTheme
- `apps/saas/config.ts` — appName, saasUrl, redirectAfterSignIn, redirectAfterLogout
- `packages/payments/config.ts` — billingAttachedTo, plans with priceId
- `packages/storage/config.ts` — bucketNames

**Why it works:** Buyers can change exactly what they need without understanding the whole system. The `config.ts` file is the entry point for every surface.

**Recommendation for DeesseJS:** Our outline already has `configuration/index.mdx`. We should structure it like supastarter:
- **App-level config** (`apps/web/config.ts`) — appName, baseUrl, redirectAfterSignIn
- **Package-level config** (`packages/auth/config.ts`, `packages/payments/config.ts`, etc.)
- Show code examples of each `config.ts` file
- Show the `NEXT_PUBLIC_*` split (client vs. server vars)

This is a structural improvement to our existing configuration page, not a new page.

---

## 3. Content patterns worth borrowing

### 3.1 — Every "overview" page follows the same skeleton

Supastarter's overview pages all follow this pattern:
1. **One-sentence definition** of the feature
2. **"Why [technology]"** — why this library/approach was chosen over alternatives
3. **How to configure it** — the `config.ts` or key env vars
4. **Sub-pages links** — "Learn more about X, Y, Z"
5. **FAQ** — the 3-4 questions buyers actually ask

**Example (API overview):**
> "Hono is a modern and minimalistic web framework... It is also capable of generating an OpenAPI documentation automatically for your API."
> "Why combine Hono and oRPC: Hono's RPC client is not as powerful as oRPC."
> "Learn more: Define an API endpoint / Protect API endpoints / Use API in frontend."

**Recommendation for DeesseJS:** Apply this skeleton to our 18 pages:
- Every page starts with a **definition sentence** (what is this feature)
- Every technology choice has a **"Why X and not Y?"** paragraph
- Every page ends with **links to sub-pages** and a **FAQ section**

The FAQ at the bottom of each page is particularly valuable — these are the questions buyers ask on GitHub, Discord, and in support. Pre-empting them reduces support load.

### 3.2 — Provider-agnostic abstraction shown early

Supastarter shows the abstraction layer immediately:

```ts
// Change the provider in one line:
export * from "./plunk";
// or
export * from './resend';
// or
export * from './postmark';
```

Same for payments:
```ts
export * from "./stripe";
// or
export * from './lemonsqueezy';
// or
export * from './creem';
```

Same for storage: AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, Supabase Storage — all behind the same interface.

**Why it works:** Buyers immediately see the "escape hatch" — if they don't like the default, they can swap it. This removes the fear of lock-in.

**Recommendation for DeesseJS:** In our `mailing/index.mdx` and `storage/index.mdx`, show the provider switch pattern on page 1 (before any detail):
```ts
// packages/mail/provider/index.ts
export * from "./resend";  // ← current default
// export * from "./postmark";  // ← swap here
```

This is a **content** improvement, not a structural one. It should be added to our existing outline pages.

### 3.3 — The "local development" page

Supastarter has a dedicated **`local-development`** guide covering:
- What each app starts (`pnpm dev` starts multiple surfaces)
- How to run them separately (`pnpm --filter @repo/saas dev`)
- How to use Docker for offline development
- How to seed the database
- How to create the first admin user via CLI (`pnpm --filter scripts create:user`)

**Recommendation for DeesseJS:** Add a **`local-development/index.mdx`** page between Quick Start and Configuration. Currently, the Quick Start ends at `pnpm dev` — there's no guide for "how to run each app separately" or "how to create the first admin."

### 3.4 — Database dual-ORM pattern

Supastarter explicitly documents the **Prisma vs. Drizzle switch**:
- Schema lives in `packages/database/prisma/` AND `packages/database/drizzle/`
- Switching = change one export in `packages/database/index.ts`
- Auth adapter updated in `packages/auth/auth.ts`
- Provider-specific schema exports (`postgres` vs `mysql` vs `sqlite`)

**Relevance to DeesseJS:** We chose Drizzle only. This is a competitive disadvantage on paper (supastarter wins "flexibility"). Our angle is: "We chose Drizzle because it's lighter, generates SQL you can read, and ships faster." This should be in our `database/index.mdx` as a "Why Drizzle and not Prisma?" section.

### 3.5 — Multi-provider payment shown as a feature

Supastarter explicitly lists 5 payment providers: Stripe, Lemon Squeezy, Creem, Polar, Dodo Payments. We chose Stripe only.

**Strategic observation:** supastarter's "5 providers" is a feature *on paper* but creates support surface. We should not copy this — our strength is polish, not breadth. But we should document **why Stripe** (native Connect Standard, no platform risk, webhook reliability) in our `payments/index.mdx`.

---

## 4. What supastarter does better than our outline

### 4.1 — FAQ at the bottom of every page

Every supastarter page ends with a FAQ section. Questions like:
- "Which database provider should I choose?" → answered in database overview
- "Can I use one-time payments?" → answered in payments overview
- "Can I self-host supastarter?" → answered in deployment overview

**Recommendation:** Add a **"Frequently asked questions"** section to every page in our outline. The FAQ content comes from:
1. GitHub issues on supastarter / ShipFast / Makerkit
2. Our own Discord support threads
3. The unmet-needs research doc (buyers explicitly call out missing answers)

### 4.2 — "Add a new X" how-to guides

Supastarter has a dedicated **`customization/onboarding`** page showing how to add a step to the onboarding wizard (with full code example).

**Recommendation for DeesseJS:** Add similar "how to add a new X" pages:
- **`customize/onboarding-steps.mdx`** — how to add a step to the onboarding wizard
- **`customize/new-database-table.mdx`** — how to add a new Drizzle table with org isolation
- **`customize/new-api-endpoint.mdx`** — how to add a new oRPC procedure + Hono route

These are currently scattered. A dedicated "Customization" section (or sub-section under Introduction) makes the modular contract tangible.

### 4.3 — Legal pages documented as part of launch

Supastarter's launch checklist explicitly mentions: "Common legal pages: privacy policy, terms of service, cookie policy, imprint."

We mention blog + docs but skip legal pages in our outline.

**Recommendation:** Add legal pages to our outline:
- **`legal/index.mdx`** under the Documentation section, OR
- A section in the `launch/index.mdx` checklist

---

## 5. What we do better than supastarter

This research isn't just about copying — it's also about identifying our **competitive moats in docs**:

### 5.1 — The "Deleting features" flagship doc

Supastarter does NOT have a dedicated "delete this feature" guide. We do (mentioned in our outline under Configuration and Documentation). This is our #1 competitive doc — it proves the modular contract that competitors only claim.

**Action:** Promote "Deleting features" to be one of the first things mentioned in Introduction. Make it a linked card on the homepage of the docs.

### 5.2 — RBAC depth

Supastarter's auth page mentions "role-based permissions and access control" but doesn't go deep. Our `organizations/index.mdx` covers 4 roles, impersonation, audit log — supastarter's docs don't mention these.

**Action:** Lean into this in the auth docs. Include a permissions matrix table (what each role can do).

### 5.3 — AI primitives as first-class (not just a chatbot)

Supastarter's AI page is essentially a chatbot integration guide. We document: Vercel AI SDK, structured output, streaming, agent loops, per-tenant cost tracking, and token budgets. That's meaningfully deeper.

**Action:** Our `ai/index.mdx` should highlight this depth. Supastarter wins on breadth (OpenAI, Anthropic, Hugging Face named); we win on depth (per-tenant metering).

### 5.4 — Self-hosting documentation

Supastarter's deployment section lists 7 providers. Our deployment page should too — but our competitive angle is the **self-hosting story** (the buyer who doesn't want Vercel). Document Docker, Railway, Fly.io with the same care supastarter does.

---

## 6. Revised DeesseJS doc outline (incorporating supastarter learnings)

### Structural additions

| New page | Rationale | Source |
|---|---|---|
| **`launch/index.mdx`** | Standalone launch checklist | supastarter `/launch` |
| **`codebase-structure/index.mdx`** | Monorepo layout + app boundaries | supastarter `/codebase/structure` |
| **`local-development/index.mdx`** | Running dev servers separately, first admin | supastarter `/local-development` |
| **`legal/index.mdx`** | Privacy policy, ToS, cookie policy, imprint | supastarter launch checklist |
| **`customize/index.mdx`** (section) | "Add a new X" how-tos | supastarter `/customization/*` |

### Structural improvements to existing pages

| Page | Improvement | Source |
|---|---|---|
| `configuration/index.mdx` | Surface-level config.ts files shown, not just env vars | supastarter `/configuration` |
| `database/index.mdx` | Add "Why Drizzle and not Prisma?" section | supastarter dual-ORM |
| `mailing/index.mdx` | Show provider switch on page 1 | supastarter `/setup` |
| `payments/index.mdx` | Add "Why Stripe" section | supastarter multi-provider |
| `ai/index.mdx` | Highlight per-tenant metering as unique depth | supastarter shallow AI docs |
| *All 18 pages* | Add FAQ section to every page | supastarter every page |
| `organizations/index.mdx` | Add RBAC permissions matrix table | supastarter shallow RBAC |

### Content additions to existing pages

| Page | Content addition | Source |
|---|---|---|
| `introduction/index.mdx` | Link to "Deleting features" as flagship doc | Our moat |
| `quick-start/index.mdx` | Admin user creation (`pnpm --filter scripts create:user` equivalent) | supastarter setup |
| `deployment/index.mdx` | 7 hosting providers with setup guides | supastarter `/deployment/*` |

---

## 7. DeesseJS vs. supastarter — competitive positioning in docs

| Dimension | Supastarter | DeesseJS | Who wins |
|---|---|---|---|
| Doc volume | ~30 pages | ~22 pages (current outline) | supastarter |
| Launch checklist | Dedicated `/launch` page | Not yet (should add) | supastarter |
| Deleting features | Not documented | Dedicated doc (moat) | **DeesseJS** |
| RBAC depth | 2 roles, shallow | 4 roles + impersonation + audit log | **DeesseJS** |
| AI primitives | Chatbot only | Streaming, agents, metering | **DeesseJS** |
| Payment providers | 5 providers | Stripe only (polished) | Tie (our depth > their breadth) |
| FAQ coverage | Every page | 0 FAQ sections (current outline) | supastarter |
| Code examples | Full snippets | Outline-level (needs detail) | supastarter |
| Self-hosting | 7 providers documented | Needs coverage | supastarter |
| i18n | 4 locales | English only in v1 | supastarter |

**Bottom line:** Our content depth is stronger where it matters (RBAC, AI primitives, modular contract). We need to close the gap on launch checklist, FAQ, and code examples.

---

## 8. Implementation priority

Given our v1 timeline, here's the order I'd recommend building these pages:

| Priority | Page | Why |
|---|---|---|
| **P0** | `launch/index.mdx` | Most-visited page at launch; low effort (compile from existing docs) |
| **P0** | FAQ on all 18 pages | High impact, low effort; comes from unmet-needs research |
| **P1** | `codebase-structure/index.mdx` | Buyers need this before customizing; replaces scattered ADR content |
| **P1** | `local-development/index.mdx` | Completes Quick Start; supastarter has this, we don't |
| **P2** | `customize/index.mdx` section | Makes modular contract tangible |
| **P2** | Legal pages in launch checklist | Real buyers need this before going live |
| **P3** | "Why Drizzle not Prisma" in database | Competitive angle, written once |
| **P3** | 7 hosting providers in deployment | Copy from supastarter when we have the infra decisions |

---

## 9. Sources

Fetched via `fresh` (Exa.ai CLI):

- `https://supastarter.dev/docs/nextjs` — Introduction + feature overview
- `https://supastarter.dev/docs/nextjs/setup` — Setup guide
- `https://supastarter.dev/docs/nextjs/codebase/structure` — Project structure
- `https://supastarter.dev/docs/nextjs/configuration` — Configuration reference
- `https://supastarter.dev/docs/nextjs/database/overview` — Database overview
- `https://supastarter.dev/docs/nextjs/api/overview` — API overview
- `https://supastarter.dev/docs/nextjs/authentication/overview` — Auth overview
- `https://supastarter.dev/docs/nextjs/payments/overview` — Payments overview
- `https://supastarter.dev/docs/nextjs/storage/overview` — Storage overview
- `https://supastarter.dev/docs/nextjs/ai/overview` — AI overview
- `https://supastarter.dev/docs/nextjs/tasks/overview` — Background tasks overview
- `https://supastarter.dev/docs/nextjs/internationalization` — i18n
- `https://supastarter.dev/docs/nextjs/blog` — Blog guide
- `https://supastarter.dev/docs/nextjs/documentation` — Docs site guide
- `https://supastarter.dev/docs/nextjs/seo/meta-tags` — Meta tags + SEO
- `https://supastarter.dev/docs/nextjs/deployment/overview` — Deployment overview
- `https://supastarter.dev/docs/nextjs/launch` — Going to production checklist
- `https://supastarter.dev/docs/nextjs/customization/onboarding` — Onboarding customization
