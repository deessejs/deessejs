---
name: project-lite-feature-surface-2026-06-29
description: Recommendation (uncommitted as of 2026-06-29) for what features belong in DeesseJS Lite (free, MIT lead magnet). Principle: Lite ships the foundation + DX wow, Starter ships the depth, Team ships the tenancy. Structural gates only — no capability walls. Lite stays "human-developable", MCP and per-tenant features go to paid tiers.
metadata:
  type: project
---

# Lite feature surface recommendation (2026-06-29)

User asked: what features should Lite include? Recommendation delivered. Status: **uncommitted** until user explicitly approves.

## Principle

**Lite = foundation + DX. Starter = depth. Team = tenancy. Structural gates only.**

Lite's three jobs at once:
1. **Prove the template works** — run locally, ship a demo in 15 min
2. **Demonstrate the DX** — type-safe end-to-end, modern stack
3. **Make the upgrade path obvious** — clearly show what's missing for a real SaaS

Anti-pattern to avoid: **Lite as a "watered-down demo"** that's neither demo nor template. Lite must be a complete *starter*, not a half-product.

## Lite (free, MIT) — what to ship

**Core stack**
- Better Auth (single-tenant: sessions, OAuth, magic links, password reset)
- Drizzle ORM + Postgres + migrations
- Hono + oRPC server
- Tailwind v4 + shadcn/ui full primitives
- TypeScript strict, ESLint, Prettier

**User-facing**
- Marketing site (apps/web-style landing + pricing teaser + legal placeholders)
- Auth pages (login, signup, forgot-password)
- One example CRUD resource (todos) with shadcn form — proves the flow end-to-end
- Email templates via React Email + Resend (welcome, password reset)
- Dark mode
- Fumadocs docs site (10 pages minimum — evaluators heavily weight docs quality)

**Commerce & AI (table stakes)**
- Stripe single-tenant subscriptions — single product, single price, webhooks, customer portal
- Vercel AI SDK + one streaming chat endpoint — proves AI works end-to-end

**Operations**
- Open CHANGELOG via content-collections
- GitHub repo at `nesalia-inc/deessejs-lite`, public, MIT
- `.env.example` + setup script

**The "wow" factor**
- DX polish — types flow end-to-end, opens in Cursor and Just Works
- One genuinely useful AI feature, not "hello world" — e.g. semantic search over todos
- The content engine (blog/changelog/docs) wired up so evaluators see production structure

## NOT in Lite (rationale + where it goes)

| Feature | Where | Why not Lite |
|---|---|---|
| Upstash Realtime (notifications, presence, typing) | Starter | Adds a service to debug, Lite must boot in 15 min |
| Trigger.dev (background jobs) | Starter | Worker process + webhook signing = 2hr debug block |
| Better Auth orgs / RBAC | Starter | The moment you need teammates, you upgrade |
| Admin dashboard + audit log | Starter | Solo founder doesn't need it |
| E2E tests scaffold (Playwright) | Starter | Eval-time overkill, scales with team size |
| i18n scaffold (next-intl, 2 langs) | Starter | Solo founders ship English-first |
| Monitoring (Sentry) hook | Starter | Lite users can wire their own |
| MCP Server 2 (scaffolding STDIO) | Starter | Dev-agent tier — Claude Code/Claude/Cursor ship |
| Stripe Connect (per-tenant) | Team | Multi-tenant primitive, structural |
| Better Auth multi-tenant + orgs | Team | Tenancy |
| Multi-project workspace | Team | Structural scope |
| White-label rights | Team | Licensing tier |
| Agency licensing (5-10 projects) | Team | Structural scope |
| Per-tenant LLM token metering | Team | Operational primitive at scale |
| MCP Server 1 (SaaS-operator OAuth HTTP) | Team | Live-Saas-operated wedge |
| SOC 2 docs scaffold | Team | Compliance-tier buyer |
| SSO (SAML) | Team | Compliance-tier buyer |

## Upgrade narrative (must feel structural, not capability-walled)

- **Lite → Starter:** "I'm shipping a real SaaS solo — multi-resource, RBAC, automations, multi-feature AI"
- **Starter → Team:** "I'm a multi-tenant or agency — Stripe Connect, white-label, MCP-operated by Claude Code"

## Three big design calls

### 1. Should Lite be just-a-demo or small-but-real?

**Recommendation: just-a-demo.** One resource, ~5 services, MIT, npm-installable. Higher viral velocity, faster eval, lower maintenance. The pitch becomes "ship in 15 min, pay to scale." Small-but-real costs more to maintain and creates upgrade fatigue ("why is X already there but Y isn't?").

### 2. Why Fumadocs in Lite

From [[project-lead-magnets-2026-06]]: docs are heavily evaluated by buyers. Empty repo reads "this template is half-baked." A real Fumadocs site with 10 pages is 5% effort for 20% conversion lift.

### 3. Why one resource (todos) and not three

The principle is **demo-foundation, not production**. Three resources means the buyer has to rewrite two. One resource means they ship it, customize, ship their own. Anti-pattern: bloated demo that needs to be deleted before shipping.

## Why not put MCP in Lite

From [[project-mcp-research-2026-06]]: MCP is the wedge for paid tiers. Server 2 (scaffolding STDIO) goes in Starter. Server 1 (SaaS-operator OAuth HTTP) goes in Team. Lite stays "human-developable." Putting MCP in Lite commoditizes the wedge.

## Why Stripe in Lite, but Stripe Connect in Team

Stripe subscriptions are table stakes for any SaaS template — Lite without them reads as a not-SaaS template. But **per-tenant Stripe Connect** is the multi-tenant primitive that lets a Template buyer *become* a platform vendor. Gate Connect, ship subscriptions. Structural line.

## Status: uncommitted as of 2026-06-29

User asked "what features should Lite have" and to save. Has NOT explicitly approved the recommendation. Decision pending.

If confirmed, follow-up actions:
1. Spec Lite scope doc in `documents/internal/product/features/lite.md`
2. Wire apps/template scope down to Lite scope (cut Trigger.dev, Upstash, orgs from default template)
3. Create `nesalia-inc/deessejs-lite` repo skeleton
4. Update `apps/web` "Get Lite" CTA to point at the new repo
5. Cut marketing copy: "Ship in 15 min, pay to scale"

## How to apply

When the user returns to Lite/tier-scope decisions:
- Cross-check any new Lite proposal against this list and the "not in Lite" table
- If adding a feature to Lite, ask: "does this preserve upgrade path to Starter?" (no capability-walled features)
- If cutting a feature from Lite, ask: "does Lite still boot in 15 min for an eval?"
- If the user wants to swap one feature for another, evaluate via the principle above, not feature catalog

Related: [[project-offer-ladder-recommendation-2026-06-29]] (Lite + Starter + Team ladder this fits), [[project-template-market-research-2026-06]] (median feature density per tier), [[project-lead-magnets-2026-06]] (Lite lead-magnet strategy), [[project-mcp-research-2026-06-29]] (MCP placement in paid tiers), [[project-positioning-hybrid-2026-06]] (completeness + DX positioning).
