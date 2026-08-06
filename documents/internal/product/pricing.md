# DeesseJS — Pricing

> This document sets the pricing strategy for templates. It uses short sentences, active voice, and precise verbs for clarity.

This document is strategy. Implementation lives in its respective docs.

## Model

Three layers, in one catalog:

- **Open Community** — free, MIT.
- **Pro Education** — free, MIT, students and OSS projects only.
- **DeesseJS Pro** — one-shot paid, $299 for lifetime access to every Pro template.

All three layers ship complete templates. A free landing template is a complete landing template, not a stripped-down Pro. Pro contains more built-in work — not more knobs.

One rule: **every template ships complete**.

## Why three layers and not three tiers

Catalog items vary in effort. A landing page takes one day. A multi-tenant SaaS with billing, audit and RBAC takes one sprint. A single price tier per template reflects this. The previous three-tier SaaS-license model ("Solo / Team / Studio") is dead. App counts and seat counts do not apply to a templates catalog.

The education layer is separate from the open layer because the audience is separate: students and OSS projects can free-ride without competing with freelance buyers who pay.

## Why one-shot, not subscription

The persona wins from time saved on a one-time project. A freelance dev finishing a client SaaS does not need a recurring bill for one project.

Subscription remains an option for a separate product line in v2:

- $99–$199 / year per dev
- covers priority support and early access
- is a separate product, not a layer on top of templates

The 50% renewal at 12 months is the floor for recurring revenue on the Pro layer.

## Open Community

### What ships here

A template one developer can write in one afternoon. Examples:

- landing pages
- dashboards
- B2B SaaS starters
- internal tools
- AI surfaces
- API backends

### Rules

- free, MIT
- no app count, no seat count, no deployment cap
- pull-requests accepted from anyone
- review by a DeesseJS maintainer
- quality bar: **does it ship end-to-end?** not "is it excellent?"

End-to-end means the template runs, the README is true, and the buyer can deploy without writing the missing 30%.

## Pro Education

### Audience

- verified students (`.edu` email or equivalent proof)
- OSS projects the buyer owns or contributes to

### Rules

- free, MIT, same as Open Community
- same submission and review flow
- verification needed before license is granted
- license remains the buyer's; OSS project leadership may not transfer it to a third party that is not an OSS contributor

### Why free

A student learning on a Pro template becomes a freelance dev tomorrow. An OSS project runs on the same templates. The free layer pays back later through the Pro layer and through community trust.

## DeesseJS Pro

### What ships here

A template the DeesseJS team builds in tens of hours, and an enterprise team otherwise spends a sprint on. Each Pro template ships complete, with production patterns a startup CISO expects.

Categories:

- **SaaS Pro** — multi-tenant, SSO, audit, RBAC, billing, observability, deploy
- **AI Production** — rate-limiting, moderation, cost observability, eval harness
- **Compliance Pro** — regulated industries, healthcare, fintech
- **Marketplace Pro** — multi-sided billing, payouts, takedowns

Each Pro template ships with:

- a license (paid)
- lifetime access to the full Pro catalog, including templates added later
- Cloud access for every Pro template (auth + repo + clone via CLI)

### Pricing rules

- One-shot license for the full Pro package. Single payment, lifetime access.
- Entry price: $299.
- Source-code delivered for every Pro template included in the package.
- Cloud access included for the buyer's license (auth + repo + CLI for every Pro template).
- Cloud features beyond auth and repo (observability, scaling) are a separate product, deferred to v2.
- Buyer deploys it themselves, or buys hosting from Nesalia Inc. separately.
- 14-day refund window, no questions asked.
- Lifetime access. No renewal. No subscription. The buyer keeps the version they downloaded forever, and any future Pro template added to the catalog is included.
- Buyer may re-sell the codebase to a client (the freelancer case). The unmodified template may not appear in another catalog.

## Persona

### Primary

Freelance developer or small studio. Bills the client $20k–$80k. Buys Pro templates to remove the parts of the build that do not pay well: auth setup, billing plumbing, audit logging. Then ships under the client brand and may charge the client for the saved time.

### Secondary

In-house team at a startup past the weekend stage. Buys Pro the same way it buys Vercel or Linear seats. Charges it against engineering time saved.

### Tertiary

Enterprise team in a regulated industry. Wants Pro not because it cannot build it, but because it does not want to.

### Floor

Solo indie hacker shipping a weekend project. Uses Open Community free templates. That is the floor. The marketing pitch leans on it.

## Submission flow

Open Community and Pro Education contributions go in via pull-request. Pro templates skip pull-request — the DeesseJS team authors them directly.

The three layers share the catalog surface:

- submission, moderation, listing, search, install
- the layer is an attribute on the entry, not a different system

Cloud auth, repo private and CLI distant are referenced by this flow but not detailed here. See the Cloud product doc once it exists.

## Pricing model — structural envelope

- **Open Community**: free, no SLA, no exclusivity.
- **Pro Education**: free, same as Open Community, license is bound to the verified student or OSS project.
- **Pro**: one-shot, $299 for lifetime access to every Pro template. No per-template price. No renewal. No subscription.
- **Future subscription**: $99–$199 per dev per year, layered on a separate Cloud product.

Revenue shape: heavy on Pro one-shot lifetime licenses. No recurring revenue floor at V1.

## Cross-references

- [README.md](./README.md) — product brief
- [positioning.md](./positioning.md) — brand and copy
- [architecture.md](./architecture.md) — stack reference
- [documents/internal/marketing/](../marketing/) — surface plan and copy deck
- [documents/internal/marketing/launch/](../marketing/launch/) — distribution playbook
- [build-roadmap.md](./build-roadmap.md) — feature sequencing
