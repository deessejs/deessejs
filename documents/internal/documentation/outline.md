# DeesseJS — Documentation Outline

> **Purpose.** Define the complete documentation structure for `apps/docs/content/docs/(template)/`. Every page ships with the template; the buyer customizes this for their own product. The outline below is the canonical list of what must exist before v1 launch.
>
> **Audience for this doc.** Head of Product + Tech Lead. Decisions here bind `apps/docs/`, `apps/template/apps/docs/`, and all `12-packages/*` docs.
>
> **Status.** Draft v2 — updated 2026-06-25 with supastarter research. Added 5 pages, expanded API to 11 subpages, Database to 6 subpages.

---

## Pages added from supastarter research

| Page | File | Why |
|---|---|---|
| `launch` | `launch/index.mdx` | Most-visited page at launch; checklist format |
| `codebase-structure` | `codebase-structure/index.mdx` | Buyers need to know where to put things |
| `local-development` | `local-development/index.mdx` | Completes Quick Start; run apps separately, first admin |
| `customize` | `customize/index.mdx` + subpages | "Add a new X" how-tos make modular contract tangible |
| `legal` | `legal/index.mdx` | Privacy policy, ToS, cookie policy — missed in v1 |

---

## 1. Introduction

**File:** `introduction/index.mdx`
**Meta:** `title: "Introduction"`
**Type:** Concept
**Supastarter equivalent:** `/docs/nextjs`

### Content

- **What is DeesseJS.** One sentence: "The Apple of SaaS templates." Link to the product positioning.
- **What you get.** The 23 surfaces grouped as operational / AI primitives.
- **Who this is for.** Solo founders and small teams (2–5 people) building a SaaS in 30–90 days.
- **What you don't get.** RAG, observability, evals, multi-locale (all deferred to v2).
- **Architecture overview diagram.** The `00-system-overview` diagram embedded or linked.
- **Quick links to get started.**
  - "New to DeesseJS?" → Quick Start
  - "Want to understand the tech?" → Tech Stack
  - "Already know the stack?" → Configuration
- **🏆 The modular contract (flagship).** Link to "Deleting features" as the #1 proof of the wedge. Show the delete test pattern.
- **Community / support.** Link to Discord, GitHub issues, email.

### FAQ

- *Can I use DeesseJS for a non-SaaS project?* → Yes, but you pay for features you delete. Better for SaaS.
- *Is the code mine after purchase?* → Yes, full source code, unlimited projects, lifetime license.
- *What's the difference from ShipFast / Makerkit / supastarter?* → Completeness + modular contract. Link to the comparison table.

---

## 2. Codebase Structure

**File:** `codebase-structure/index.mdx`
**Meta:** `title: "Codebase Structure"`
**Type:** Reference
**Added from:** supastarter `/docs/nextjs/codebase/structure`

### Content

- **Repository layout.** The `apps/template/` tree (apps/web, apps/cli, apps/docs, packages/*).
- **App boundaries.** Which app owns what surface:
  - `apps/web/` — the buyer's web app
  - `apps/cli/` — the buyer's user-facing CLI
  - `apps/docs/` — the buyer's documentation site
- **Packages.** All 13 packages listed with one-line description each.
- **Configuration scoping.** `config.ts` per surface (not global), the `@config` alias pattern.
- **Path aliases.** `@/*` for src/*, future per-package aliases.
- **How to add a new page.** Which app, which route group, which file.
- **How to delete a feature.** Link to the "Deleting features" guide.

### FAQ

- *Which app do I edit to add a new page?* → `apps/web/` for product pages, `apps/docs/` for docs.
- *Can I remove the CLI?* → Yes. Delete `apps/cli/` and remove the import from the template.
- *Where do I put shared utilities?* → `packages/utils/`.

---

## 3. Tech Stack

**File:** `tech-stack/index.mdx`
**Meta:** `title: "Tech Stack"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/tech-stack`

### Content

- **Philosophy.** Why opinionated choices beat "bring your own stack."
- **Framework: Next.js 16.** App Router, route groups, server components, streaming.
- **Database: Drizzle ORM + PostgreSQL.** Why Postgres over SQLite (scale, RBAC, multi-tenancy). Why Drizzle and not Prisma.
- **Auth: Better Auth.** Plugins used (sessions, orgs, 2FA, passkeys, magic links, OTP, rate-limit).
- **API: oRPC + Hono.** Double transport (typed RPC + REST/OpenAPI). Why both — oRPC for internal type safety, Hono for public REST.
- **AI: Vercel AI SDK.** Provider abstraction (OpenAI, Anthropic, Gemini, OpenRouter).
- **Background Jobs: Trigger.dev.** Code-first jobs, retries, queues.
- **Email: Resend + React Email.** Why React Email over MJML / MJML-style builders.
- **UI: Tailwind CSS v4 + shadcn/ui.** Design tokens, dark mode, per-tenant theming.
- **Storage: Cloudflare R2.** S3-compatible, no egress fees.
- **Realtime / Cache: Upstash Redis.** Sessions, rate-limit, notifications.
- **Docs: Fumadocs.** MDX, versioning strategy.
- **Runtime: Node.js 20+.** Not Bun in production (see ADR). Bun only for CLI.
- **Runtime notes: Edge limitations.** What runs at the edge vs. what needs Node.

### FAQ

- *Why not Prisma?* → Drizzle generates SQL you can read, ships 3x faster, no client caching layer.
- *Why Hono AND oRPC?* → oRPC gives type-safe RPC internally. Hono gives OpenAPI-documented REST for the public API. Both coexist on the same server.
- *Can I use Bun in production?* → No. Bun ships with the CLI only.

---

## 4. Local Development

**File:** `local-development/index.mdx`
**Meta:** `title: "Local Development"`
**Type:** How-to
**Added from:** supastarter (implied need)

### Content

- **Running all apps.** `pnpm dev` at the root starts every surface simultaneously.
- **Running apps separately.**
  - `pnpm --filter @deessejs/web dev` — web only
  - `pnpm --filter @deessejs/docs dev` — docs only
  - `pnpm --filter @deessejs/email-preview dev` — email previews only
- **Port mapping.** Which port each app uses by default.
- **Database seeding.** How to populate test data for local development.
- **Creating the first admin user.** CLI script equivalent: `pnpm --filter scripts create:user`.
- **Offline development.** PGlite in-memory DB for zero-dependency local dev (no Docker, no Neon required).
- **Mail preview.** `apps/email-preview` at localhost:3003 — all email templates rendered in browser.

### FAQ

- *`pnpm dev` starts too many things.* → Use `pnpm --filter @deessejs/web dev` for just the web app.
- *I need a real Postgres locally.* → Use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=local postgres:16`.
- *How do I seed test data?* → The `packages/database/tests/` helpers create fixture data automatically.

---

## 5. Quick Start

**File:** `quick-start/index.mdx`
**Meta:** `title: "Quick Start"`
**Type:** Tutorial
**Supastarter equivalent:** `/docs/nextjs/setup`

### Content

- **Prerequisites.** Node 20+, pnpm 9+, a Neon/Turso Postgres DB, a Vercel account.
- **Step 1: Clone and install.** `git clone`, `pnpm install`.
- **Step 2: Environment variables.** Copy `.env.example`, fill in the required vars. Table of every env var with description, format, example.
- **Step 3: Database setup.** `pnpm db:migrate` vs `pnpm db:push` — explain the difference. Run it.
- **Step 4: Start dev server.** `pnpm dev`. Verify at localhost:3000.
- **Step 5: Create your first org.** Sign up → onboarding → org created.
- **Step 6: Create your first admin.** `pnpm --filter scripts create:user --role admin`.
- **Step 7: Explore the dashboard.** Where to find settings, members, billing.
- **Next steps.** Links to Configuration, then the feature deep-dives.
- **Troubleshooting.** Common errors (env var missing, DB connection refused, port conflict).

### FAQ

- *I get a "connection refused" error.* → Make sure Postgres is running. For local dev, use Docker or PGlite (no setup required).
- *The onboarding wizard doesn't start.* → Check `BETTER_AUTH_SECRET` is set in `.env.local`.

---

## 6. Configuration

**File:** `configuration/index.mdx`
**Meta:** `title: "Configuration"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/configuration`

### Content

- **Philosophy.** Configuration is scoped by surface. Each app and package owns its config.
- **App-level config.** `apps/web/config.ts` — appName, baseUrl, redirectAfterSignIn, enabledThemes.
- **Package-level config.**
  - `packages/auth/config.ts` — session duration, cookie settings, OAuth providers
  - `packages/payments/config.ts` — billingAttachedTo, plans with priceId
  - `packages/storage/config.ts` — bucket names
  - `packages/mail/config.ts` — from address, branding
- **Environment variables, full reference.** Every env var from `.env.example`:
  - `DATABASE_URL` — Neon / local Postgres (pooled + direct connection strings for Neon)
  - `BETTER_AUTH_SECRET` — session encryption key
  - `BETTER_AUTH_URL` — base URL (dev vs. prod)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
  - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (optional)
  - `TRIGGER_API_KEY`
  - `BETTER_AUTH_ADMIN_EMAIL` — initial admin account
- **`NEXT_PUBLIC_*` split.** Which vars are exposed to the client.
- **Feature flags.** How to enable/disable features (orgs, billing, AI, notifications).
- **Multi-environment setup.** Dev (localhost), staging (preview deploys), production.
- **Theming.** How to override Tailwind tokens, how per-tenant theming works.
- **Modular contract: deleting features.** The delete-what-you-don't-need guide. The flagship doc.

### FAQ

- *Where do I add a new env var?* → Add to `.env.example` with a description, then run `pnpm dev` to validate.
- *Can I change the app name?* → Yes. Edit `apps/web/config.ts` → `appName`.
- *How do I switch payment providers?* → Currently Stripe only. Architecture supports future providers.

---

## 7. Database

**File:** `database/index.mdx`
**Meta:** `title: "Database"`
**Type:** Reference + How-to
**Supastarter equivalent:** `/docs/nextjs/database/overview`

### Content

- **Schema overview.** The 4 Better Auth tables (users, sessions, accounts, orgs/members) + custom tables.
- **Drizzle ORM setup.** How to add a new table, the naming conventions.
- **Migrations.** `drizzle-kit` CLI, `pnpm db:migrate` vs `pnpm db:push` vs `pnpm db:generate`. When to use which.
- **Cross-tenant isolation.** The `orgId` pattern, why every table needs one, the fixture test that proves it (our moat).
- **Query patterns.** Basic CRUD, transactions, soft deletes.
- **Connection pooling.** Postgres.js pool config, Neon serverless driver limits.
- **Testing with PGlite.** In-memory Postgres for unit/integration tests, no Docker needed.
- **Schema reference.** Link to the actual schema file in `packages/database/src/schema/`.
- **Extending the schema.** Adding your first custom table (the pattern, with code example).
- **Why Drizzle and not Prisma?** Lightweight, SQL you can read, ships faster.

### Sub-pages

| Sub-page | File | Type | Notes |
|---|---|---|---|
| Schema & migrations | `database/schema.mdx` | How-to | migrate / push / generate distinction |
| Client reference | `database/client.mdx` | Reference | Full CRUD examples with Drizzle syntax |
| Database studio | `database/studio.mdx` | How-to | drizzle-kit studio for visual exploration |
| Cross-tenant isolation | `database/cross-tenant.mdx` | How-to | orgId pattern + fixture test — our moat |
| Neon setup | `database/providers/neon.mdx` | How-to | Pooled + direct connection strings |
| Turso setup | `database/providers/turso.mdx` | How-to | libSQL, Drizzle only, edge replicas |

### FAQ

- *`pnpm db:push` vs `pnpm db:migrate`?* → `push` applies schema without migration history (dev). `migrate` creates a versioned migration file (prod).
- *I need to add a new table.* → Add it to `packages/database/src/schema/`, run `pnpm db:push`, done.
- *Does Neon need two connection strings?* → Yes. `DATABASE_URL` (pooled, for the app) + `DIRECT_URL` (direct, for migrations). See the Neon guide.

---

## 8. API

**File:** `api/index.mdx`
**Meta:** `title: "API"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/api/overview`

### Content

- **Architecture overview.** Double-transport: oRPC (internal, type-safe RPC) + Hono REST (public, OpenAPI-documented).
- **The two transports.**
  - `/rpc/*` — oRPC RPC transport. Type-safe, procedure-based, for internal frontend ↔ backend.
  - `/api/v1/*` — Hono REST with OpenAPI. For external consumers, API keys, third-party integrations.
- **Middleware stack.** The Hono middleware chain: auth → org context → requestId → logger.
- **AsyncLocalStorage pattern.** How `requestId` propagates from Hono to oRPC error encoder (our moat).
- **Error envelope.** `serializeOrpcError` — the single point that shapes all errors to the wire format.
- **API versioning.** How `/api/v1/` works, when to increment the version.
- **OpenAPI docs.** Available at `/api/docs` (Scalar UI). How to regenerate the spec.

### Sub-pages

| Sub-page | File | Type | Notes |
|---|---|---|---|
| Define an endpoint | `api/define-endpoint.mdx` | How-to | Full CRUD pattern: .route() + .input() + .output() + .handler() |
| Protect endpoints | `api/protect-endpoints.mdx` | Reference | publicProcedure / protectedProcedure / orgProcedure / adminProcedure |
| API keys | `api/api-keys.mdx` | How-to | Generate, revoke, use in requests — supastarter has no this |
| Frontend: client components | `api/usage-client.mdx` | How-to | TanStack Query + `orpc.xxx.queryOptions()` |
| Frontend: server components | `api/usage-server.mdx` | How-to | `orpcClient.xxx()` in RSC |
| Streaming AI responses | `api/streaming.mdx` | How-to | streamText → streamToEventIterator |
| OpenAPI docs | `api/openapi.mdx` | How-to | Scalar UI, spec regeneration, publishing |
| Locale in API | `api/use-locale.mdx` | How-to | `context.locale` in handlers |
| Error handling | `api/error-handling.mdx` | Reference | serializeOrpcError, error codes, client-side handling |
| API versioning | `api/versioning.mdx` | Reference | /api/v1/ strategy |

### FAQ

- *Why two transports?* → oRPC gives end-to-end type safety for internal calls. Hono REST gives OpenAPI docs + Bearer token auth for external consumers.
- *Can I skip oRPC and use only Hono?* → Yes, but you lose the type-safe client generation.
- *How does requestId tracing work?* → AsyncLocalStorage in the Hono context propagates requestId to the oRPC error encoder, even though oRPC runs outside the Hono chain.

---

## 9. AI

**File:** `ai/index.mdx`
**Meta:** `title: "AI Primitives"`
**Type:** Concept + How-to
**Supastarter equivalent:** `/docs/nextjs/ai/overview`

### Content

- **Philosophy.** "AI primitives ship and are well-built, but are not the headline." What this means for the buyer.
- **Provider abstraction.** Vercel AI SDK, how to switch between OpenAI / Anthropic / Gemini / OpenRouter — one-line change.
- **Structured output.** Zod schemas → typed LLM calls, first-class pattern.
- **Streaming UI.** How to stream responses to the client, the React patterns used.
- **Agent loops.** Tool calling, multi-step reasoning, human-in-the-loop checkpoints.
- **Per-tenant cost tracking.** How every LLM call is metered against the tenant's budget (our moat — supastarter has no this).
- **Token budgets.** How to set and enforce per-org LLM spending caps.
- **What does NOT ship in v1.** Vector DB / RAG, observability (Langfuse/Helicone), evals (Promptfoo).
- **Extending the AI layer.** Adding a new provider, custom tools, custom streaming UI.

### FAQ

- *Can I use my own API key for OpenAI?* → Yes. Set `OPENAI_API_KEY` in your env vars. The buyer is always in control of their data.
- *Is there a chatbot included?* → The AI primitives are included; a full chatbot UI is an example, not a shipped product.
- *How is per-tenant metering enforced?* → Every LLM call goes through the `ai/metering` module which increments the tenant's Redis counter before the call.

---

## 10. Organizations

**File:** `organizations/index.mdx`
**Meta:** `title: "Organizations & Auth"`
**Type:** Reference + How-to
**Supastarter equivalent:** `/docs/nextjs/authentication/overview`

### Content

- **What is an organization.** The multi-tenant data model, org = workspace = tenant.
- **Multi-org per user.** One user can belong to multiple orgs, how the switcher works.
- **RBAC permissions matrix.** The 4 default roles (owner, admin, member, billing), what each can do — table format.
- **Invitation flow.** Invite by email, role assignment, pending invitations.
- **Session management.** How sessions work, cookie configuration, cross-subdomain SSO.
- **Two-factor authentication (2FA).** TOTP setup, recovery codes, enforced 2FA for admins.
- **Passkeys / WebAuthn.** Setup, usage, fallback.
- **Magic links & OTP.** Email magic link flow, one-time passwords.
- **OAuth providers.** Google OAuth setup, adding other providers.
- **API keys.** How users generate and manage API keys for programmatic access.
- **Admin panel.** The built-in admin view (user list, impersonation, org management).
- **Security settings.** Session expiry, device list, revoke sessions.
- **Audit log.** Every role change, impersonation, and session revocation is logged.

### FAQ

- *Can a user belong to multiple orgs?* → Yes. Use the org switcher in the header to change the active org.
- *Can I add a custom role?* → Yes. Add to the `roles` enum in the database schema and update the permissions matrix.
- *How does impersonation work?* → Admins can sign in as any user. All impersonation actions are audit-logged.

---

## 11. Payments

**File:** `payments/index.mdx`
**Meta:** `title: "Billing & Payments"`
**Type:** How-to
**Supastarter equivalent:** `/docs/nextjs/payments/overview`

### Content

- **Overview.** Stripe Connect Standard, how buyer = merchant of record.
- **Why Stripe?** Reliability, Connect Standard, webhook maturity, no platform risk.
- **Pricing tiers.** The 3-tier structure (Solo $299 / Team $599 / Studio $999), how it's configured in Stripe.
- **Checkout flow.** How the Stripe checkout session is created, what data is passed, success/cancel redirects.
- **Customer portal.** Self-service plan changes, cancellation, invoice history.
- **Webhooks.** The webhook handler, which events are handled, idempotency, retry logic.
- **Org-scoped subscriptions.** Why each org has its own Stripe customer and subscription.
- **Trial periods.** 14-day trial configuration, how it works without a card.
- **Usage-based billing.** How LLM token add-ons are metered and charged (architecture in place, not wired in v1).
- **Proration.** How plan upgrades/downgrades are prorated.
- **Dunning.** Failed payment retry logic, dunning email sequence.
- **Testing with Stripe test mode.** Test cards, webhook testing with Stripe CLI.
- **Going live checklist.** Domain verification, webhook endpoint, production keys.

### FAQ

- *Why Stripe only and not Lemon Squeezy / Paddle?* → Stripe Connect Standard gives buyers the merchant-of-record model. Fewer moving parts, proven at scale.
- *Can I offer one-time payments instead of subscriptions?* → Yes. Configure a `one-time` price type in `packages/payments/config.ts`.
- *What happens if a payment fails?* → The webhook handler marks the subscription as `past_due`. Dunning emails are sent automatically.

---

## 12. Storage

**File:** `storage/index.mdx`
**Meta:** `title: "File Storage"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/storage/overview`

### Content

- **Architecture.** Cloudflare R2 + S3-compatible API, why no egress fees.
- **Provider switch.** All S3-compatible providers work (AWS S3, R2, DigitalOcean Spaces, MinIO) — swap in one place.
- **Uploading files.** The upload API, presigned URLs vs. direct-to-R2, max file sizes.
- **File organization.** How files are organized (per-org, per-user, per-entity), the path conventions.
- **Avatar uploads.** User avatars, org logos — special handling for images.
- **Serving files.** Public vs. private files, signed URLs for private assets.
- **Export downloads.** How bulk exports (CSV, JSON) are generated and served.
- **Supported file types.** Allowed MIME types, size limits.
- **CDN / caching.** Cache-Control headers, Cloudflare CDN integration.
- **Deleting files.** When files are deleted (org deletion, user deletion).
- **Migration from R2.** How to migrate to AWS S3 or another S3-compatible provider.

### FAQ

- *What's the max file size?* → 5GB with multipart uploads (S3 standard).
- *Are uploads secure?* → Yes. Files are uploaded via presigned URLs — credentials never hit your server.
- *Can I serve files from a custom domain?* → Yes. Configure a Cloudflare R2 custom domain.

---

## 13. Mailing

**File:** `mailing/index.mdx`
**Meta:** `title: "Email"`
**Type:** Reference + How-to
**Supastarter equivalent:** `/docs/nextjs`

### Content

- **Architecture.** Resend as the transport, React Email for templates, the `packages/mail` architecture.
- **Provider switch (visible on page 1).** Show the export switch on the first screen.
  ```ts
  export * from "./resend";  // ← current default
  // export * from "./postmark";  // ← swap here
  ```
- **Template types.** Auth templates (verify email, reset password, magic link, invitation), billing templates (receipt, invoice, failed payment), transactional templates (welcome, notification).
- **React Email patterns.** How templates are structured, the `Wrapper` component, the `BaseMailProps` interface.
- **Sending in development.** `ConsoleMailer` (logs to console), `ResendMailer` (real sends), how to switch.
- **Previewing emails.** The `apps/email-preview` app — `pnpm --filter @deessejs/email-preview dev` at localhost:3003.
- **Email deliverability.** SPF / DKIM / DMARC setup, Resend domain verification.
- **Unsubscribe handling.** List-Unsubscribe header, one-click unsubscribe.
- **Rate limits.** Resend's rate limits per plan, how batching works.
- **Customizing templates.** How the buyer changes templates for their own brand (colors, copy, domain).

### FAQ

- *How do I add a new email template?* → Create a new `.tsx` file in `packages/mail/templates/`, export from the registry, use `sendMail()` in the action that triggers it.
- *Emails are not sending in development.* → Make sure `RESEND_API_KEY` is set. In dev, `ConsoleMailer` logs to console by default.

---

## 14. Internationalization

**File:** `internationalization/index.mdx`
**Meta:** `title: "Internationalization"`
**Type:** How-to
**Supastarter equivalent:** `/docs/nextjs/internationalization`

### Content

- **Status in v1.** English only ships in v1. The architecture supports i18n; this doc explains how to add locales.
- **Translation architecture.** The `i18n` package structure, JSON locale files, namespace separation.
- **Adding a locale.** Step-by-step: add the locale file, configure Next.js, update the language switcher.
- **Routing strategy.** Subdomain vs. subpath. What DeesseJS uses and why.
- **RTL support.** How to add right-to-left locales (Arabic, Hebrew).
- **Date / number formatting.** `Intl` API wrappers, timezone handling.
- **Content i18n.** How MDX docs are localized.
- **Email i18n.** How transactional emails are localized, template variants vs. interpolation.
- **Currency localization.** How billing displays in the user's currency.

### FAQ

- *I'm building for English only. Do I need i18n?* → No. The architecture ships with English. i18n is opt-in.
- *How do I add French?* → Add `fr.json` to the locale files, enable `fr` in the Next.js config, done.

---

## 15. Blog

**File:** `blog/index.mdx`
**Meta:** `title: "Blog"`
**Type:** How-to
**Supastarter equivalent:** `/docs/nextjs/blog`

### Content

- **Architecture.** Fumadocs blog, MDX posts, how it integrates with the docs site.
- **Writing a post.** Frontmatter schema (title, date, author, excerpt, tags, published), slug generation.
- **Author profiles.** Author data, avatars, bio.
- **Categories and tags.** Taxonomy, how to add new categories.
- **SEO for blog posts.** Open Graph images, Twitter cards, canonical URLs, sitemap.
- **RSS feed.** How the RSS feed is generated, how to subscribe readers.
- **MDX features.** Using React components inside blog posts, code syntax highlighting, callouts.
- **Blog in the buyer's product.** How the buyer removes or replaces the blog with their own CMS.
- **Blog → docs cross-links.** How to link from a blog post to a docs page.

### FAQ

- *Can I use a CMS instead of MDX?* → Yes. See the "CMS integration" guide in the blog module.
- *I want to delete the blog.* → Delete `apps/web/src/app/blog/` and remove the blog routes. The modular contract applies.

---

## 16. Documentation Site

**File:** `documentation/index.mdx`
**Meta:** `title: "Documentation Site"`
**Type:** How-to
**Supastarter equivalent:** `/docs/nextjs/documentation`

### Content

- **Architecture.** Fumadocs, MDX, how the `source.config.ts` defines the content structure.
- **Content structure.** The `content/docs/` directory, how pages are organized.
- **Writing MDX.** Syntax guide, frontmatter (`title`, `description`), custom components.
- **Navigation.** `meta.json` structure, sidebar groups, ordering pages.
- **Versioning.** How to add a new version, how version switching works.
- **Linking between pages.** Relative links, cross-section links, anchor links.
- **Code blocks.** Syntax highlighting, line numbers, diff highlighting, terminal blocks.
- **Callouts and admonitions.** Info, warning, danger, tip blocks.
- **Custom components.** How to add reusable React components to MDX.
- **Search.** How the search index is built.
- **Localization of docs.** How locale-specific docs versions are managed.
- **Publishing workflow.** Draft → preview → publish, how preview deploys work.
- **The "Deleting features" flagship doc.** What it is, why it exists, how to maintain it as features change. This is the proof of the wedge.

### FAQ

- *Can I change the docs URL from `/docs` to something else?* → Yes. Rename the route group in `apps/web/src/app/`.
- *I want to delete the docs site.* → Delete `apps/docs/` and remove it from `apps/template/apps/`. Done.

---

## 17. SEO

**File:** `seo/index.mdx`
**Meta:** `title: "SEO"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/seo/meta-tags`

### Content

- **Meta tags.** How metadata is configured per page (title, description, OG tags, Twitter cards).
- **Structured data / Schema.org.** JSON-LD for software application, organization, breadcrumbList, FAQPage.
- **Sitemap.** Auto-generated sitemap, `sitemap.ts`, exclusions.
- **Robots.txt.** The robots.txt file, what is blocked, what is allowed.
- **Canonical URLs.** How canonical tags are set, cross-domain canonicals.
- **Core Web Vitals.** The Lighthouse targets, what to optimize for LCP / CLS / INP.
- **Image optimization.** `next/image`, AVIF/WebP generation, lazy loading.
- **Performance monitoring.** CI-enforced Lighthouse audit (optional), how to add it.
- **International SEO.** Hreflang tags, geo-targeting, canonical variants.
- **Analytics integration.** How to add Plausible, Google Analytics, or Fathom.
- **Open Graph and Twitter cards.** Default templates, per-page override.

### FAQ

- *How do I add a new page to the sitemap?* → Next.js auto-generates the sitemap from all routes. No manual work needed.
- *Can I run Lighthouse in CI?* → Yes. Add the Lighthouse GitHub Action to your CI pipeline.

---

## 18. Deployment

**File:** `deployment/index.mdx`
**Meta:** `title: "Deployment"`
**Type:** How-to
**Supastarter equivalent:** `/docs/nextjs/deployment/overview` + 7 provider guides

### Content

- **Vercel (recommended).** One-click deploy, environment variables on Vercel, preview deploys per PR.
- **7 hosting providers** (from supastarter research):
  - **Docker** — `docker compose` setup, self-hosted, Hetzner/DigitalOcean VPS
  - **Railway** — Simple deployment, `$5/mo` starting tier
  - **Fly.io** — Edge-first, free tier available
  - **Netlify** — Alternative to Vercel
  - **Render** — Simple Node.js hosting
  - **Coolify** — Self-hosted, open source
  - **Cloudflare Pages** — Alternative for static or edge-heavy apps
- **Environment-specific setup.** Dev vs. staging vs. production configuration.
- **Database migrations on deploy.** How migrations run (CI step, startup hook).
- **Build process.** The `pnpm build` command, what it does, how to customize it.
- **Domain setup.** DNS configuration, A records, CNAME, Vercel custom domain.
- **SSL / HTTPS.** Automatic via Vercel, self-signed for local dev.
- **Environment variables on the server.** How to manage secrets in production.
- **Health checks.** `/api/health` endpoint, uptime monitoring.
- **Rollback strategy.** How to roll back a bad deploy on Vercel.
- **CI / CD pipeline.** GitHub Actions workflow for lint → test → build → deploy.
- **Region selection.** Proximity to database + audience.

### FAQ

- *Is Vercel required?* → No. DeesseJS runs on any Node.js host. Vercel is recommended for the best DX.
- *How do I run migrations on every deploy?* → Add `pnpm db:migrate` to your deployment pipeline before the build step.

---

## 19. Launch Checklist

**File:** `launch/index.mdx`
**Meta:** `title: "Going to Production"`
**Type:** Checklist
**Added from:** supastarter `/docs/nextjs/launch`

### Content

A buyer-facing checklist, structured as a page, not a doc. This is the most-visited page at launch.

- **App architecture review.** Which app owns what surface. Verify both apps are configured.
- **Mail templates.** All templates working, logo changed to your brand, all translated (if i18n enabled).
- **Mail provider setup.** Domain verified, `from` address set to your domain, not spam.
- **i18n completeness.** Only enabled locales have complete translations.
- **Payment products.** All products and prices configured in Stripe **production** mode. No test mode keys in production.
- **Webhooks.** Pointing to production URL, signature verification enabled.
- **SEO.** All pages have title + description, sitemap is accessible, robots.txt correct.
- **Legal pages.** Privacy policy, Terms of service, Imprint — created and deployed.
- **Environment variables.** All production values set, no `.env.local` accidentally committed.
- **Region.** App deployed near your database and your primary audience.

### FAQ

- *I don't need legal pages yet.* → You do if you're collecting user data. Consult a lawyer for your jurisdiction.
- *Can I launch with test Stripe mode?* → No. Stripe test mode is for development only.

---

## 20. Admin Panel

**File:** `admin/index.mdx`
**Meta:** `title: "Admin Panel"`
**Type:** Reference
**Supastarter equivalent:** `/docs/nextjs/authentication/superadmin`

### Content

- **What is the built-in admin.** The `packages/admin` surface: user management, org management, impersonation.
- **Accessing the admin.** How to become an admin, the `BETTER_AUTH_ADMIN_EMAIL` env var.
- **User management.** List all users, view user details, disable accounts.
- **Organization management.** List all orgs, view org details, delete org.
- **Impersonation.** How admins can sign in as any user (audit logged), how to exit.
- **API key management (admin view).** View and revoke any API key.
- **Audit log.** What events are logged, how to query the audit log.
- **Rate limit overrides.** How to exempt a user or org from rate limits.
- **Billing admin view.** Stripe customer details, subscription status, invoice list.
- **Customizing the admin.** How to add custom admin pages, how to remove the admin package.
- **Security considerations.** Who should have admin access, the principle of least privilege.

### FAQ

- *How do I make someone an admin?* → Set their email in `BETTER_AUTH_ADMIN_EMAIL` or use the admin UI to promote them.
- *Can I delete the admin package?* → Yes. Delete `packages/admin/` and remove its imports. The app continues to work.

---

## 21. Background Tasks

**File:** `background-tasks/index.mdx`
**Meta:** `title: "Background Jobs"`
**Type:** Reference + How-to
**Supastarter equivalent:** `/docs/nextjs/tasks/overview`

### Content

- **Architecture.** Trigger.dev as the job runner, why code-first over YAML/JSON config.
- **Defining a job.** The `trigger.config.ts` file, how jobs are structured.
- **Job types.** Immediate (user-triggered), scheduled (cron), event-driven (webhook).
- **Retries and dead-letter.** How failed jobs are retried, the exponential backoff config, DLQ.
- **Queues and priorities.** How to configure job queues, priority levels.
- **Observability.** Trigger.dev dashboard, how to monitor job health.
- **Secrets management.** How Trigger.dev secrets differ from app env vars.
- **Common patterns.** Email queuing, webhook delivery retries, data cleanup jobs.
- **Testing jobs.** How to run jobs locally with the Trigger.dev CLI.
- **Self-hosted alternative.** Upstash QStash for serverless, BullMQ for long-running servers.
- **What NOT to use Trigger.dev for.** Heavy computation, video processing — what's deferred.

### FAQ

- *Can I use BullMQ instead of Trigger.dev?* → Yes. Swap the job runner, keep the job definitions. See the self-hosted guide.
- *How do I debug a failed job?* → Check the Trigger.dev dashboard for the failed run with full input/output logs.

---

## 22. Customization

**File:** `customize/index.mdx` + subpages
**Meta:** `title: "Customization"`
**Type:** How-to
**Added from:** supastarter `/docs/nextjs/customization/onboarding`

### Content

This section makes the modular contract tangible. Each sub-page is a "how to add a new X" guide.

| Sub-page | File | Content |
|---|---|---|
| Add an onboarding step | `customize/onboarding-steps.mdx` | Create step component → add to OnboardingForm → add translations |
| Add a database table | `customize/new-database-table.mdx` | Schema → migrate → data-access module → use in API |
| Add an API endpoint | `customize/new-api-endpoint.mdx` | Define procedure → add to router → call from frontend |
| Add a new page | `customize/new-page.mdx` | Route group → page file → add to navigation |
| Add a feature flag | `customize/feature-flags.mdx` | Config entry → gate in UI → gate in API |
| Delete a feature | `customize/delete-feature.mdx` | The flagship guide. How to prove the modular contract works. |

### FAQ

- *I want to remove billing.* → Follow the "Delete a feature" guide. Billing is one of the deletable packages.
- *Can I add a new OAuth provider?* → Yes. Configure it in `packages/auth/src/auth.ts` following the Better Auth OAuth guide.

---

## 23. Legal

**File:** `legal/index.mdx`
**Meta:** `title: "Legal"`
**Type:** Reference
**Added from:** supastarter launch checklist

### Content

- **Why legal pages matter.** What every SaaS needs before collecting user data.
- **Privacy policy.** What data you collect, how you use it, third-party sharing, GDPR compliance.
- **Terms of service.** User obligations, acceptable use, liability limitations.
- **Cookie policy.** What cookies are set, how to manage consent.
- **Imprint.** Legal entity name, address, contact information.
- **Where they live.** `apps/web/src/app/legal/` — MDX files, auto-added to sitemap.
- **Generating templates.** Recommended services for generating legally-sound templates.
- **When to consult a lawyer.** What DIY covers and what requires professional review.

### FAQ

- *Can I skip legal pages?* → Not if you're collecting personal data. Consult a lawyer for your jurisdiction.
- *Are these templates legally binding?* → They are a starting point. Have a lawyer review before launch.

---

## Metadata

### Doc Status Definitions

| Status | Meaning |
|---|---|
| **Planned** | Page exists as a stub; no content yet |
| **In Progress** | Content being written |
| **Review** | Content complete, awaiting technical review |
| **Published** | Reviewed and live |
| **Deferred** | Not in v1 scope (locked decision) |

### Doc Type Reference

| Type | Meaning |
|---|---|
| **Concept** | Explains *why*, not *how*. Architecture and design decisions. |
| **How-to** | Step-by-step task guide. Assumes the reader knows the basics. |
| **Reference** | Exhaustive, machine-readable or near-machine-readable. Env vars table, API schema. |
| **Tutorial** | Learning-oriented. "Build your first X with DeesseJS." |
| **Checklist** | Launch-focused. "Things to verify before going live." |
| **Troubleshooting** | Problem → solution. Error messages, common failures. |
| **Decision** | Architecture decision record embedded or linked. |

---

## Implementation Tracking

| # | Page | File | Type | Status | Notes |
|---|---|---|---|---|---|
| 1 | Introduction | `introduction/index.mdx` | Concept | Planned | Link to "Deleting features" as flagship |
| 2 | Codebase Structure | `codebase-structure/index.mdx` | Reference | Planned | **NEW** — from supastarter |
| 3 | Tech Stack | `tech-stack/index.mdx` | Reference | Planned | "Why Drizzle not Prisma" |
| 4 | Local Development | `local-development/index.mdx` | How-to | Planned | **NEW** — from supastarter |
| 5 | Quick Start | `quick-start/index.mdx` | Tutorial | Planned | First admin creation step |
| 6 | Configuration | `configuration/index.mdx` | Reference | Planned | config.ts per surface + env vars |
| 7 | Database | `database/index.mdx` | Reference + How-to | Planned | Overview + 6 subpages |
| 7a | — Schema & Migrations | `database/schema.mdx` | How-to | Planned | |
| 7b | — Client Reference | `database/client.mdx` | Reference | Planned | |
| 7c | — Database Studio | `database/studio.mdx` | How-to | Planned | |
| 7d | — Cross-tenant | `database/cross-tenant.mdx` | How-to | Planned | **MOAT** |
| 7e | — Neon Setup | `database/providers/neon.mdx` | How-to | Planned | |
| 7f | — Turso Setup | `database/providers/turso.mdx` | How-to | Planned | |
| 8 | API | `api/index.mdx` | Reference | Planned | Overview + 11 subpages |
| 8a | — Define Endpoint | `api/define-endpoint.mdx` | How-to | Planned | **P0** — full CRUD pattern |
| 8b | — Protect Endpoints | `api/protect-endpoints.mdx` | Reference | Planned | **P0** — 4 procedures |
| 8c | — API Keys | `api/api-keys.mdx` | How-to | Planned | **MOAT** — supastarter has none |
| 8d | — Frontend: Client | `api/usage-client.mdx` | How-to | Planned | |
| 8e | — Frontend: Server | `api/usage-server.mdx` | How-to | Planned | |
| 8f | — Streaming | `api/streaming.mdx` | How-to | Planned | **P0** — for AI |
| 8g | — OpenAPI | `api/openapi.mdx` | How-to | Planned | |
| 8h | — Use Locale | `api/use-locale.mdx` | How-to | Planned | |
| 8i | — Error Handling | `api/error-handling.mdx` | Reference | Planned | serializeOrpcError |
| 8j | — API Versioning | `api/versioning.mdx` | Reference | Planned | |
| 9 | AI | `ai/index.mdx` | Concept + How-to | Planned | Per-tenant metering moat |
| 10 | Organizations | `organizations/index.mdx` | Reference + How-to | Planned | RBAC matrix table |
| 11 | Payments | `payments/index.mdx` | How-to | Planned | |
| 12 | Storage | `storage/index.mdx` | Reference | Planned | Provider switch visible |
| 13 | Mailing | `mailing/index.mdx` | Reference + How-to | Planned | Provider switch on page 1 |
| 14 | Internationalization | `internationalization/index.mdx` | How-to | Planned | v1 = en only |
| 15 | Blog | `blog/index.mdx` | How-to | Planned | |
| 16 | Documentation | `documentation/index.mdx` | How-to | Planned | "Deleting features" flagship |
| 17 | SEO | `seo/index.mdx` | Reference | Planned | |
| 18 | Deployment | `deployment/index.mdx` | How-to | Planned | 7 hosting providers |
| 19 | Launch Checklist | `launch/index.mdx` | Checklist | Planned | **NEW** — most-visited page |
| 20 | Admin Panel | `admin/index.mdx` | Reference | Planned | |
| 21 | Background Tasks | `background-tasks/index.mdx` | Reference + How-to | Planned | |
| 22 | Customization | `customize/index.mdx` | How-to | Planned | **NEW** — 6 subpages |
| 23 | Legal | `legal/index.mdx` | Reference | Planned | **NEW** — from supastarter |

**Total: 23 pages + 19 subpages = 42 MDX files**

---

## Cross-references

- `documents/internal/architecture/00-system-overview/` — system diagram embedded in Introduction
- `documents/internal/architecture/01-stack/` — per-technology deep dives (Drizzle, Next.js, Bun, etc.)
- `documents/internal/architecture/11-packages/` — per-package docs (auth, database, api, mail, etc.)
- `documents/internal/product/README.md` — product brief, wedge definition
- `documents/internal/product/features.md` — full feature inventory (200 features)
- `documents/internal/product/build-roadmap.md` — M0–M8 build sequence (what ships when)
- `documents/internal/product/onboarding.md` — the onboarding wizard design
- `documents/internal/architecture/10-decisions/0012-template-as-pattern.md` — apps/docs structure
- `documents/internal/documentation/supastarter-inspiration.md` — research source
- `reference-fumadocs-api.md` (agent memory) — Fumadocs API reference
- `reference-react-email-v6-unified.md` (agent memory) — React Email v6 reference
