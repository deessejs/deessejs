# DeesseJS — SEO & Content Strategy

> **Status:** Draft v1. Based on adversarial competitor research (2026-06-22) + supastarter blog analysis.
>
> **Confirmed sources:** supastarter.dev/blog, supastarter.dev/supastarter-vs-shipfast, supastarter.dev/supastarter-vs-makerkit, makerkit.dev/blog, saasrock.com/blog.
>
> **Coverage:** Comparison pages (strong), blog keyword targeting (medium), content pillars (confirmed). Internal linking patterns (weak — from single competitor).

---

## TL;DR

SEO has two confirmed plays for DeesseJS:

1. **Comparison pages** at `/vs/supastarter`, `/vs/shipfast`, `/vs/makerkit` — capture decision-stage buyers searching for competitors. High intent, moderate volume.

2. **"Agentic SaaS template" cluster** — own this keyword before anyone else does. No competitor owns it yet. Volume is low-medium but growing.

The 3 content pillars (week 1-4) seed the cluster. Comparison pages launch at M4 with PH1. `/showcase` is the social proof anchor for all SEO content.

---

## §1 — The Comparison Page Playbook

### The confirmed pattern (supastarter)

supastarter.dev ships dedicated comparison pages:
- `/supastarter-vs-shipfast`
- `/supastarter-vs-makerkit`

Each page structure:
1. **Headline** — keyword-rich, e.g. "supastarter vs. ShipFast: which SaaS template wins in 2026?"
2. **Feature comparison table** — objective, no disparagement
3. **"Who should choose [X]"** — honest, specific use cases
4. **FAQ section** — the 5 most common questions about the comparison
5. **Internal links** — to main product, pricing, docs

### DeesseJS comparison page priority order

**⚠️ UPDATED 2026-06-24:** NextForge (vercel/next-forge, MIT, free) is now the default Google result for "Next.js SaaS template". `/vs/next-forge` jumps to #1 priority — anyone comparing free templates to paid systems is high-intent traffic.

| Priority | Page | Why |
|---|---|---|
| **1** | `/vs/next-forge` | **NEW #1.** Default search result, Vercel halo, free/OSS comparison captures high-intent buyers weighing "free vs paid" |
| **2** | `/vs/supastarter` | Highest brand awareness in paid tier, but second to NextForge for actual search traffic |
| **3** | `/vs/shipfast` | Second most searched paid competitor, very different positioning (no agentic) |
| **4** | `/vs/makerkit` | AI-adjacent but not agentic, MCP server as differentiator |
| **5** | `/vs/turbostarter` | AI tools in roadmap but no billing integration |
| **6** | `/vs/saasrock` | Remix stack, different audience |

### The comparison page template

```markdown
# [Product A] vs. [Product B]: Which SaaS template should you choose in 2026?

## Overview
[2-3 sentences: what each product is, target audience]

## Feature comparison

| Feature | [Product A] | [Product B] | DeesseJS |
|---|---|---|---|
| AI agents as developers | ✓ | ✗ | ✓ (proprietary) |
| Per-tenant LLM metering | ✗ | ✗ | ✓ |
| Usage-based billing | ✗ | ✗ | ✓ |
| Free tier | ✓ | ✓ | Lite (open-source) |
| Multi-tenant architecture | Optional | Optional | Built-in |
| Price (one-time) | $X | $X | $249–$899 |

## Who should choose [Product A]
[Specific use case, honest]

## Who should choose [Product B]
[Specific use case, honest]

## Who should choose DeesseJS
[Agentic thesis — "you want your AI agents to run the system, not just help you code"]

## FAQ
Q: Does [Product A] support AI agents?
Q: What's the main difference between [Product A] and DeesseJS?
Q: Can I migrate from [Product A] to DeesseJS?
Q: What does "agentic" mean in DeesseJS?
Q: Is there a free version of DeesseJS?
```

### Honest framing rules

- **Never disparage competitors.** "ShipFast is great for..." not "ShipFast lacks..."
- **Always acknowledge where competitors win.** Authenticity builds trust.
- **Frame DeesseJS's advantages as a category difference**, not a feature war. "No competitor ships per-tenant LLM metering" is stronger than "we have more features."
- **Link generously to competitor pages** — it signals confidence, not weakness.

---

## §2 — The "Agentic SaaS Template" Keyword Cluster

### The opportunity

No competitor owns "agentic SaaS template" or "AI agents as developers" as a primary keyword. This cluster is unclaimed territory.

The window to own it: now, before supastarter or MakerKit pivots to agentic positioning.

### The keyword cluster

```
Primary (own it):
  "agentic SaaS template"
  "AI agents SaaS starter"

Secondary (compete):
  "per-tenant LLM billing template"
  "SaaS template for AI agents"
  "multi-tenant metering"

Tertiary (top of funnel):
  "build SaaS without developers"
  "ship SaaS with AI agents"
  "indie hacker AI tools"
```

### Content mapping

| Keyword | Content type | Timing | Links to |
|---|---|---|---|
| "agentic SaaS template" | Pillar article: "What 'agentic' means for a SaaS template" | Week 1 | /docs/agents, comparison pages |
| "AI agents SaaS starter" | Comparison page: "Best AI agents SaaS templates" | Week 2 | /vs/supastarter, /vs/makerkit |
| "per-tenant LLM billing" | Technical deep-dive: how metering works | Week 3 | /docs/billing, /docs/agents |
| "build SaaS without developers" | Buyer-voice article: indie founder angle | Week 4 | homepage, pricing |
| "DeesseJS review" | Launched from founding member testimonials | M4+ | /showcase, PH launch |

---

## §3 — The 3 Content Pillars (v1 Launch)

*These are the first 3 pieces of content, published during v1 (weeks 1-4).*

### Pillar 1 — "What 'agentic' actually means for a SaaS starter template"
**When:** Week 1 (v1 homepage ships)
**Keywords:** "agentic SaaS template", "what is agentic AI"
**Goal:** Define the term. Own the definition. Become the reference.
**Format:** 1500-2000 word pillar article
**Structure:**
1. What "agentic" means in software (beyond the buzzword)
2. The difference between "AI-assisted coding" and "AI agents as developers"
3. What a template with real agent primitives looks like
4. The business case for agentic SaaS (time to market, cost, scale)
5. How DeesseJS implements agentic primitives
**CTA:** "See the agent primitives →" → /docs/agents

### Pillar 2 — "How to run a multi-step agent workflow on DeesseJS"
**When:** Week 2-3 (before PH Launch 1)
**Keywords:** "agent workflow SaaS", "multi-step AI agent", "agentic template"
**Goal:** Show the code. Make it actionable. Prove the agentic claim.
**Format:** Technical tutorial, 2000-2500 words + code blocks
**Structure:**
1. What a multi-step agent loop looks like
2. The DeesseJS agent primitives (tool-calling, checkpoints, metering)
3. Step-by-step: build a billing + onboarding agent
4. How to monitor agent costs per tenant
5. Next steps: customize the workflow
**CTA:** "Try the live demo →" → demo URL

### Pillar 3 — "AI agents for indie founders: from prompt to production SaaS"
**When:** Week 4 (before PH Launch 1)
**Keywords:** "AI agents indie founders", "build SaaS with AI", "indie hacker tools"
**Goal:** Buyer voice. Not technical. The business decision.
**Format:** 1500 words, founder POV
**Structure:**
1. The old model: hire a developer, wait 3 months, ship
2. The new model: ask your agents, they build on DeesseJS, you ship
3. Real scenario: "I had a SaaS idea in January, launched in March"
4. The economics: $299 template vs. $15K developer
5. What to ask your agents first
**CTA:** "Join the waitlist →" → homepage waitlist form

---

## §4 — /showcase — The SEO Anchor

*See also: `product-hunt-launch.md` §4 for the showcase structure.*

### Why /showcase is an SEO asset

Every customer project on /showcase:
- Has a unique URL (indexed by Google)
- Targets long-tail keywords ("DeesseJS + [project niche]")
- Generates natural backlinks when founders share their projects
- Provides social proof that anchors every SEO article

### The /showcase entry that ranks

Each entry should be optimized for:
- **Title:** [Project Name] — built with DeesseJS
- **Description:** 2-3 sentences, include the use case + the outcome
- **Tags:** industry niche + "built with DeesseJS" + "SaaS"
- **Screenshot:** real UI, no polish needed

### Internal linking from /showcase

Every showcase entry links to:
- The project's live URL (external)
- The homepage (internal)
- Relevant comparison pages if applicable (internal)

---

## §5 — Internal Linking Strategy

### The confirmed pattern (supastarter)

Every comparison page links to: main product, pricing, docs.
Every blog article links to: at least 2 other pages (comparison, docs, homepage).

**DeesseJS internal linking rules:**

| Source | Must link to | Nice to link to |
|---|---|---|
| Comparison pages | Homepage, pricing, docs | Showcase, blog |
| Pillar articles | Docs, comparison pages | Showcase, pricing |
| Tutorial articles | Docs deep-dive, demo | Comparison pages |
| /showcase entries | Homepage | Comparison pages (if relevant) |
| /changelog | Docs, relevant feature pages | None |

### The link anchor text rule

Use descriptive anchor text, not "click here" or "read more":
- ✅ "See the agent primitives documentation"
- ✅ "per-tenant LLM metering setup guide"
- ✅ "how to run a multi-step agent workflow"
- ❌ "click here"
- ❌ "read more"
- ❌ "learn more"

---

## §6 — Content Calendar (M0–M8)

| When | Content | Type | SEO goal |
|---|---|---|---|
| **Week 1** | "What 'agentic' means for a SaaS template" | Pillar article | Own "agentic SaaS template" |
| **Week 2-3** | "How to run a multi-step agent workflow on DeesseJS" | Tutorial | Agent workflow keyword cluster |
| **Week 4** | "AI agents for indie founders: from prompt to production" | Buyer voice | Indie founder keyword cluster |
| **M4 (PH1)** | /vs/supastarter | Comparison | Capture decision-stage competitor traffic |
| **M4 (PH1)** | /vs/shipfast | Comparison | Second competitor keyword |
| **M4** | /showcase live | Showcase | Anchor social proof, long-tail SEO |
| **M4-5** | /vs/makerkit | Comparison | Third competitor keyword |
| **M5-6** | "Per-tenant LLM billing: a technical deep-dive" | Technical | Billing keyword cluster |
| **M6-7** | "Best SaaS templates in 2026: comparison guide" | Roundup | High-volume top-of-funnel |
| **M8 (PH2)** | DeesseJS Cloud launch announcement | Product | New product keyword cluster |

---

## §7 — Decisions Needed

- [ ] **CMS** — Fumadocs (consistent with stack) vs. dedicated blog platform. Fumadocs handles both docs and blog in one app.
- [ ] **Content authorship** — founder writes all v1 content (authentic) vs. hired writer (scales). Founder first 3 pillars, then evaluate.
- [ ] **Blog vs. substack** — publish on `/blog` (owned) or substack (audience borrow)? Recommend: both. Fumadocs blog + cross-post to substack.
- [ ] **Changelog automation** — git-based auto-generation vs. manual. Manual until >4 entries/month.
- [ ] **Content calendar ownership** — who owns the content calendar? Founder? Contractor? The 2 posts/month minimum is the floor.
