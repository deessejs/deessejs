# DeesseJS — Landing Page

> **Status:** Three-phase launch — **v1 waitlist page ships now** (no product yet), **v2 full offer page ships at M4** when the agent workflow demo and the metering dashboard are visible, **v3 final structure** evolves post-launch as the product, customer base, and offering mature.
>
> **Date:** 2026-06-22
>
> **Research sources:**
> - [`offer-design-research.md`](./offer-design-research.md) — adversarial research, 5 HIGH CONFIDENCE confirmed findings. 14 surviving claims, 11 refuted.
>
> **The positioning:** No competitor owns "agentic" as primary positioning. supastarter and MakerKit mention AI coding agents, but as dev tooling — not as "your agents are your developers." DeesseJS can own this space if the claim is backed by real agent primitives (tool-calling, multi-step reasoning, per-tenant metering, human-in-the-loop) and one or two visible agent workflows shipped with the template.

---

## TL;DR — The positioning

> **"The SaaS template that never sleeps."**
>
> *"You stop being the developer. Your agents become the developers."*

**The three axes:**

| Axis | Framing |
|---|---|
| **What it is** | An agentic system your agents run on |
| **Who it's for** | Founders who want their agents to ship |
| **What you do** | You ask, they build |
| **The emotional payoff** | Stop hiring developers. Start asking your agents. |

**The headline candidates:**

- **Option A:** "The SaaS template that never sleeps."
- **Option B:** "Stop hiring developers. Start asking your agents."
- **Option C:** "You build the product. Your AI agents build the rest."

**Option A is recommended** — it's memorable, it implies the agentic system without stating it explicitly, and it's ownable. "Never sleeps" signals 24/7 agents, not just "AI features."

**Option B is the emotional punch** — use it in the sub-head or the founder note.

---

## §1 — The Agentic Positioning

### What "agentic" means here — and why it's the wedge

"Agentic" in DeesseJS means: **your AI agents are the executors, not the buyers.**

The template ships with primitives that let the buyer's agents:
- **Call tools** (auth, billing, storage, jobs, notifications, API)
- **Reason multi-step** (agent loops with checkpoints)
- **Operate per tenant** (per-tenant metering, per-tenant rate limits)
- **Get paid for** (usage-based billing via Stripe, per-tenant cost tracking)

In practice: the buyer's agent doesn't wire auth from scratch — it calls `deesse.auth.createUser()`. It doesn't build Stripe billing — it calls `deesse.billing.createSubscription()`. The system is already wired. The agent just asks.

### Why this is the wedge — and why no competitor owns it

| Competitor | AI story | Agentic story |
|---|---|---|
| **supastarter** | "Ready for Claude Code, Cursor, Codex" | Dev tooling for the developer — not agents running the system |
| **MakerKit** | MCP server + AI agent rules | Dev-side AI — not agent primitives that agents call |
| **ShipFast** | Zero native LLM modules | Not even on the map |
| **SaasRock** | Prompt Flow Builder, OpenAI-only | Rigid agents, Remix stack, not multi-step primitives |
| **TurboStarter** | "AI Kit: providers, tool calling, memory" | Tool calling exists, but no per-tenant metering, no billing integration |
| **Nexty** | Multi-modal demos | Showroom AI, not production agents |

**No competitor ships:**
- Per-tenant LLM cost tracking + token budgets
- Usage-based billing integration (Stripe metered usage)
- Agent loops with human-in-the-loop checkpoints
- Tool-calling against a complete wired system (not a demo)

**This is the wedge.** Not "we have AI" — but "your agents run on a complete, wired system and you can charge your users for their work."

### The claim — how to word it without overpromising

**Do say:** "DeesseJS gives your agents a complete wired system — auth, billing, storage, jobs, notifications, API — so your agents spend time building your product instead of wiring infrastructure."

**Don't say:** "Your agents build your entire SaaS." (Overpromise. The agents build features on top of a wired system — that's the honest version.)

**The honest headline:**

> "Your agents run on DeesseJS. Everything they need is already wired."

**The emotional headline:**

> "Stop hiring developers. Start asking your agents."

### What must ship to back this claim

The agentic positioning requires **visible proof**, not just primitives in the spec. At v2 launch (M4), the following must ship:

1. **One agent workflow example in the repo** — a documented, runnable agent that does something non-trivial (e.g., "create a billing subscription + send a welcome email + set up the first org" in one multi-step loop). This is the visual proof.

2. **The agent primitives visible in the docs** — a dedicated "Agents" section in Fumadocs showing: how to call tools, how to run agent loops, how to meter per-tenant costs.

3. **The per-tenant metering dashboard** — visible in the admin UI. The buyer sees their agents' LLM costs per tenant. This is the "charge your users" mechanism.

Without these three things, the agentic positioning is a tagline. With them, it's a product story.

### The three axes of the agentic positioning

**Axis 1 — "Without writing code"**
> You don't write code. You ask. The agents write the code.
- AGENTS.md shipped with the template
- AI agent rules for Cursor, Claude Code, Codex
- MCP server wired
- Tool-calling primitives for every surface

**Axis 2 — "Without assembling"**
> You don't wire auth + billing + jobs + storage + notifications. It's already done.
- Every feature ships, every feature wired
- Every feature deletable (modular contract)
- The system is complete before the agents start working

**Axis 3 — "Without limits"**
> You don't pay per agent, per call, per tenant. Pay once. Your agents run.
- Per-tenant LLM metering included
- Usage-based billing ready (Stripe metered usage)
- No per-seat agent cost
- Agents work across all apps and tenants

### The emotional payoff

The buyer doesn't think: "I'm buying a template."
The buyer thinks: "I'm hiring a team of agents that never sleep, never quit, and work for the price of one template."

> "The best developers don't work for salary. They work for electricity."

This is the line that converts.

---

## §2 — Three-phase launch: v1, v2, final

The site evolves across three phases. Each phase has a single goal and a single conversion metric.

### v1 — waitlist page (ships at M0/M1)

**Goal:** convert cold visitors to email addresses and validate the positioning before the product is built. No purchase buttons. No fake testimonials. No live demo.

**Why ship before the product:**
- SEO compounds from day one. New keyword clusters: "agentic SaaS template", "AI agents SaaS starter", "agents run your SaaS", "per-tenant LLM billing template". These are unclaimed.
- 500–1000 emails at launch = real PH traction + IH thread + design partners.
- The headline is testable. If "never sleeps" doesn't convert, better to know now than after M4.
- Cost is days, not weeks. <$50/mo all-in. The build ships in parallel.

**The test you're actually running:**
> Can the hero + subhead convert cold visitors to email at >5%?

If yes, v2 keeps the headline. If no, v2 pivots the copy before the build is visible.

### v2 — full offer page (ships at M4)

**Goal:** sell Founder Edition + founding-member licenses with the agent workflow demo, the metering dashboard screenshot, and real testimonials collected during v1.

**Why wait until M4:**
- The agentic positioning requires real proof. Shipping the full offer page before the demo exists would be vaporware.
- Founding-member testimonials need ~4-6 weeks of usage to be credible. v1 captures the cohort; v2 converts them.
- The metering dashboard screenshot has to be real, not mocked.

### v3 — final structure (post-launch mature, M8+)

**Goal:** convert with a deep, evidence-based marketing surface — homepage + dedicated showcase + comparison pages + case studies + changelog + blog. The product is real, customers exist, the offering has grown.

**Why this phase exists:**
- A single homepage can't carry 50 testimonials, 12 customer projects, 6 comparison pages, a changelog, and a content hub.
- Each piece of marketing has a different buyer intent — cold visitor, evaluator, comparison shopper, existing customer. Different pages serve different intents.
- SEO compounds further with dedicated keyword-targeted URLs.

**The trigger conditions to enter v3:**
- [ ] 50+ paying customers (proof for testimonials, case studies, showcase)
- [ ] Cloud beta is open or imminent (gate for `/cloud`)
- [ ] The offering has stabilized — no major pricing/tier changes in the next 90 days
- [ ] Content engine is producing ≥2 posts/month (gate for blog)

### What each phase looks like

| Element | v1 | v2 | v3 |
|---|---|---|---|
| Hero headline | ✓ | ✓ | ✓ |
| Tech stack badges | ✓ | ✓ | ✓ |
| **Interactive filetree (supastarter pattern)** | ✓ | ✓ | ✓ (evolved with drill-down) |
| Three axes | ✓ | ✓ | ✓ |
| Mechanism teaser (text + diagram) | ✓ | ✓ | ✓ |
| Architecture preview (package list) | ✓ | ✓ | ✓ |
| Pricing teaser (no buttons) | ✓ | — | — |
| **Waitlist CTA + Buyer's Guide** | ✓ | — | — |
| Live demo (screenshot / video) | — | ✓ | ✓ (multiple demos) |
| Pricing with buy buttons | — | ✓ | ✓ (or split to `/pricing`) |
| Founding-member offer ($99) | — | ✓ | ✓ (closed once 50 hit) |
| Testimonials (named, quantified) | — | ✓ | ✓ (deep case studies too) |
| Founder note (full) | — | ✓ | ✓ |
| FAQ | ✓ (lean) | ✓ (full) | ✓ (full) |
| **`/showcase` (customer projects)** | — | — | ✓ |
| **`/changelog`** | — | — | ✓ |
| **`/blog` or `/resources`** | — | — | ✓ |
| **`/customers/[slug]` case studies** | — | — | ✓ |
| **`/vs/[competitor]` comparison pages** | — | — | ✓ |
| **`/cloud` page** | — | — | ✓ (when beta opens) |
| **`/pricing` standalone** | — | — | ✓ (if offering grows) |
| **`/affiliates` program page** | — | — | ✓ (once proven) |

---

## §3 — Site structure: one marketing site that grows over time

The apps in `apps/` are **products and source code**, not marketing surfaces. The marketing site at `apps/web` is the only marketing surface, and it grows as the product matures.

### Why one site, not one page per app

- **Splits traffic.** Multiple product pages divide visitor attention across weaker conversion funnels. One focused page converts better.
- **Dilutes positioning.** The "agentic" claim is a single, sharp narrative. Fragmenting it across `/template` + `/lite` + `/cloud` weakens it.
- **Maintenance burden.** Three product pages = three sources of truth for "what DeesseJS is." Drift is inevitable.
- **Not the pattern.** supastarter, ShipFast, MakerKit, TurboStarter — all single-site. The "one product, one marketing site" pattern is industry default for a reason.

### The exception: `/cloud` gets its own page in v3

Cloud is the deliberate exception. It's a **different product**, not just a different tier:
- Different buyer (someone who doesn't want to self-host — often a non-technical founder or a team)
- Different value prop ("managed" vs. "self-hosted" — operational vs. capital expense)
- Different pricing model (likely usage-based at the cloud level, not one-time license)
- Different sales motion (free trial + usage, not one-time checkout)

Trying to sell Cloud from the same homepage as the template creates cognitive overload and weakens both. `/cloud` becomes a real product page in v3, gated by the beta opening.

### What each app is, on the marketing surface

| App | Role | v1 / v2 | v3 |
|---|---|---|---|
| `apps/web` | The marketing site itself | This IS the homepage. `deessejs.com/` | Same — still the homepage. Other pages added in `apps/web` (Next.js routing). |
| `apps/template` | The main paid product | Sold from the homepage. Showcased via the interactive filetree. | Same. The showcase on `/showcase` includes template-built projects. |
| `apps/lite` | Free lead magnet | A download link in the nav or footer. | Same — plus richer "What is Lite" callout. |
| `apps/cloud` | Managed variant (private beta 2026-Q3) | "Coming Q3 2026" line in footer. | Full `/cloud` page when beta opens. See trigger conditions in §2. |

---

## §4 — v1 page structure (waitlist-first, ships at M0/M1)

Single-page site at `deessejs.com` (rendered by `apps/web`). No CMS, no blog, no auth. Lean — every section exists to support the waitlist conversion.

```
[Nav: Logo · Pricing · Docs · Founder Edition]

[Hero]
  Headline (Option A): "The SaaS template that never sleeps."
  Sub-head: "Every surface your agents need — auth, billing, jobs, storage, notifications,
             API — is already wired. Your agents don't start from scratch.
             They start from a complete system."
  CTA primary: "Join the waitlist →" (email capture)
  CTA secondary: "See the agent primitives →" (anchor to Fumadocs /agents)
  No pricing in v1 hero. No strikethrough.

[Tech stack badges]
  One row of small monospaced chips:
  Next.js · TypeScript · Tailwind · Better Auth · Prisma · Drizzle · Stripe ·
  Trigger.dev · Cloudflare R2 · Upstash Realtime · oRPC · Fumadocs
  These are the visible primitives. They back the agentic claim.

[★ The interactive filetree — supastarter pattern ★]
  The visual centerpiece. Sits between tech stack badges and the three axes.
  Monospaced tree of the monorepo:
    apps/
      template/  — the main SaaS template
      cloud/     — managed variant (private beta Q3 2026)
      lite/      — free lead magnet
      docs/      — Fumadocs site
      web/       — this marketing site
    packages/
      auth/      — Better Auth wiring
      api/       — oRPC server + auto-generated SDK
      billing/   — Stripe, per-seat + metered usage
      database/  — Prisma + Drizzle schemas
      storage/   — Cloudflare R2 client
      jobs/      — Trigger.dev + cron + queues
      notifications/ — Upstash Realtime
      ui/        — shared component library
      i18n/      — translations + locale routing
      ai/        — agent primitives (tool-calling, loops, metering)
    Root files:
      AGENTS.md · pnpm-workspace.yaml · turbo.json · oxlint.json ·
      oxfmt.json · CHANGELOG.md · README.md · tsconfig.json
  Each node: hover/click reveals a description + paired code panel.
  Example: hovering `packages/billing/` shows "Stripe, per-seat + metered usage"
  with a paired code snippet of `deesse.billing.createSubscription()`.
  Caption beneath: "Hover or click items to learn more, or [explore project structure →](/docs/codebase/structure)."

  Why this section earns its hero-adjacent placement:
  - It's the proof that backs "without assembling" — the system is visibly complete.
  - It differentiates from supastarter / ShipFast / MakerKit on the agentic primitives (`packages/ai/`).
  - It's interactive — visitors spend 30-90 seconds on it. Time-on-page is a leading indicator for conversion.

[The three axes]
  Three short blurbs side by side:
  - Without writing code — You ask. Your agents write.
  - Without assembling — Auth, billing, jobs, storage, notifications, API. Already wired.
  - Without limits — Per-tenant metering + usage-based billing. Charge your users for what their agents do.

[The mechanism teaser — "Charge your users"]
  The per-tenant metering + usage-based billing mechanism, framed as the buyer's revenue lever.
  Diagram or rough mockup of the metering dashboard.
  This section anchors the wedge: this is what no competitor ships.

[Pricing teaser]
  The 3 tiers shown for anchor + qualification:
  Starter $399 · Pro $599 · Team $999
  No buy buttons. Caption: "Founder pricing for the first 100 waitlist members."
  Link anchor to the v2 launch section.

[Waitlist CTA + Buyer's Guide]
  Primary form: email + name + project stage.
  Secondary: "Get the 4-page preview of the SaaS Template Buyer's Guide 2026"
  (email-gated download; full 30-page report at launch).

[Footer]
  Founder photo + bio + LinkedIn + GitHub
  Public roadmap link
  Try Lite → github.com/deessejs/lite
  "DeesseJS Cloud — private beta Q3 2026"
  Email · Twitter · Indie Hackers
```

**No testimonials. No live demo. No buy buttons. No fake waitlist count.**

---

## §5 — v2 page structure (full offer, ships at M4)

v2 = v1 + the sections below. The transition is mechanical — same domain, sections added in order.

```
[Add: Live demo — One agent workflow]
  "Watch an agent set up billing, send a welcome email, and create the first org —
   in one multi-step loop."
  [Play button / screenshot / code block]

[Add: Build vs. buy — the new framing]
  OLD: "You vs. 3-6 months of wiring."
  NEW: "Your agents vs. wiring everything from scratch."
  Mini-table: "Your agent calls → deesse.auth.createUser()" vs.
             "Developer wires auth: 2-4 weeks"
  Anchor: "$249 vs. 500+ hours of developer time."

[Add: Founding member offer]
  First 50 founders: $99 lifetime, lifetime updates included.
  Limited to 50. Visible counter.
  See §8 for full mechanics.

[Add: Pricing (with buy buttons)]
  3 tiers, strikethrough + "Most Popular" on Pro.
  Founder rate: ~~$399~~ → $249 / ~~$599~~ → $499 / ~~$999~~ → $899.
  14-day money-back guarantee in a visible guarantee box.
  "All features at every tier. No feature-gating."

[Add: Bonuses]
  3 concrete bonuses: Figma UI Kit, Private Discord, AI Agent Workflow Library.
  The AI Agent Workflow Library = the live demo agent workflow + prompt templates.

[Add: Testimonials]
  5-7 named testimonials with: full name, company, specific quantified outcome, link.
  Target format: "[Name], [Role], [outcome]" — e.g., "My support agent handles tier-1 tickets automatically. I haven't touched billing code in 3 months."
  Sourcing: see §9 (build-in-public sponsorship) + organic waitlist follow-ups.

[Add: Founder note]
  5-8 lines. Tone: "I'm not building a template. I'm building a system
  where you stop being the developer and start being the architect."
  Link to the public roadmap + the agent primitives docs.
```

### The v2 filetree decision

The interactive filetree from v1 stays on the homepage in v2. It does NOT move to a `/template` page.

Rationale: the filetree is the strongest single-section conversion asset we have (interactive, time-on-page driver, agentic-claim proof). Moving it to a separate page trades homepage conversion for product-page depth. Don't make that trade.

If the v2 homepage gets too long, the trim order is:
1. Drop "Build vs. buy" section first (lowest unique value)
2. Then collapse the three axes into one line in the sub-head
3. Then move the mechanism teaser into a Fumadocs sub-page

Filetree stays until the bitter end.

---

## §6 — v3 final structure (post-launch mature, M8+)

The marketing surface expands as the offering grows. The **homepage stays focused on conversion** — it does not become a hub. New pages serve different buyer intents and capture different keywords.

### The page set

```
deessejs.com/
├── /                  Homepage — same conversion funnel as v2, evolved
│                       (live waitlist count replaced with real customer count,
│                        founding-member section retired once 50 hit,
│                        testimonial carousel updated with new case studies)
│
├── /pricing           (Optional) Standalone pricing page if offering grows
│                       beyond 3 tiers (e.g., adding Cloud SKUs, enterprise,
│                       annual plans). Splits out when homepage pricing is too cramped.
│
├── /showcase          Public gallery of customer projects built on DeesseJS.
│                       Grid of project screenshots, name, one-liner, link.
│                       supastarter pattern. CTA: "View project →"
│
├── /changelog         Public, automated log of updates.
│                       Builds trust through transparency — "we ship every week."
│                       Each entry: version, date, what's new, screenshot if relevant.
│
├── /blog              Content hub. Articles on agentic SaaS, building with DeesseJS,
│                       customer stories. 2+ posts/month to keep SEO fresh.
│                       Cross-link heavily to docs + showcase + comparison pages.
│
├── /customers/[slug]  Deep-dive case studies.
│                       Per customer: project URL, what they built, screenshots,
│                       metrics (cost saved, time to ship, MRR), named quote.
│                       Sourced from build-in-public sponsorships + organic.
│
├── /vs/[competitor]   Comparison pages. SEO play + buyer self-qualification.
│                       /vs/shipfast, /vs/supastarter, /vs/makerkit, /vs/turbostarter.
│                       Honest framing: "Here's what they do well. Here's what we do."
│
├── /cloud             Full Cloud product page (only when beta opens).
│                       Different buyer, different value prop, different sales motion.
│                       See §3 for trigger conditions.
│
├── /affiliates        (Once proven) Affiliate / partner program.
│                       Recurring commission for referred buyers. 30% default.
│
├── /docs              Fumadocs — fully built out.
│                       Includes: agent primitives guide, public roadmap,
│                       AGENTS.md, metering + billing deep-dive.
│
└── /lite              (No marketing page — footer link to github.com/deessejs/lite)
```

### What the homepage looks like in v3

The homepage stays a conversion machine. It does NOT become a hub of links.

```
[Nav: Logo · Pricing · Showcase · Blog · Docs · Cloud (if beta open)]

[Hero]
  Same headline (Option A) + sub-head
  New CTA copy: "Get DeesseJS →" (replaces "Join the waitlist")
  Trust signal in hero: "Trusted by 1,200+ founders shipping agentic SaaS."
                       (real number, real customers)

[Tech stack badges] — same as v1

[★ Interactive filetree — supastarter pattern, evolved ★]
  In v3, the filetree gains drill-down:
  - Hover → description + code panel (same as v1/v2)
  - Click → navigates to `/docs/codebase/structure` for the full tree
  - Deeper nodes (`packages/ai/agents.ts`) link to `/docs/agents/[tool-name]`
  - The filetree becomes a navigation hub, not just a visualization

[Three axes] — same

[Mechanism teaser] — same, but the dashboard mockup becomes a real screenshot

[Live demo — multiple in v3]
  Carousel of 2-3 agent workflows, not just one.
  Each: title, screenshot, link to the source code in the repo.

[Testimonials carousel] — replaces the founding-member block
  5-7 named testimonials, real customers, quantified outcomes
  Sourced from §8 (founding members) + §9 (sponsored builders) + organic

[Showcase teaser]
  "See what DeesseJS customers are building →"
  3-up grid of customer projects (links to /showcase for the full grid)

[Final CTA + Footer]
  Buy button (no waitlist anymore)
  Footer: nav, founder bio, links to all v3 pages
```

### Why the homepage stays focused

The single biggest mistake at this stage is letting the homepage become a directory of links. Visitors arrive with one question: *"should I buy this?"* A homepage full of "See our blog / Read our docs / Browse showcase / Compare us to X" forces them to choose. They leave.

The homepage stays a **yes/no decision page**. Everything else gets a URL and ranks for its own keywords.

### The trim order when the v3 homepage gets too long

If the v3 homepage exceeds ~6 viewport heights, trim in this order:
1. Drop the "Build vs. buy" section first (already dropped in v2 trim order)
2. Collapse the three axes into a single line in the sub-head
3. Move the mechanism teaser to `/docs/agents/metering` and link from the hero
4. Replace the showcase teaser with a single project screenshot + "See more → /showcase"
5. Drop the testimonials carousel in favor of a single hero testimonial

Filetree and the live demo stay until the bitter end. Those are the conversion anchors.

---

## §7 — The copy (drafted)

### Hero headline (Option A — recommended)

> **The SaaS template that never sleeps.**

### Hero headline (Option B — emotional punch)

> **Stop hiring developers. Start asking your agents.**

### Hero sub-headline

> Every surface your agents need — auth, billing, jobs, storage, notifications, API — is already wired. Your agents don't start from scratch. They start from a complete system.

> DeesseJS gives you the primitives: tool-calling against every surface, multi-step agent loops, per-tenant metering, and usage-based billing. Your agents run. You ask.

### Tech stack badges (v1 + v2 + v3)

```
Next.js · TypeScript · Tailwind · Better Auth · Prisma · Drizzle · Stripe ·
Trigger.dev · Cloudflare R2 · Upstash Realtime · oRPC · Fumadocs
```

### The three axes

> **Without writing code.** You ask. Your agents write.
>
> **Without assembling.** Auth, billing, jobs, storage, notifications, API — already wired.
>
> **Without limits.** Per-tenant metering + usage-based billing. Charge your users for what their agents do.

### The filetree caption (supastarter pattern)

> Hover or click items to learn more, or [explore project structure →](/docs/codebase/structure).

### The mechanism teaser

> **Charge your users for what their agents do.**
>
> DeesseJS is the only template that ships per-tenant LLM metering + Stripe metered usage, wired. Your agents generate cost per tenant. You see it in the dashboard. You charge it back.
>
> No competitor ships this.

### The agentic system section (code-style framing)

> **Your agents run on DeesseJS. Here's everything wired for them:**
>
> `deesse.auth.createUser()` → Better Auth, email + OAuth + 2FA + passkeys
> `deesse.billing.createSubscription()` → Stripe, per-seat, usage-based
> `deesse.jobs.enqueue()` → Trigger.dev, cron, retries, queues
> `deesse.storage.upload()` → Cloudflare R2, no egress
> `deesse.notifications.send()` → Upstash Realtime, real-time bell
> `deesse.api.call()` → Auto-generated SDK, typed, OpenAPI-native
>
> Every surface. Every tool. Already wired.

### Live demo section (v2, M4 milestone — v3 evolves to a carousel)

> **Watch an agent do this:**
> 1. Create a new user
> 2. Set up a Stripe subscription
> 3. Send a welcome email
> 4. Create the first org
> 5. Enqueue a background job
>
> One multi-step loop. No manual wiring. Just the agent asking DeesseJS.

[Code block or screenshot showing the agent workflow]

### Founder note (write personally — this is the highest-identity section, v2+)

> I spent the last few months reading every Product Hunt comment, Reddit thread, and Twitter argument about Next.js SaaS templates. The same complaint kept showing up: templates are either too thin (you outgrow them in 30 days) or too heavy (you spend weeks ripping out the parts you don't want).
>
> But the real shift isn't the template. It's the agents.
>
> DeesseJS is the system your AI agents run on. Every surface is wired. Every tool is callable. Your agents don't start from scratch — they start from a complete system. And you stop being the developer.
>
> You become the architect.
>
> The [agent primitives docs] and the [public roadmap] are public. The build starts this month. If you want to be one of the first 100 founders to run your agents on DeesseJS — [lock in the founder rate].

### Pricing (v2, with buy buttons)

| Tier | Founder Rate | Regular | Most Popular | What your agents get |
|---|---|---|---|---|
| **Starter** | ~~$399~~ **$249** | $399 | | Core: auth, billing, jobs, API, CLI, SDK |
| **Pro** | ~~$599~~ **$499** | $599 | ★ Most Popular | + Admin, blog, docs, i18n, E2E, Figma UI Kit |
| **Team** | ~~$999~~ **$899** | $999 | | + White-label, priority support, Discord, AI Agent Workflow Library, 1 onboarding session |

**The guarantee box:**
> "14-day money-back guarantee. If your agents don't save you 3 months of development work in the first 14 days, email us for a full refund — no questions asked."

**The key framing:** All features at every tier. The gates are commercial, not feature-gated. Your agents get the full system at every tier.

**Bonuses (3 maximum):**
1. **Figma UI Kit** — "Included free (worth $99)"
2. **Private Discord** — "Join 500+ indie founders running agents on their SaaS"
3. **AI Agent Workflow Library** — "Pre-built agent workflows for support, billing recovery, onboarding. (worth $200+)" — ships with the live demo agent

### FAQ (v1: lean, v2 + v3: full)

**v1 FAQ (3 questions):**

**Q: When does it ship?**
A: The agent primitives ship at M4 (week 6 of the build). v1 ships in approximately 10 weeks. Waitlist members get day-1 access and an invite to the agent workflow demo before launch.

**Q: Is this vaporware?**
A: No. The spec is locked, the agent primitives are documented, and the first agent workflow is being built right now. The public roadmap is open.

**Q: What does "agentic" mean in DeesseJS?**
A: Your AI agents are the executors, not just the users. Every surface in DeesseJS has a tool your agent calls: auth, billing, storage, jobs, notifications, API. Your agents run multi-step workflows against a complete, wired system — not a blank canvas.

**v2 / v3 FAQ adds:**

**Q: How is this different from supastarter or MakerKit?**
A: They optimize AI for the developer — Claude Code, Cursor, Codex integration. DeesseJS optimizes the system for AI agents. Your agents don't just help you code — they run on DeesseJS, call the tools directly, and build your product while you sleep.

**Q: What if DeesseJS doesn't work for my project?**
A: 14-day money-back guarantee — no questions asked. If your agents don't save you 3 months of development work in the first 14 days, email us for a full refund.

**Q: What does "Founder Edition" include?**
A: The same DeesseJS as every buyer — full source code, all agent primitives, all features. The difference is:
> - Founder rate locked at $249/$499/$899 (regular price: $399/$599/$999 after July 31, 2026)
> - Day-1 access + live agent workflow demo before launch
> - 14-day money-back guarantee
> - A direct line to the founder for the first 90 days

**Q: Do I need to know how to prompt my agents?**
A: You need to know what you want. The prompts and workflows are in the AI Agent Workflow Library. Your agents handle the implementation.

**Q: Is there a free version?**
A: Yes — DeesseJS Lite. It's an open-source subset of the template, free to download, ships with auth + billing + the agent primitives. Try it before you buy the full template. → github.com/deessejs/lite

**Q: What about DeesseJS Cloud?**
A: Coming Q3 2026. It's the managed variant — your agents run on infrastructure we operate. Private beta opens before public launch. Join the waitlist to be notified.

---

## §8 — Founding member program ($99 / capped at 50)

The founding-member offer sits alongside the 3-tier Founder Edition. It solves a specific problem: getting credible testimonials before the product is built, without giving the product away for free.

### The mechanics

- **Price:** $99 one-time, lifetime updates included.
- **Cap:** first **50 founding members**. Visible counter on the page.
- **Eligibility:** anyone on the waitlist, first-come-first-served. (Waitlist signups get a 48-hour head start before the offer is public.)
- **What they get:**
  - Full DeesseJS source code (same as $249 Starter tier — pricing is a discount, not a feature cut)
  - All agent primitives
  - All future updates, lifetime
  - Name listed as founding member (optional, opt-in)
  - Same 14-day money-back guarantee as the regular tiers
- **What they don't get:**
  - Pro features (admin, blog, docs, i18n, E2E, Figma UI Kit) — those are the $499 tier
  - Team features (white-label, priority support, Discord, AI Agent Workflow Library)
  - Upgrade path: founding members can pay the difference to move up tiers

### Why this works

- **Paid → invested → credible testimonials.** A testimonial from a $99 buyer answers "is this worth it?" with conviction. A testimonial from a free user doesn't move the conversion needle.
- **Scarcity without lying.** Real counter, real cap, no fake urgency.
- **Fits the Apple positioning.** $99 is still a price, still a gate. Not a free tier.
- **Cash + signal together.** ~$5K cash + testimonials worth more than another $10K of ad spend in conversion lift.
- **Upgrade path is open.** Founding members can move up; they're not trapped at the bottom.

### The launch sequence

1. **v1 ships** (M0/M1) — waitlist only. Founding-member offer not announced.
2. **M3** — waitlist members get a private email: "The first 50 founding-member licenses go on sale in 48 hours. You'll have first access."
3. **M3+48h** — founding-member offer goes public. Counter live. Cap enforced.
4. **M4** — v2 ships. Founding-member testimonials start collecting.
5. **Once 50 hit** — founding-member block retires from the homepage. Replaced with a curated testimonial carousel.

---

## §9 — Build-in-public sponsorship program

The credibility layer on top of the founding-member volume layer. 3-5 free licenses to creators who deliver a public case study.

### The mechanics

- **License type:** free Team tier ($999 value, all features), lifetime.
- **Cap:** 3-5 sponsorships per launch.
- **Selection criteria:**
  - Audience in the indie hacker / SaaS founder / AI agent space (YouTube, X, blog, newsletter)
  - Documented history of building in public
  - Agreement to deliver a public case study within 90 days of access
- **Deliverable (the contract):**
  - One long-form post or video: "I shipped X on DeesseJS, here's what happened"
  - Real project, real metrics, real screenshot of the metering dashboard
  - Posted publicly, with no editorial control from DeesseJS
- **What they don't get:**
  - Cash payment
  - Equity
  - Guaranteed placement on the testimonials page (though their case study may be linked if relevant)

### Why this works

- Each license produces a testimonial **and** distribution in one shot.
- Better ROI than paid ads at this stage — content compounds.
- Filters to builders serious enough to ship something, not tire-kickers.
- "Sponsored builder" reads as a deliberate program, not "free stuff." Different positioning from a free tier.

### The outreach

Identify 10-15 candidates. Approach with a short email:

> Subject: Build something with DeesseJS, get a free Team license + we sponsor the case study
>
> I'm building DeesseJS — a Next.js SaaS template where your AI agents are the developers, not you. It's at the agent-primitives milestone right now and I'd like 3-5 builders to use it for free in exchange for a public case study.
>
> What you get: full Team license ($999 value), lifetime updates, direct line to me.
> What I get: a real case study — what you built, what worked, what didn't, real metrics.
> Editorial control: none. Your honest writeup.
>
> If you're interested, reply with: what you'd build, where your audience is, and your timeline.
>
> — [Founder name]

### Sourcing channels

- Indie Hackers top contributors
- Twitter / X AI agent builders with 1K-50K followers
- YouTube "build in public" creators
- Newsletter writers in the SaaS / agent space
- Hacker News contributors with shipping history

---

## §10 — The 3 content pillars for SEO (agentic keywords)

To own the "agentic SaaS template" space, publish these during v1:

1. **"What 'agentic' actually means for a SaaS starter template"** (week 1)
   → Defines the term, links to the agent primitives docs, drives "agentic SaaS template" keyword

2. **"How to run a multi-step agent workflow on DeesseJS"** (week 2-3)
   → Code walkthrough of the demo agent workflow, links to the live demo

3. **"AI agents for indie founders: from prompt to production SaaS"** (week 4)
   → The buyer-voice angle: how indie founders are using agents to ship without developers

### v3 content expansion

When v3 lands, the content pillars extend:
- **Comparison content** for `/vs/[competitor]` pages
- **Customer stories** for `/customers/[slug]` case studies (drawn from founding members + sponsored builders)
- **Showcase content** — short posts on each new customer project
- **Changelog announcements** — public, automated, linkable

---

## §11 — What NOT to ship (anti-patterns)

From [`offer-design-research.md`](./offer-design-research.md) plus the v1/v2/v3 split:

- ❌ **No countdown timer.** Savvy developers check the page the next day.
- ❌ **No "coming soon" framing.** Frame as "Founder Edition."
- ❌ **No vague social proof.** Every testimonial: full name + company + quantified outcome.
- ❌ **No "notify me" as the only CTA.** Give value first.
- ❌ **No payment plans.** Zero competitors offer them.
- ❌ **No "unlimited" without fair-use disclosure.**
- ❌ **No inflated "hours saved" estimates.** Present as conservative estimates.
- ❌ **No fabricated strikethrough prices.**
- ❌ **No "14-day guarantee" without honoring it.**
- ❌ **No "agents build your entire SaaS" claim.** The honest claim is: "agents build features on a wired system."
- ❌ **No "Lock in founder rate" CTA before the product exists.** It pre-commits you to a delivery date. v1 ships waitlist-only.
- ❌ **No fake waitlist count.** "247 founders" placeholder trains visitors to distrust the bar later.
- ❌ **No buy buttons on v1.** No testimonials, no live demo, no pricing buttons. v1 is waitlist + lead magnet only.
- ❌ **No free tier as a permanent part of the ladder.** Founding members ($99 paid) and sponsored builders (case study in exchange) are not a free tier — they're deliberate, capped programs with a deliverable.
- ❌ **No agentic positioning without the agent workflow demo.** The demo is the proof. Don't lead with the claim before the proof exists (this is what gates v2 at M4).
- ❌ **No per-app marketing pages in v1/v2.** No `/template`, `/lite`, or `/cloud` page until cloud is in beta. One homepage, one conversion funnel.
- ❌ **No homepage-as-hub in v3.** The homepage stays a yes/no decision page. Everything else gets a URL and ranks for its own keywords.
- ❌ **No `/cloud` page before beta opens.** Premature pages for unavailable products train visitors to distrust the navigation.

---

## §12 — Decisions needed

### v1 decisions (ship now)

- [ ] **Page builder** — Next.js (consistent with `apps/web`) vs. Framer vs. Carrd.
- [ ] **Email service** — Resend Audiences (free up to 3K/mo) vs. Loops vs. ConvertKit.
- [ ] **Waitlist incentive** — the Buyer's Guide 4-page preview as the secondary CTA. Confirmed?
- [ ] **Domain ownership** — is `deessejs.com` available?
- [ ] **v1 hero CTA copy** — "Join the waitlist" + "See the agent primitives →" — final wording.
- [ ] **Filetree implementation** — interactive tree component (build in-house) vs. static code block + hover annotations. Build in-house is the supastarter pattern.
- [ ] **Tech stack badges** — confirmed list of 12 chips in §7.

### v2 decisions (ship at M4)

- [ ] **Founding member cap** — 50 confirmed, or different number?
- [ ] **Founding member launch sequence** — 48-hour waitlist head start before public, confirmed?
- [ ] **Sponsorship outreach list** — 10-15 candidates identified by M3.
- [ ] **Live demo script** — what does the M4 demo show? One concrete example needed.
- [ ] **Guarantee wording** — "If your agents don't save you 3 months..." is the right framing.
- [ ] **Pricing** — $249/$499/$899 founder rate, $399/$599/$999 post-launch. Confirmed.
- [ ] **July 31, 2026 deadline** — must be real. Post-launch regular pricing begins.
- [ ] **Testimonial collection** — pre-launch email sequence to founding members + organic waitlist follow-ups.
- [ ] **`/cloud` page trigger** — confirm the four conditions in §3 are the gate for when the page ships.

### v3 decisions (post-launch, M8+)

- [ ] **Trigger conditions for entering v3** — all four checkboxes in §2 are met before the site expands.
- [ ] **Pricing page split** — at what point does pricing leave the homepage for `/pricing`? Decide when the offering exceeds 3 tiers.
- [ ] **Showcase cadence** — how many new showcase entries per quarter. 1/month is the floor.
- [ ] **Comparison pages priority order** — which competitors get `/vs/` pages first. Recommended order: supastarter, ShipFast, MakerKit, TurboStarter.
- [ ] **Changelog automation** — git-based auto-generation vs. manual. Manual is fine until volume exceeds 4 entries/month.
- [ ] **Blog cadence** — 2 posts/month minimum. Decide whether to host on `/blog` or use a substack/external newsletter.
- [ ] **Affiliate program timing** — only after 100+ paying customers and ≥3 months of post-launch retention data.

---

## Cross-references

- [`offer-design-research.md`](./offer-design-research.md) — adversarial research, 14 surviving claims, 11 refuted. Primary source for the offer mechanics (guarantee, pricing, bonuses, urgency).
- `../launch/product-hunt-launch.md` — PH launch playbook
- `../launch/seo-content-strategy.md` — SEO and content strategy
- `../launch/distribution-playbook.md` — master distribution playbook
- `../social/social-media-strategy.md` — social channels strategy (with research gaps)
- `../research/competitive-analysis.md` — competitive analysis
- `../../apps/web/` — the marketing site Next.js app
- `../../apps/template/` — the main paid product
- `../../apps/lite/` — the free lead magnet
- `../../apps/cloud/` — the managed variant
