# DeesseJS — Lead Magnets

> **Strategy for top-of-funnel.** A $299-999 one-time product needs a lot of leads. The wedge ("Apple of SaaS templates" = completeness + DX, modular) dictates that the lead magnet must **demonstrate the wedge in action** before asking for the email. This doc recommends **DeesseJS Lite** (a public mini-template) as the primary lead magnet, plus a 3-tier combined strategy.
>
> **Status:** Strategy decision, not yet implemented. To be confirmed before M7 (landing page + sales).

## Funnel math (the constraint)

A $299-999 one-time product needs unusually strong top-of-funnel because:
- **Visitor → lead conversion:** 5-15% (typical for dev tools with a strong lead magnet)
- **Lead → customer conversion:** 1-5% (typical for $299+ products)
- **Effective conversion:** 0.05% – 0.75% (visitor → customer)

| Goal | Required leads | Required visitors (at 0.5% avg) |
|---|---|---|
| 25 customers in 90 days | 1,250 leads | 250,000 visitors |
| 50 customers in 90 days | 2,500 leads | 500,000 visitors |
| 100 customers in 90 days | 5,000 leads | 1,000,000 visitors |

**The constraint:** getting 250k-1M visitors in 90 days is a hard SEO + distribution problem. The lead magnet must have **compounding reach** (SEO, social sharing, community) — not just paid traffic. **The mini-template (public GitHub repo) is the only lead magnet that has compounding reach for a developer audience.**

## The recommendation: DeesseJS Lite

**The primary lead magnet.** A public GitHub repo that ships:
- Next.js + Drizzle + Better Auth + Tailwind + shadcn (the foundation)
- **One feature done to 100%** — recommended: **billing (Stripe)** because it's the most-needed, the most-missed by competitors (per the unmet-needs report), and the most demonstrable
- The **modular contract**: every feature in its own folder, deletable, with a delete test
- A **"Deleting features" doc** (mini version of the flagship doc) — the wedge proof
- The README that points to the full DeesseJS with a clear CTA
- A landing page (deessejs.com/lite) that captures emails for the full launch waitlist

### Why DeesseJS Lite is the strongest lead magnet

1. **Demonstrates the wedge in action.** The buyer sees the code, sees the modular contract, sees the quality. 100x more convincing than any PDF or video.
2. **Compounding SEO.** "Next.js SaaS starter," "Next.js auth + billing template," "Next.js Drizzle Better Auth starter" — long-tail keywords nobody owns.
3. **Targets the right audience.** Developers who download a Next.js starter are exactly the DeesseJS buyers.
4. **Network effect.** Devs fork, star, share, contribute. The repo becomes a distribution channel.
5. **Doesn't cannibalize.** Lite ships 1 surface; full ships 23. Lite is "good enough to try," not "good enough to ship a SaaS on."
6. **Free to operate.** GitHub is free, the docs are static, the README is the funnel.

### What's in vs. what's out

| In the Lite | Out (deferred to full) |
|---|---|
| Foundation: Next.js, Drizzle, Better Auth, Tailwind, shadcn | All 22 other surfaces (orgs/RBAC, jobs, mail, storage, etc.) |
| Billing (Stripe): checkout, customer portal, webhooks, per-seat | 22 surfaces beyond billing |
| Modular contract + delete test (the wedge proof) | The full "Deleting features" doc (lite version ships) |
| "Deleting features" doc (lite version) | Fumadocs site, blog, marketing site, demo app |
| README + landing page CTA | The full onboarding wizard, the public demo, the SDK, the CLI |
| Public GitHub repo (MIT or source-available) | The full DeesseJS pricing ($299-999) |

### Effort

- ~2-3 weeks (1 dev) to extract the foundation + billing from v1 DeesseJS into a separate repo
- ~1 week for the landing page + email capture
- Total: **3-4 weeks**, can run in parallel with v1 build (M5-M6 of the build roadmap)

### Funnel integration

```
GitHub (free, anonymous) → README CTA → landing page (deessejs.com/lite) → email capture → waitlist → launch
```

The README has a "Star this repo" CTA (compounding reach) AND a "Get the full DeesseJS" CTA (qualified leads). The landing page has a waitlist form with the wedge copy + the cost-per-client table from the Cloud report (if shipped) + the unmet-needs top 10 as proof points.

## Alternative lead magnets

### Top-of-funnel (volume, SEO, awareness)

| Lead magnet | Effort | ROI | Why / why not |
|---|---|---|---|
| **"The State of SaaS Templates 2026" report** (PDF long-form) | M (2-3 weeks) | High SEO + thought leadership | Original research based on the unmet-needs workflow. 20-30 pages, compares 6-8 templates on 23 surfaces, scoring matrix, use cases. **Email-gated download.** Best for credibility + SEO. |
| **SaaS Template Comparison Tool** (interactive web) | M-L | High SEO long-tail | "ShipFast vs Makerkit vs DeesseJS" — 20+ dimensions, data-driven, shareable. **Email capture for the full comparison report.** Best for "vs" keywords. |
| **"DeesseJS Architecture" diagram** (PDF / Notion) | S | Medium (visual, shareable) | The 23 surfaces, the modular contract, the delete tests — the wedge in image form. **Email-gated download.** Cheap to make, shareable on Twitter / Reddit. |

### Mid-funnel (qualified leads, conversion)

| Lead magnet | Effort | ROI | Why / why not |
|---|---|---|---|
| **Public deployed demo** (app.deessejs.com) | L | High conversion | A real, deployed DeesseJS instance. Free tier with limits (1 org, 1 user, 100 API calls/day). Auto-converts to paid at threshold. **The infra becomes the lead magnet.** Best for trial-to-paid conversion. |
| **Vertical-specific starter** (e.g. "DeesseJS Chat Starter") | L per starter | High (SEO vertical) | Each starter is a real, working SaaS starter on the DeesseJS architecture, but vertical. README points to full DeesseJS. 3-4 starters cover the main use cases. Best for vertical SEO + product validation. |
| **"SaaS in 30 days" free course** (YouTube) | XL | High (audience compound) | Weekly videos building a real SaaS with DeesseJS. Workbook + templates gated by email. **Production cost high; ROI compounds over years.** Best for long-term audience building. |

### Bottom-funnel (conversion)

| Lead magnet | Effort | ROI | Why / why not |
|---|---|---|---|
| **Free trial of full DeesseJS** (10-14 days) | M | Medium-High | Self-host the full product, full features, time-limited. **Email + card required.** Best for buyers already in consideration. |
| **Live demo + 1:1 walkthrough** (calendar booking) | S | High (Enterprise only) | 30-min Zoom with the founder. Screen-share the product. Q&A. **For Studio tier ($999) buyers or Enterprise prospects.** Best for high-touch sales. |
| **Money-back guarantee** (30 days) | S | High | "If DeesseJS doesn't save you 2 weeks, full refund." **Removes the last friction.** Best for first-time buyers (the most cautious segment). |

## The 3-tier combined strategy

**Three lead magnets, three objectives, running in parallel:**

1. **DeesseJS Lite (GitHub)** — top-of-funnel, SEO, audience, wedge proof
2. **The State of SaaS Templates 2026 (PDF)** — mid-funnel, thought leadership, email capture
3. **Public deployed demo (app.deessejs.com)** — bottom-funnel, conversion, product experience

The mini-template is the **lynchpin** (SEO + audience + wedge proof + email capture). The report is the **long-form complement** (credibility + email capture for non-developers). The public demo is the **conversion accelerator** (real product experience, lowest friction to purchase).

### Funnel map

```
Anonymous visitor
    │
    ├── Discovers via GitHub search / SEO / Reddit / Twitter
    │   └── Lands on GitHub repo (DeesseJS Lite)
    │       ├── Reads README → clicks "Get the full DeesseJS"
    │       │   └── Lands on landing page (deessejs.com)
    │       │       └── Email capture → waitlist
    │       └── Stars / forks / shares (compounding reach)
    │
    ├── Discovers via Product Hunt / Hacker News / Indie Hackers
    │   └── Reads "The State of SaaS Templates 2026" report
    │       └── Email-gated download → waitlist
    │
    └── Discovers via Twitter / Indie Hackers / word-of-mouth
        └── Visits app.deessejs.com
            └── Signs up for the public demo (free tier)
                └── Uses the product for 14 days
                    └── Auto-converts to paid at the threshold
```

### Sequencing

| When | Build | Why this order |
|---|---|---|
| **M5 (during v1 build)** | The State of SaaS Templates 2026 report | We have the data already. 2-3 weeks of writing + design. Ships at M7. |
| **M6 (during v1 build)** | DeesseJS Lite (extract foundation + billing from v1) | Reuses v1 code. 3-4 weeks including landing page. Ships at M7. |
| **M7 (at launch)** | Public deployed demo (app.deessejs.com) | Requires v1 to be feature-complete. Infra cost starts at launch. |
| **M7+ (post-launch)** | Vertical-specific starters (3-4 of them) | Each is a real product. Compounds SEO. Built one at a time. |

## The anti-competitive twist: The Buyer's Guide

**The most differentiating lead magnet** — and one nobody else can produce: a **"SaaS Template Buyer's Guide 2026"** that objectively compares every template on the market.

**What it is:** A 20-30 page PDF that compares 6-8 templates (ShipFast, Makerkit, SaasRock, supastarter, TurboStarter, Nexty, DeesseJS) on 20+ dimensions across 23 surfaces, with:
- A scoring matrix (completeness, DX, modularity, polish, AI depth, support)
- Use case recommendations ("If you're building an AI-first SaaS, ship X. If you need real orgs, ship Y.")
- Pricing comparison
- Strengths and weaknesses for each
- An honest "what's missing from each" section

**Why it's the most differentiating:**
- Nobody else can produce it — we have the internal data (unmet-needs research, competitive teardowns, the spec) that nobody else has
- It's **honest** — the buyers trust balanced critiques more than marketing
- It positions the founder as the **expert** on the SaaS template market
- It naturally leads to "and that's why we built DeesseJS — to fix what we found"
- It generates SEO for "best Next.js SaaS template 2026," "ShipFast vs Makerkit," etc.
- It's **shareable** — buyers send it to cofounders, agencies send it to clients

**Spec:**
- 20-30 pages
- Based on the unmet-needs workflow + competitive-teardowns doc + features spec
- Updated quarterly (Q1 2027, Q2 2027, etc.)
- Email-gated download
- Lightly branded (DeesseJS logo on the cover, one CTA in the conclusion)

**Effort:** ~3-4 weeks (writing + design + production). Can run in parallel with v1 build.

## Implementation roadmap (6-8 weeks parallel)

| Week | DeesseJS Lite | State of SaaS Templates 2026 | Public deployed demo |
|---|---|---|---|
| 1 | Extract foundation from v1 | Outline + research (use unmet-needs data) | — |
| 2 | Extract billing + modular contract | First draft (10 pages) | — |
| 3 | "Deleting features" lite doc | Second draft (20 pages) | — |
| 4 | Landing page + email capture | Design + production | v1 v1.0 ships (M7) |
| 5 | Public launch (GitHub + Indie Hackers) | Public launch (PDF download) | Stand up app.deessejs.com (free tier) |
| 6 | Iterate based on feedback | Promote via Twitter / Reddit | Onboard first 10 free-tier users |
| 7-8 | Add second surface (e.g. auth) | Quarterly update planning | Add second surface to demo |

## Decisions needed

- [ ] **Primary lead magnet:** DeesseJS Lite (recommended) or alternative? — defaults to Lite if no objection
- [ ] **One feature in Lite:** billing (recommended) or alternative? — defaults to billing
- [ ] **Lite license:** MIT (maximum reach) or source-available (defensible)? — defaults to MIT for top-of-funnel
- [ ] **State of SaaS Templates report:** ship in 2026-Q3 (recommended) or later? — defaults to Q3
- [ ] **Public demo infra cost budget:** $50-200/mo for free tier is acceptable? — defaults to $100/mo cap
- [ ] **Vertical starters (post-launch):** build 3-4 (Chat, Analytics, Marketplace, Forms) or only build when requested? — defaults to wait-and-see
- [ ] **Free trial of full DeesseJS:** ship in v1 launch (recommended) or post-launch? — defaults to at launch
- [ ] **Money-back guarantee:** 30 days (recommended) or 60 days? — defaults to 30

## Anti-patterns to avoid

- **No newsletter-only lead magnet.** Too generic, not differentiated, low conversion.
- **No cheat sheet / PDF guide** unless it's the State of SaaS Templates (the one differentiating angle).
- **No podcast or webinar** as the primary — production cost too high for the audience size in v1.
- **No Slack/Discord community** at launch — moderation cost, not differentiated.
- **No free trial of Cloud** (the managed variant) until Cloud ships — infra cost is too high for an unproven funnel.
- **No "lite" feature other than billing** at v1 launch — the wedge is completeness, not single-feature depth. (Vertical starters can come later.)
- **No "waitlist with countdown timer" gimmick** — looks desperate, not the Apple positioning.

## Cross-references

- [`README.md`](./README.md) — product brief, wedge definition
- [`positioning.md`](./positioning.md) — the "Apple of SaaS templates" positioning
- [`features/`](./features/) — what would be in the Lite (foundation + billing, vs the full 23 surfaces)
- [`unmet-needs-2026-06.md`](./unmet-needs-2026-06.md) — the research that informs the State of SaaS Templates report
- [`deessejs-cloud-feasibility-2026-06.md`](./deessejs-cloud-feasibility-2026-06.md) — the public demo may be the Cloud v0, not a separate product
- [`build-roadmap.md`](./build-roadmap.md) — M5-M7 sequencing
- [`v2-features.md`](./v2-features.md) — what to defer (NOT in the Lite)
