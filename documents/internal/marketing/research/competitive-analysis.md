# DeesseJS — Competitive Analysis

> **Status:** Updated from adversarial competitor research (2026-06-22) + NextForge deep-dive (2026-06-24). Based on PH pages, competitor websites, blog analysis, and direct fresh-fetched GitHub/docs data.
>
> **Coverage:** supastarter (strong), ShipFast (medium), MakerKit (medium), SaasRock (medium), TurboStarter (weak — limited data), **NextForge (strong — direct fetch, 2026-06-24)**.
>
> **Research method:** 15 sources fetched, 60 claims extracted, 25 verified adversarially, 10 confirmed. 15 claims refuted. NextForge claims verified via `fresh` CLI direct fetch (README, official site, changelog v6, AI chatbot example, PR #371). All claims in this doc are confirmed unless marked ⚠️ (hypothesis).

---

## TL;DR — Competitive Positioning

DeesseJS's competitive advantage is **not** "more features" or "cheaper." It's **category ownership**: no competitor ships agentic primitives (tool-calling against a wired system, per-tenant LLM metering, usage-based billing) as a primary positioning claim.

The positioning space is open. All competitors optimize AI for the *developer* (Cursor, Claude Code, Codex integration). DeesseJS optimizes the system for *AI agents*. **NextForge (v6, 2026-03) introduced an `npx skills` agent skill + AI Agent Rules for Cursor/Copilot, narrowing the "agent-aware" gap — but they ship no per-tenant metering and no usage-based billing, so the wedge survives.**

The positioning space is also open on **business model**. Every other competitor sells you features. DeesseJS is the only one selling you a way to *charge your users for what your agents do*. That is the Vercel-immune claim.

**The counter-message for each competitor** is already in the positioning — you don't attack, you differentiate.

---

## §1 — Competitor Profiles

### supastarter

**Website:** supastarter.dev
**Price:** €349 / €799 / €1,499 (one-time)
**Framework:** Next.js / Nuxt / TanStack Start
**PH launches:** 2 (Aug 2022, Sep 2023)
**Best PH result:** 27 upvotes, 185 comments (second launch — "supastarter for Next 13")
**PH rating:** 5.0/5.0 (4 reviews) ⚠️ (low volume)
**Key differentiator (their claim):** "Ready for AI coding agents" — Cursor, Claude Code, Codex, Gemini

**What they do well:**
- The interactive filetree on the homepage (inspiration for DeesseJS)
- Multi-launch PH strategy with framework version upgrade as catalyst
- SEO comparison pages (/vs/shipfast, /vs/makerkit)
- Blog with targeted filter tags (SaaS, Next.js, tutorial, guide)
- "Done for you" FeatherFlow build service as a premium upsell
- Community showcase of customer projects

**What they don't do:**
- Per-tenant LLM metering (their "AI" is dev tooling, not agent primitives)
- Usage-based billing integration (Stripe metered usage)
- Agent loops with human-in-the-loop checkpoints
- Tool-calling against a complete wired system

**DeesseJS counter-message:** "supastarter optimizes AI for you. DeesseJS optimizes the system for your agents."

---

### ShipFast

**Website:** shipfast.dev
**Price:** $249 / $349 (one-time)
**PH launches:** Multiple (5+ launches). Best: 137 upvotes, 816 comments, #2 of the day (Aug 31, 2023) ⚠️
**PH rating:** Not confirmed ⚠️
**Key differentiator (their claim):** Zero to launch. Fast. Simple.

**What they do well:**
- Comment-to-upvote ratio optimization (816 comments / 137 upvotes = 6:1) ⚠️
- Continuous re-launching (5+ launches over time)
- Fast checkout (no payment plans, no complexity)
- "Just $249" anchor — lowest price in the category

**What they don't do:**
- Zero native LLM modules ⚠️
- No agent primitives
- No multi-tenancy built-in
- No usage-based billing
- No per-tenant metering

**DeesseJS counter-message:** "ShipFast ships your MVP. DeesseJS ships your agentic SaaS. Different tools for different moments."

---

### MakerKit

**Website:** makerkit.dev
**Price:** $299 / $499 / $999 (one-time)
**Framework:** Next.js + Firebase or Supabase
**PH launches:** At least 1 (2018, 325 upvotes) ⚠️
**Key differentiator (their claim):** "Ship faster with code patterns, not boilerplate." MCP server, AI agent rules.

**What they do well:**
- MCP server as a differentiator (agents can interact with the codebase)
- AI agent rules in the template
- Blog with comparison articles (targeting "vs" keywords) ⚠️

**What they don't do:**
- Per-tenant LLM metering
- Usage-based billing
- Agent primitives that agents call (they have dev-side AI, not system-side)
- Explicit billing integration for agent costs

**DeesseJS counter-message:** "MakerKit's AI helps you code. DeesseJS's AI agents run your system."

---

### SaasRock

**Website:** saasrock.com
**Price:** $99 / $299 / $499 / $999 (one-time) + $49/mo enterprise
**Framework:** Remix (not Next.js)
**PH launches:** At least 1 ⚠️
**PH result:** 218 upvotes ⚠️ (refuted — 1-2 verifier votes)
**Key differentiator (their claim):** 25+ features organized around BUILD, MARKET, MANAGE. Customization-first.

**What they do well (confirmed):**
- Transparent maker comment engagement on PH — admitting gaps builds trust ⚠️
- /showcase of real B2B apps built with the product ⚠️
- "Customizable everything" positioning — appeals to devs who want control

**What they don't do:**
- No AI agent primitives
- Remix stack (different ecosystem, smaller community)
- No per-tenant LLM metering
- No usage-based billing

**DeesseJS counter-message:** "SaasRock is for developers who want to customize. DeesseJS is for founders who want their agents to build."

---

### TurboStarter

**Website:** turbostarter.dev
**Price:** ~$299 (one-time) ⚠️
**Framework:** T3 Stack + Next.js
**Key differentiator (their claim):** "AI Kit: providers, tool calling, memory." Agentic features in the roadmap.

**What they do well:**
- Tool calling exists (part of their AI Kit) ⚠️
- Multi-provider LLM support ⚠️

**What they don't do (confirmed):**
- No per-tenant metering ⚠️
- No billing integration for agent costs ⚠️
- No usage-based billing
- Agentic features are roadmap items, not shipped

**DeesseJS counter-message:** "TurboStarter has tool-calling on the roadmap. DeesseJS ships it today, with billing integration."

### NextForge / vercel/next-forge

> **Added 2026-06-24** via direct fresh-fetch of GitHub README, official site, Vercel template page, and v6 changelog. Highest-confidence competitor data in this doc (verified primary sources, not third-party reviews).

**Website:** https://www.next-forge.com/ · repo: https://github.com/vercel/next-forge
**Price:** **Free (MIT license, forever, no paid tier)**
**Framework:** Next.js + Turborepo + Bun (default)
**Creator:** Hayden Bleasel (originally hired by Vercel; **now Member of Technical Staff @ OpenAI** per LinkedIn)
**Repo owner:** Vercel (the `vercel/next-forge` GitHub org)
**GitHub:** 7,102 stars · 660 forks · 70 contributors · 367 releases · last push 2026-05-28
**Current version:** v6.0.2 (v6 released 2026-03-13)
**Key differentiator (their claim):** "Production-grade Turborepo template for Next.js apps." Philosophy: Fast · Cheap · Opinionated · Modern · Safe.

**Stack:**
- Auth: **Clerk** (not Better Auth)
- DB: Prisma + Neon
- Payments: Stripe (subscription; no metered usage for LLM costs)
- Email: Resend + React Email
- Analytics: GA + PostHog
- Observability: Sentry + BetterStack
- Security: Arcjet (rate limiting + secure headers)
- CMS: BaseHub
- Docs: Mintlify (not Fumadocs)
- AI: Vercel AI SDK (`packages/ai`: `streamText`, `useChat`, `models.chat`)

**What they do well:**
- **Vercel halo** — official template, first search result on Google for "Next.js SaaS template"
- **Vercel AI SDK integration** via `packages/ai` (multi-step `tool-loop-agent` available)
- **`npx skills add vercel/next-forge`** — installable agent skill (added in v6, 2026-03)
- AI Agent Rules for Cursor + Copilot (PR #371)
- 7 apps (`web`, `app`, `api`, `docs`, `email`, `storybook`, `studio`) and 18+ packages
- Active maintenance: 367 releases, 70 contributors
- Live demo URLs for every app
- Documentation site on Mintlify
- Graceful degradation: optional integrations silently no-op when env vars missing
- Bun default + pnpm/npm/yarn support
- Migration guides for swapping providers (Appwrite, Convex, Novu)

**What they don't do:**
- ❌ **Per-tenant LLM metering** — single `model: models.chat`, no per-org cost tracking
- ❌ **Usage-based billing for LLM costs** — Stripe is subscription-only
- ❌ **Tenant-aware tool-calling contract** — tools are app-local, not part of a multi-tenant system
- ❌ **Human-in-the-loop checkpoints**
- ❌ **MCP server** (uses Vercel AI SDK tool-calling instead)
- ❌ No managed/Cloud variant
- ❌ No paid tier (free forever, but also no commercial-grade support)
- ❌ No per-tenant rate limits (Arcjet is app-level)
- ❌ No agent-cost chargeback mechanism

**DeesseJS counter-message:** "NextForge is a free template you download once. DeesseJS is an agent system with per-tenant LLM metering, Stripe metered usage, and a managed Cloud — so you can charge your users for what your agents do. Free gets you features. Paid gets you a business model."

**Risk to NextForge:** Primary maintainer Hayden Bleasel moved from Vercel to OpenAI (LinkedIn, 2026). Vercel still owns the repo but the creator is now at a competitor. Future maintenance velocity is uncertain.

---

## §2 — The Competitive Comparison Table

> **Updated 2026-06-24:** NextForge column added. All NextForge cells verified via direct fetch.

| Feature | supastarter | ShipFast | MakerKit | SaasRock | TurboStarter | **NextForge** | DeesseJS |
|---|---|---|---|---|---|---|---|
| **Price (one-time)** | €349–€1,499 | $249–$349 | $299–$999 | $99–$999 | ~$299 ⚠️ | **Free (MIT)** | $249–$899 |
| **License** | Proprietary | Proprietary | Proprietary | Proprietary | Proprietary | **MIT** | Proprietary |
| **Framework** | Next.js | Next.js | Next.js | Remix | Next.js | **Next.js + Turborepo + Bun** | Next.js |
| **Vercel halo** | No | No | No | No | No | **YES (official)** | No |
| **Agentic primitives (tool-calling)** | Dev-side | None | Dev-side | None | Partial ⚠️ | **AI SDK + skill** | Built-in |
| **Per-tenant LLM metering** | No | No | No | No | No | **No** | **Yes** |
| **Usage-based billing (Stripe)** | Per-seat | Per-seat | Per-seat | Per-seat | No | **Subscription only** | **Per-seat + metered** |
| **Multi-tenancy** | Optional | Optional | Optional | Built-in | Optional | **Clerk orgs** | **Built-in** |
| **Free tier / Lite** | No | No | No | No | No | **Yes (whole product)** | Yes (Lite subset) |
| **Managed (Cloud)** | No | No | No | No | No | **No** | **Yes (M8+)** |
| **MCP server** | No | No | Yes | No | Yes | **No (AI SDK)** | **Yes** |
| **AGENTS.md / skill** | No | No | No | No | No | **Skill + rules** | **Yes** |
| **Per-tenant rate limits** | No | No | No | No | No | **App-level (Arcjet)** | **Per-tenant** |
| **Human-in-the-loop checkpoints** | No | No | No | No | No | **No** | **Yes** |
| **Agent-cost chargeback** | No | No | No | No | No | **No** | **Yes (Stripe metered)** |
| **GitHub stars** | n/a | n/a | n/a | n/a | n/a | **7,102** | n/a |
| **PH launches** | 2 | 5+ ⚠️ | 1 ⚠️ | 1 ⚠️ | Unknown | **0 (Vercel distribution)** | Planned |
| **/showcase page** | Yes | Unknown | Unknown | Yes | Unknown | **Demo apps** | Yes (M4) |
| **SEO comparison pages** | Yes | No | Yes ⚠️ | Unknown | No | **No** | Yes (M4) |

---

## §3 — The Positioning Space

### What's claimed

| Competitor | Primary claim |
|---|---|
| supastarter | "Ready for AI coding agents" — Cursor, Claude Code, Codex integration |
| MakerKit | "MCP server + AI agent rules" — dev-side AI |
| TurboStarter | "AI Kit: providers, tool calling, memory" — roadmap agentic |
| ShipFast | "Zero to launch fast" — no AI story |
| SaasRock | "25+ features, fully customizable" — no AI story |
| **NextForge** | **"Production-grade Turborepo template" + `npx skills add vercel/next-forge` (v6)** — comprehensiveness + agent-aware |

### What's NOT claimed (the open space) — UPDATED 2026-06-24

- **Agentic as a primary positioning** — NextForge now has agent-aware features but doesn't lead with them. The "your agents run the system" framing is still unclaimed.
- **Per-tenant LLM metering** — nobody ships it (NextForge confirmed: single `model: models.chat`)
- **Usage-based billing for agent costs** — nobody ships it (NextForge: subscription-only Stripe)
- **"Your agents are your developers"** — nobody says it
- **The "charge your users for what their agents do" mechanism** — nobody has it
- **`npx skills add <product>` for the agent meta-game** — NextForge is first; DeesseJS needs parity (see `../launch/npx-skills-parity-spec.md`)

### The one-line differentiation

> "All competitors — including NextForge — give you AI features. DeesseJS gives you an agent system that monetizes AI features per tenant."

---

## §4 — The Counter-Messages (Defensive Playbook)

When a buyer says they're looking at [competitor], here's what to say:

**"I'm looking at supastarter"**
→ "supastarter is great for developers who want Cursor and Claude Code integration. DeesseJS is for founders who want their agents to call the billing API directly. Different tools for different workflows — what are you optimizing for?"

**"I'm looking at ShipFast"**
→ "ShipFast is the fastest path to an MVP. DeesseJS is the template you grow into — especially when you want to charge your users per-token for what their agents do. What stage are you at?"

**"I'm looking at MakerKit"**
→ "MakerKit's MCP server is a smart move — it means their template is agent-aware. The gap is that there's no billing integration for agent costs. If you want to meter per-tenant LLM usage and charge it back, DeesseJS is the only option."

**"I'm looking at SaasRock"**
→ "SaasRock is the most customizable option — Remix, lots of knobs. The tradeoff is that you spend time configuring, not building. DeesseJS ships agent primitives pre-wired. Do you want to customize or do you want agents to build for you?"

**"I'm looking at TurboStarter"**
→ "TurboStarter has tool-calling in the roadmap. DeesseJS ships it today, with per-tenant metering and Stripe metered usage. What's your timeline?"

**"I'm looking at NextForge"**
→ "NextForge is a great free template — Vercel maintains it, Hayden Bleasel built it, and it ships comprehensive batteries. The gap is the agent system: no per-tenant LLM metering, no Stripe metered usage for agent costs, no tenant-aware tool-calling contract. If you want to charge your users for what their agents do, you need a system, not a template. That's DeesseJS."

**"NextForge is free — why pay for DeesseJS?"**
→ "NextForge is a one-time scaffold. DeesseJS is an agent system + a Cloud. The free template stops being free when you spend 3 months wiring Stripe metered usage, building a per-tenant metering dashboard, and operating your own auth/billing/database infrastructure. The paid version ships all of that wired, with a Cloud you can deploy to in one click."

**"Is NextForge going to add agentic features?"**
→ "Maybe. Vercel ships the AI SDK, and next-forge v6 added an agent skill (`npx skills add vercel/next-forge`). But 'agent skill' is not 'agent system' — the skill teaches your agent about next-forge architecture; it doesn't ship per-tenant metering or usage-based billing. Watch this space, but the wedge hasn't closed yet."

---

## §5 — What DeesseJS Must Ship to Back the Claims

### The minimum viable agentic claim (for PH Launch 1)

| Claim | Required proof |
|---|---|
| "Agents call deesse.auth.createUser()" | Working code snippet in AGENTS.md + MCP server wired |
| "Per-tenant LLM metering" | Dashboard screenshot showing tenant → cost |
| "Usage-based billing" | Stripe metered usage integration wired (even if not live-usage) |
| "Multi-step agent workflow" | One working demo agent in the repo |

### What NOT to claim (yet)

- "Ship faster than any competitor" — unquantified
- "Best AI integration" — subjective, attackable
- "Save X hours" — needs real data from founding members
- "The only template with agents" — technically SaasRock has agent-aware features ⚠️

---

## §6 — Decisions Needed

- [ ] **Counter-message review** — do these counter-messages feel honest and non-attacky?
- [ ] **Feature table accuracy** — some data is ⚠️ flagged as unverified. Need primary research on TurboStarter and SaasRock pricing/features.
- [ ] **"Only template" claim** — is "the only template with per-tenant LLM metering" defensible? Confirm no competitor ships it.
- [ ] **Competitive monitoring** — set up automated tracking for competitor blog posts, PH launches, pricing changes.
