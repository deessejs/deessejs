# DeesseJS — Pricing

> **The pricing strategy for templates.** Two-layer model: Open Community templates are free and stay free; DeesseJS-curated "Pro" templates are one-shot paid. Subscription and marketplace economics are explicitly deferred — this document is about the V1 model only.

This document is product strategy, not implementation. Surface decisions (which page in the marketing site, what fields on a card, what API the CLI calls) live in their respective docs. Pricing is the *what* and *why*; the *how* belongs to engineering.

## Model (locked 2026-08-04)

**Two layers, in one catalog:**

| Layer | Templates | Pricing | Who picks them up |
|---|---|---|---|
| **Open Community** | Self-submitted or team-issued, fully free, MIT | $0 — first-party free | Indie devs, weekend projects, students, learners |
| **DeesseJS Pro** | DeesseJS-curated, premium feature set, built for production teams | One-shot license | Freelance devs, agencies, scale-ups, enterprise teams |

**One rule, applied to both layers:**

Every shipped template is a complete surface on day one. **Free is not "stripped-down Pro". Pro is not "free with extra knobs."** Both layers are curated. Both ship as working surfaces. The difference between the layers is *what kind of work they remove from your week*, not *which features they ship*.

### Why two layers and not three tiers

The original three-tier model ("Solo / Team / Studio") was the pricing for the *SaaS app* the DeesseJS org was meant to ship. With the architecture pivot to **templates + registry + CLI** (PR #25 repositioning), the catalog becomes the product. Pricing follows the catalog, not the org. Catalog items have wildly different values (a 4-page landing takes a day to build; a multi-tenant SaaS with billing + audit + RBAC takes weeks), so a single flat price-tier per template reads true.

### Why one-shot, not subscription

User decision 2026-08-04: **one-shot pricing for the moment**. Match the band (Vercel Starter Kits, Makerkit, ShipFast-style paid templates) and avoid the subscription stigma for a product whose buyers want to win back their evening, not track a recurring line item. An optional subscription for ongoing support is recorded as a v2 lever below.

## Open Community — fully free

**What ships here:**

- Templates a single developer can produce in a working afternoon: landing pages, dashboards, B2B SaaS starters, internal tools, AI surfaces, API backends.
- Pulled and installed the same way as Pro templates.
- MIT license; no per-user, per-app, or per-deployment caps.

**The only differentiation is scope, not depth.** A free landing-page template is a *complete* landing-page template, not a "starter landing-page template you have to finish yourself." Same for a free SaaS starter — it's a complete SaaS starter. What Pro offers is a different *category of work removed*, not a deeper version of the same work.

**Contributors:**

- Pull-requests welcomed from anyone.
- Reviews by a DeesseJS maintainer. The bar is not "is this excellent?" but **"does this ship end-to-end?"** — middling quality is fine as long as the template is honest about what it is and what it isn't.

## DeesseJS Pro — one-shot paid

**What ships here:**

- Templates that take the DeesseJS team **several tens of hours** to build and that **enterprise teams** pay to avoid rebuilding.
- Categories we're committed to shipping first:
  - **SaaS Pro** — a multi-tenant SaaS starter with SSO, audit log, RBAC, billing, observability, production deployment.
  - **AI Production** — an AI surface with rate-limiting, content moderation, cost observability, eval harness.
  - **Compliance Pro** — anything regulated (healthcare, fintech, etc.).
  - **Marketplace Pro** — anything with multi-sided billing.
- Each Pro template is its own line item, its own price, its own changelog.

**Why this exists:**

The "Pro" qualifier is not a marketing label. It marks a category of templates where the time saved by buying is the cost of *not* buying — a team spending a quarter building the equivalent is paying for that quarter in salary. The free catalog covers things a single dev can ship in a day. Pro covers things a team would otherwise spend a sprint on.

### Pricing rules

- **One-shot license per template.** No subscription. The buyer gets the codebase forever — there is no app limit or seat limit because there is nothing to license per app or per seat. (The previous license-tier model that talked about "apps" and "seats" was the old SaaS-app pricing; that model is dead.)
- **Price band: $299–$999 per template**, per the existing brand band documented in the older version of this doc. Specific price set per-template on the recommendation of the engineering owner of that template (someone who has just shipped it knows its replacement cost).
- **Source-code delivered**, not a hosted product. The buyer deploys it themselves or pays Nesalia Inc. separately for hosted.
- **12 months of updates** included: bug fixes, framework bumps, security patches. After 12 months, the buyer keeps the version they have forever; new versions require a renewal at 50% off the original price.
- **Buyer can rebrand** the template: change logo strings, slug, copy. Re-selling the codebase unmodified is permitted only under the "Open Community" entry path.
- **Refund window: 14 days**, no questions asked.

### Why Pro templates are NOT subscription

Two reasons:

1. **The use case is "save the quarter"**, not "always receive support." A freelance dev finishing a SaaS for a client doesn't want a recurring bill for a one-off project.
2. **Subscription on templates is naturally what Vercel-style marketplaces grow into**, not what a V1 templates catalog should ship. The Pro one-shot is the smallest viable unit. Renewal (50% off at 12mo) is a *floor* for recurring revenue, not the same thing as a subscription contract.

If recurring revenue becomes important, the natural extension is a *separate* subscription product (priority support + early access + office hours), paid for by buyers who use it. Templates stay one-shot.

## Open Community contribution model

Self-submitted templates go into the catalog under the Open Community layer. Submission, moderation, listing, search, install — all use the same surface as Pro templates. The user sees a single catalog index; pricing is a per-template attribute the index card surfaces.

DeesseJS-curated Pro templates skip the issue step — they're authored by the DeesseJS team. The two layers run through the same catalog; the layer label is a metadata attribute, not a different data path.

## Persona — who pays for Pro

**Primary:** the freelance developer or the small studio who needs to start a client project not-from-scratch. They bill the client $20k–$80k, take home the margin minus their time, and need the Pro template to remove the parts of the build that don't pay well (auth setup, billing plumbing, audit logging).

**Secondary:** an in-house team at a startup that's past "ship-it-in-a-weekend" and into "ship-it-this-quarter." They buy Pro templates the same way they buy Vercel / Linear / Cursor seats — operational cost they charge against engineering time saved.

**Tertiary:** the enterprise team that needs a hardened starter for a regulated industry. They want Pro not because they can't build it, but because they don't want to.

**Not the persona:** the solo indie hacker shipping a weekend side-project. They use Open Community free templates. That's their floor — keep that floor free, the whole marketing pitch leans on it.

## Pricing model — structural envelope

Specific numbers are marketing's problem; this is the structural envelope.

- **Open Community templates:** free. No SLAs, no support tier, no exclusivity.
- **Pro templates:** one-shot $299–$999 per template, with the per-template price set by the engineering owner of that template based on how many engineer-hours it replaces.
- **50% renewal at 12 months per Pro template**, optional. The buyer keeps the original version forever whether or not they renew.
- **Future subscription (provisional, not shipping):** $99–$199/year per dev for priority support + early access to new Pro templates + the Open Community backlog. This is a *separate* product line, layered on top of one-shot purchases.

Total revenue shape: heavy on one-shot revenue with a small renewal floor and a future optional subscription for buyers who want a relationship, not just code.

## Open questions

1. **Pricing details per Pro template** — who sets the price? Engineer-owner? Marketing? Both? (Defer to first Pro template ship.)
2. **Refund mechanics** — strict 14-day window, or prorated beyond that? Standard dev-tools is strict 14-day. Stick unless buyer asks otherwise.
3. **Education / non-profit discount** — probably worth shipping. 50% off for verified students, full discount for verified non-profits.
4. **Multi-currency** — Stripe handles this; ship USD-only V1, add EUR / GBP once we have buyers in those regions.
5. **Pro template exclusivity** — if a freelance dev buys the SaaS Pro template, can they ship the result under their own client brand and re-sell the *codebase itself*? Currently: yes, with rebranding. Reselling the unmodified template under another catalog is not — that would compete with us. Worth writing this down more carefully before first ship.
6. **Hosting as a separate product** — the existing roadmap has `cloud.deessejs.com` as a "Coming soon" sub-domain. When Cloud ships, do hosted Pro templates replace the one-shot license, or layer on top? My instinct: layer on top. The hosted product is a separate SKU from the codebase. (Defer to Cloud PR.)
7. **Subscription math** — if/when we ship the $99/year support subscription, what's the breakeven vs the cost of running it? Defer to first 6 months of customer feedback.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Architecture: [`architecture.md`](./architecture.md) — stack reference
- Marketing: [`documents/internal/marketing/`](../marketing/) — surface plan, copy deck
- Launch: [`documents/internal/marketing/launch/`](../marketing/launch/) — distribution playbook
- Roadmap: [`build-roadmap.md`](./build-roadmap.md) — sequencing of features vs pricing
