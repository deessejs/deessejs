# DeesseJS — Pricing

> **The pricing strategy, tier structure, gate philosophy, and open questions.** The README is the high-level summary; this is the depth.

## Pricing structure (locked)

**3 tiers, one-time payment, lifetime license.** No recurring / subscription tier — universal in the band.

| Tier | Price | Buyer |
|---|---|---|
| **Solo** | $299 | Indie founder, first SaaS |
| **Team** | $599 | Small team (2-5 people), first SaaS in production |
| **Studio** | $999 | Agency, studio, or power user with multiple products |

**Why this structure:**
- Matches the band's median (Makerkit, TurboStarter, others sit at $249-499 for the entry tier)
- Three SKUs is the Apple-friendly minimum that covers the three audience segments
- $999 ceiling stays in the $299-999 band the buyer asked for
- One-time, lifetime license — universal in the band, builds trust

**Why not the premium structure ($399/$799/$1,499)?** The user picked the industry-standard structure deliberately — DeesseJS is "the Apple of SaaS templates" through execution (completeness + DX + modular), not through price. The entry tier stays at $299 to match the band.

**Why not the Apple-minimal 2-tier ($399/$999)?** Skips the mid-market team segment. The 3-tier structure better serves the $299-999 band.

**Why not include a free / OSS tier?** None of the direct competitors have one. It's an open question whether to test it — see below.

## Tier gate philosophy (locked)

**Consistent: gates = rights + support + updates.** All tiers get the full feature set. The gates are commercial: app count, seat count, support level, updates window, white-label rights, onboarding.

This aligns with the "no half-built features" design principle. The Solo buyer gets the full DeesseJS experience; they just have a smaller license envelope.

**Why this and not feature gating?**
- "No half-built features" means we can't hold back features to push upgrades
- Apple energy is "the best experience, opinionated." Feature gating is the opposite.
- The upgrade moments are operational (you outgrew 1 app, you need white-label) — they're earned, not forced

## Concrete tier gates (proposed — pending confirmation)

This is the concrete breakdown. The user picked the philosophy; these gates are the implementation that follows. Confirm or adjust before launch.

### Solo — $299

- **1 app**
- **1 seat** (single founder, or founder + 1 collaborator)
- **All features** (full RBAC, full billing, all integrations, notifications, CLI, SDK, AI primitives)
- **Community Discord** support
- **1 year of updates**
- White-label rights: ❌

### Team — $599

- **Up to 3 apps**
- **Up to 10 seats**
- **All features**
- **Email support** (48h response, business hours)
- **1 year of updates**
- White-label rights: ❌

### Studio — $999

- **Unlimited apps**
- **Unlimited seats**
- **All features**
- **Priority email + dedicated Slack channel** (24h response)
- **Lifetime updates**
- **White-label rights** (rebrand and resell under the buyer's own name)
- **1 onboarding session** (60min, with the founder or a core contributor)

## Updates policy (proposed)

- **Solo / Team:** 1 year of updates from purchase date. After 1 year, the buyer can keep using the version they have forever; new versions require a renewal at a discounted rate (50% off the original tier).
- **Studio:** Lifetime updates. New major versions (e.g. DeesseJS 2.0) are included; major architectural changes may require a Studio-tier upgrade for buyers on lower tiers (TBD, communicate at the time).

**Why this:**
- Matches the "1 year for paid / lifetime for top" norm in the band
- Studio is a real anchor — it makes the upgrade feel worth it
- 1 year + 50% renewal is friendly to indie buyers and creates a recurring-revenue path without the "subscription" stigma

## Recurring revenue: the open question

The "no recurring / subscription" norm in the band is universal. Every competitor is one-time. We match.

**The opportunity:** a thin support / upgrades subscription as a *separate* product line. Not gating features. Buyers who want priority support or earlier access to new features can opt in.

**Options:**
- **No subscription.** Pure one-time, 50% renewal for updates after 1 year. Lowest friction.
- **Optional add-on subscription.** $99/year for priority support + early access. Low commitment, real margin.
- **Two-track:** one-time for the code, $199/year for a "Pro support" add-on (Slack channel, faster response, quarterly office hours).

**Recommendation:** start with **no subscription**. Re-evaluate at the 6-month mark based on buyer feedback. Subscription design is a v2 problem.

## Free / OSS tier: the open question

**The argument for:** None of the direct competitors have one. A free tier (e.g. a stripped-down version, or a public repo with the basics) is a top-of-funnel. Indie devs see it, like it, then upgrade when they need the full feature set.

**The argument against:** Maintenance. Every feature we ship has to be tested in the free tier too, or the upgrade path is broken. The "no half-built features" principle argues against a half-feature free tier.

**The compromise:** ship a *subset* of DeesseJS as a public repo (just the architecture: Next.js + Drizzle + Better Auth + Tailwind + shadcn, no paid features). Let devs see the DX. The paid template is the "complete" version on top.

**Recommendation:** **defer.** Don't ship a free tier for v1. Re-evaluate after launch based on the funnel. The paid product is the focus.

## Open pricing questions

1. **Concrete gates (above) — confirm or adjust.** Specifically: 1 vs 3 seats for Solo, 3 vs 5 apps for Team, 10 vs unlimited seats for Team.
2. **Updates scope after 1 year:** is 50% renewal the right number, or should it be 30% / free / no-renewal (locked to that version forever)?
3. **Studio's "1 onboarding session"** — who delivers this? The founder? A contractor? An agency partner? This is an ops question that affects the Studio margin.
4. **Multi-currency:** USD-only, or also EUR / GBP? For an international audience, multi-currency matters but adds Stripe complexity.
5. **Education / non-profit discount?** Common in dev tools. Worth deciding.
6. **Free OSS tier** — ship a public subset as top-of-funnel, or stay 100% paid? (Defer to post-launch.)

## Margin model (rough)

Assuming 60% of buyers pick Solo, 30% Team, 10% Studio, and a 5% renewal rate at 50% off:

- **Solo ($299) × 60% × 1000 buyers/year = $179,400**
- **Team ($599) × 30% × 1000 = $179,700**
- **Studio ($999) × 10% × 1000 = $99,900**
- **Renewals (5% × 50% off) × 1000 = ~$25,000**

**Total: ~$484K at 1,000 buyers/year.** Realistic for a Year 1 in this band (ShipFast reportedly does $1M+/year at the lower price point; supastarter / Makerkit are reportedly in the $500K-2M range).

**Key levers:**
- **Volume** (the single biggest lever — 5,000 buyers/year puts us at $2.4M)
- **Tier mix** (more Studio buyers helps; marketing can target agencies)
- **Renewals** (the 5% assumption is conservative; if we hit 15%, that's $75K extra)

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack reference
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Research: [`research.md`](./research.md) — market + buyer voice
- Memory: [[project-market-research-2026-06]] — pricing norms from the band
