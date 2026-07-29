# DeesseJS — Positioning, Brand, Copy

> **The wedge, the brand, the words.** This is the doc to read before writing the landing page, any marketing copy, or any social post. The README is the high-level summary; this is the depth.

## Brand: DeesseJS

**The name:** *Déesse* is French for "goddess." DeesseJS = the goddess of SaaS templates. Pronounced "deh-ESS" in English, "dé-ÈS" in French. Short, premium, slightly mythic.

**Why this name:**
- Short, punchy, premium — fits the Apple positioning
- The "JS" suffix anchors it in the ecosystem (matches the NextForge, Makerkit naming convention)
- Stands out in a sea of masculine-coded names (ShipFast, TurboStarter, Makerkit, NextForge)
- Pronounceable in both English and French
- Unique in the SaaS template space — no one else has it

**Repo vs product name:** Repo is `complete-template/` on disk; product is `DeesseJS`. We keep the repo name (matches the convention of Linear → linear, Notion → notion, etc.) and use `DeesseJS` everywhere the buyer sees it. Repo rename is an open operational question.

**Brand voice:**
- Calm, confident, opinionated
- Speaks to founders as peers, not as customers
- Avoids hype, jargon, superlatives
- Lets the product speak: copy is descriptive, not promotional

## The wedge

**"The Apple of SaaS templates."**

Two commitments, equal weight:

1. **Completeness** — every feature ships out of the box. Auth, orgs, billing, blog, docs, mails, storage, AI primitives, jobs, CLI, API, i18n, in-app notifications. The buyer does not need another template on top of this one.

2. **DX (easiest to customize)** — opinionated defaults, strong conventions, modular architecture, easy to delete what you don't need, great docs. The buyer can shape this to their product without fighting it.

### Why this is the wedge

No competitor in the $299-999 band owns both axes:

- **ShipFast** is lean (DX ✓, completeness ✗)
- **SaasRock** is heavy (completeness ✓, DX ✗ — deep but hard to reshape)
- **Makerkit** is fragmented (three parallel stacks, no opinion)
- **TurboStarter** is multi-app focused (completeness ✓, DX partial)
- **supastarter** competes on completeness (✓) and ships config-driven multi-tenancy toggles (partial DX)
- **Nexty** is below the price band

DeesseJS is the only one that's complete out of the box AND truly modular (delete what you don't need). That's the differentiator.

### Why this is high-risk

"Apple" positioning breaks on the first half-baked feature. Every feature has to feel considered; the docs have to be the best in the category; the architecture has to actually be modular. A template with 18 features done at 80% is worse than one with 8 done at 100%.

The execution bar is high. We earn the brand one feature at a time.

## The buyer-voice research (the de-risking step)

We ran a deep-research pass mining Reddit, X, Hacker News, and Product Hunt for direct buyer voice. 103 agents, 21 sources, 25 claims verified, **8 confirmed / 17 killed by adversarial vote**.

**The headline:** The wedge is **directionally supported but the strongest copy-ready buyer voice is thin**. Most surviving evidence is maker self-admission (SaasRock) and n=1 Product Hunt comments. **Refinements are warranted, not a wholesale validation.**

**The strongest direct buyer quote we have** (Stain Lu, Nexty Product Hunt):

> "tried shipfast, tried supastarter, even gave boilerplate.io a shot but they all felt either too bloated or missing key features"

> "most templates i've tried force you into their specific structure and then you spend days undoing their decisions"

WEI independently corroborates: *"the templates on the market were either more mature but with outdated technology stacks, or they looked simple and easy but not fully functional, until I found Nexty."*

**Use the Stain Lu quote in the hero or sub-headline of the landing page.** Paraphrased, with credit. It's the only citable direct buyer pain we have.

**Other surviving evidence:**
- **SaasRock's maker openly admits** "no coding or architecture standards" and "No security tests!" — direct confirmation that the completeness gap is real
- **Aneel Panyam (SaasRock PH)** asked about linting / static analysis / SAST / DAST / PT — n=1 evidence of DX demand
- **Nexty has zero mentions** of "orgs / teams / RBAC / multi-tenant" in marketing copy — exploitable gap
- **AI primitives as headline is NOT supported by evidence** — validates the call to de-prioritize AI

**Refuted (key killers):**
- Testimonials validating "completeness + DX" axes (0-3 votes)
- "Weeks of work saved" quantitative language (0-3)
- SSO as unmet need (0-3)
- Buyers using "modular" / "delete what you don't need" language (0-3)
- Free templates perceived as low-quality (0-3)
- $200-300 as price barrier (0-3)

> Full research report in [`research.md`](./research.md) and [[project-buyer-voice-2026-06]] in agent memory.

## The modular promise — proof, not tagline

The "delete what you don't need" claim is the strongest differentiator from supastarter (and the only buyer-validated gap). To make it real:

1. **Architectural contract:** every feature is a self-contained module. Documented in the docs, demonstrated in a "Deleting features" walkthrough.
2. **Delete tests:** every feature has a `pnpm test:delete --feature=<name>` script that removes the module, runs the test suite, and fails loudly if anything else broke. The CI runs these.
3. **Citable in the docs:** the deletion walkthrough is a flagship docs page, not a footnote. Buyers finish it having actually deleted a feature.
4. **Quote it on the landing page:** "We don't just say modular. Here's how to delete a feature without breaking the rest: [link to walkthrough]."

## Copy angles

For landing-page sections:

**Hero headline options** (pick one):
- "The Next.js SaaS template that ships everything — and lets you delete what you don't."
- "Complete out of the box. Modular by design."
- "Stop wiring the same plumbing. Start shipping."

**Hero sub-headline** (use the Stain Lu quote, paraphrased):
- "Most templates are too bloated or missing key features. DeesseJS is the one that's both complete and truly modular."

**Feature section** (each pillar gets a section):
- Lead with the operational surface (it's the wedge)
- AI primitives get a "Built in, ready to use" section (not the lead)
- Each feature has a screenshot + a "what it does" + a "what's wired in" + a "how to delete it if you don't want it" link

**Objection handling:**
- "Why not just use ShipFast for $199?" → "ShipFast is lean by design. DeesseJS is complete + modular. The $100 buys you a dozen features you'd otherwise build yourself."
- "Why not supastarter at the same price?" → "supastarter is complete too. We're the only one that's complete AND truly modular — every feature is a self-contained module you can delete without breaking the rest. [link to walkthrough]"
- "Why this and not just Better Auth + Next.js + Stripe myself?" → "You could. It would take you 2-3 months. We've done it. You get there in 30 minutes."

**Testimonial section** (do not write fake testimonials):
- Real testimonials come post-launch. Until then, the section is the Stain Lu quote (with credit, paraphrased) + an invitation to "be one of the first 100 buyers and shape the product."

## Distribution

**Sales surface:**
- **Own landing page + Stripe checkout** — universal in the band. No Gumroad / Lemon Squeezy.
- **Lemon Squeezy** if we want tax / VAT handling for free (worth evaluating at launch).

**Launch channels:**
- **Product Hunt** — every competitor has launched there. Plan a launch 4-6 weeks after v1 ships.
- **Indie Hackers** — community post + ongoing thread.
- **X / Twitter** — long game, not a launch tactic. ShipFast's distribution is a one-person brand moat; don't try to copy it.
- **Hacker News** — "Show HN: I built a Next.js SaaS template that..." post. Risky, but high-reward if it lands.

**SEO:**
- Long-tail keywords anchored on completeness + DX: "Next.js SaaS template with orgs and billing", "Next.js template that ships everything", "opinionated Next.js starter", "modular Next.js boilerplate"
- No competitor owns these phrases. The 6-month SEO play is to rank for them via blog content + the docs site (Fumadocs is SEO-friendly out of the box).

**Content strategy:**
- Design-principle write-ups: "Why we ship a CLI as a product feature", "How we make every feature deletable", "What 'modular' actually means"
- These double as SEO content and as proof of the Apple positioning
- The buyer-voice research is itself a content piece ("What we learned from 6 months of buyer voice research")

## Brand consistency checklist

Before any public-facing artifact (landing page, blog post, tweet, docs intro), check:

- [ ] Calm, confident, opinionated — no hype, no superlatives
- [ ] Describes the product, doesn't oversell it
- [ ] Uses the operational features as bullets, not the AI primitives
- [ ] Has a "delete what you don't need" angle somewhere
- [ ] Cites the modular proof (link to the deletion walkthrough)
- [ ] Speaks to founders as peers, not as customers

## Open positioning questions

- **Sharpen the differentiator from supastarter more.** The "complete + truly modular" framing is good, but supastarter is actively marketing on the completeness axis. Consider: "the only complete one that doesn't force an architecture on you."
- **Is the wedge inferred or confirmed?** Inferred, per the buyer-voice research. The first public artifact (a feature done to 100% on the new modular stack) is the proof that converts the inference into evidence.

> Full buyer-voice report in [`research.md`](./research.md).
