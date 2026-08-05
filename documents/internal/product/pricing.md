# DeesseJS — Pricing

> This document sets the pricing strategy for templates. It uses short sentences, active voice, and precise verbs for clarity.

This document is strategy. Implementation lives in its respective docs.

## Model

Two layers, in one catalog:

- **Open Community** — free, MIT.
- **DeesseJS Pro** — one-shot paid, $299–$999 per template.

Both layers ship complete templates. A free landing template is a complete landing template, not a stripped-down Pro. Pro contains more built-in work — not more knobs.

One rule: **every template ships complete**.

## Why two layers

Catalog items vary in effort. A landing page takes one day. A multi-tenant SaaS with billing, audit and RBAC takes one sprint. A single price tier per template reflects this. The previous three-tier SaaS-license model ("Solo / Team / Studio") is dead. App counts and seat counts do not apply to a templates catalog.

## Why one-shot, not subscription

The persona wins from time saved on a one-time project. A freelance dev finishing a client SaaS does not need a recurring bill for one project.

Subscription remains an option for v2:

- $99–$199 / year per dev
- covers priority support and early access
- is a separate product, not a layer on top of templates

The 50% renewal at 12 months is the floor for recurring revenue.

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
- a 12-month update window
- a renew-or-keep-buyers-choice at month 12

### Pricing rules

- One-shot license per template.
- Price band: $299–$999 per template.
- Source-code delivered.
- Buyer deploys it, or buys hosting from Nesalia Inc. separately.
- 14-day refund window.
- Updates: 12 months included.
- After 12 months: buyer keeps the version forever.
- New versions after 12 months: 50% renewal.
- Buyer may rebrand. Re-selling the unmodified template under another catalog is not allowed.

### Renewal

Renewal is optional. The buyer keeps the original version forever.

- 50% off the original price.
- Brings the buyer back inside the 12-month update window.
- No subscription contract — single payment, single renewal.

## Persona

### Primary

Freelance developer or small studio. Bills the client $20k–$80k. Buys Pro templates to remove the parts of the build that do not pay well: auth setup, billing plumbing, audit logging.

### Secondary

In-house team at a startup past the weekend stage. Buys Pro the same way it buys Vercel or Linear seats. Charges it against engineering time saved.

### Tertiary

Enterprise team in a regulated industry. Wants Pro not because it cannot build it, but because it does not want to.

### Not the persona

Solo indie hacker shipping a weekend project. They use Open Community free templates. That is the floor. The marketing pitch leans on it.

## Submission flow

Open Community contributions go in via pull-request. Pro templates skip pull-request — the DeesseJS team authors them directly.

The two layers share the catalog surface:

- submission, moderation, listing, search, install
- the layer is an attribute on the entry, not a different system

## Pricing model — structural envelope

- Open Community: free, no SLA, no exclusivity.
- Pro: one-shot, $299–$999 per template, per-template price set by the engineering owner.
- Renewal: 50% at month 12.
- Future subscription: $99–$199 per dev per year, layered on top.

Revenue shape: heavy on one-shot, small renewal floor, optional future subscription.

## Open questions

1. Per-Pro-template pricing — who sets the price? Engineer-owner, marketing, or both?
2. Refund window — strict 14 days, or prorated later?
3. Education and non-profit discounts?
4. Multi-currency — USD-only at launch, EUR and GBP at first international buyer?
5. Exclusivity — can a freelancer re-sell the codebase under their client brand? Currently yes with rebrand.
6. Hosting layering — does the Cloud-hosted product replace or layer on top of Pro licenses?
7. Subscription math — breakeven vs cost for a $99–$199/year support add-on?

## Cross-references

- [README.md](./README.md) — product brief
- [positioning.md](./positioning.md) — brand and copy
- [architecture.md](./architecture.md) — stack reference
- [documents/internal/marketing/](../marketing/) — surface plan and copy deck
- [documents/internal/marketing/launch/](../marketing/launch/) — distribution playbook
- [build-roadmap.md](./build-roadmap.md) — feature sequencing
