---
name: project-2026-saas-template-pricing
description: 2026 SaaS template pricing benchmarks + concrete recommendations for DeesseJS. Covers all major competitors (Supastarter, MakerKit, ShipFast, ShipKit, ShipAny, ShipNext, Bedrock), conversion patterns, and anti-patterns
metadata:
  type: project
---

# 2026 SaaS template pricing — benchmarks + DeesseJS recommendations

**Date:** 2026-06-29
**Source:** Deep research via `fresh` CLI — competitor pricing pages, starter kit market maps, pricing post-mortems, IndieHackers surveys.
**Why this matters:** DeesseJS pricing decision is imminent (M7 landing prep Q3 2026). Wrong pricing = 6-12 months of compounding damage (SaaSify post-mortem evidence: $19 → $79 re-pricing doubled MRR).

## TL;DR

**Dominant 2026 pattern:** one-time lifetime (no annual updates fee) + 3 tiers with team upcharge + aggressive founder launch pricing with anchor.

**DeesseJS recommendation:** Three-tier one-time launch — **$149 Founder / $399 Pro / $899 Team** with **founder pricing hard-dated to Sept 30, 2026** + **30-day refund + "all future updates" promise with explicit scope carve-out**.

## §1. Competitor pricing (verified June 2026)

| Product | Tiers | One-time? | Annual updates? | Refund | Source |
|---|---|---|---|---|---|
| **Supastarter** (Next.js) | Solo $349 / Startup $799 / Agency $1,499 | ✅ all one-time | ❌ included | None ("no refunds") | supastarter.dev |
| **MakerKit** | Pro $299 ($349 anchor) / Teams $599 ($649 anchor) | ✅ both | ❌ included | None published | makerkit.dev |
| **ShipFast** | Starter $199 / All-in $249 / CodeFast $299 | ✅ all one-time | ❌ included | None post-access | shipfa.st |
| **ShipKit** | Single $249 | ✅ one-time | ❌ included | **30-day, no questions** | shipkit.io |
| **ShipAny** | Membership $249 + 6 templates at $1.99 each | ✅ one-time | ❌ included | None published | shipany.ai |
| **ShipNext** | Lifetime $99 launch ($199 anchor) + 19-day countdown | ✅ one-time | ❌ included | Transparent refund link | shipnext.pro |
| **Bedrock** | Lite $299 / Full $1,500 (WorkOS SSO) | ✅ one-time | ❌ included | n/a | StarterPick 2026 |
| **Nuxt UI Pro** | Single $249/yr subscription | ❌ recurring | n/a | n/a | Outlier |

**Corrects my earlier note:** Supastarter is **$349, not $299** in 2026. The "$299 + $99/yr" model I had in memory is from a pre-2026 version. They've moved to lifetime updates.

## §2. Conversion tactics the leaders converged on

In order of prevalence:

1. **Anchor + crossed-out founder price** — every top seller
2. **Scarcity counter or countdown** — ShipFast ("12 spots left"), ShipNext (19-day timer)
3. **30-day refund as trust signal** — ShipKit (only one in dataset)
4. **"All future updates" promise** — MakerKit, Supastarter, ShipFast
5. **Team upcharge at 2.5-3x** — clear solo/team/agency pattern
6. **Founder-led social proof** — Lee Robinson quote (Supastarter), Marc Lou 135K Twitter (ShipFast)
7. **Strategic partner discounts** — ShipFast bakes in $1,210 of partner deals

## §3. Public conversion benchmarks

- **ShipFast:** 329,427 visitors → 1,851 customers → 0.56% visitor→customer conversion. $20K MRR sustained (not just launch).
- **Supastarter:** ~$10K MRR, 1,423 customers, profitable.
- **MakerKit:** $15.4K revenue 2024, 1-person team, no funding.
- **Time to $10K MRR for SaaS templates:** 12-18 months median, 70-90% net margins, $50-100/mo infra at 4-figure MRR.

## §4. What NOT to do (data-backed)

1. **Annual updates surcharge** — Supastarter et al. moved off this in 2026. Filter out indie buyer segment.
2. **24/7 ticking counter with low traffic** — trains buyers to wait. Use hard date + small cohort count instead.
3. **AppSumo / Dealify LTD in first 6 months** — Vibecoder analysis (4 mistakes list): influx breaks unprepared businesses. Wait until v1.0.
4. **Unbounded "all future updates"** — Vibecoder mistake #3 (no scope protection). One-line FAQ carve-out is cheap insurance.
5. **Race-to-bottom pricing** — underpricing = "risky" signal on a CMS. $149 Founder is the floor; don't go to $49/$99.
6. **Put 80% of features in cheap tier** — SaaSify post-mortem: upgrade rates collapse (8% → 31% after tier redesign).
7. **Permanent grandfathering** — same post-mortem: $19/mo grandfathered cohort cost $4,200/mo to support.
8. **Enterprise features at low traffic** — DeesseJS sells to indie hackers at v0.0.x, not compliance buyers. Skip RBAC/SOC2/multi-tenant until v1.0+.

## §5. DeesseJS recommendation (3-tier, lifetime, hard date)

| Tier | Founder price (until Sept 30, 2026) | Regular price | What you get |
|---|---|---|---|
| **Founder** | $149 | $249 | 1 seat, all features, lifetime updates, RSS/JSON Feed/MCP discovery |
| **Pro** | $399 | $549 | 1 seat + plugin marketplace access + priority GitHub issue response + 30-min architecture call (once) |
| **Team** | $899 | $1,199 | Up to 5 seats + private Discord + 4×30-min architecture calls + white-label rights |

**Why this works:**

- **$149 Founder** is cheaper than every paid competitor, signals a personal/founder narrative, recovers $150 in 2 hours of dev billing — impulse-buy threshold.
- **$399 Pro** hits the 40% market cluster ($300-$500 band per market map), 2.7x upcharge from Founder, capture indie hacker + small team.
- **$899 Team** is 6x upcharge from Founder, capture agency/studio + power users.
- **Hard date for founder pricing** + small "47 founders in" count (updates weekly on a public Notion page) = more credible than a counter for low-traffic launch.

**Scope protection (paste into FAQ):**
> "One purchase includes all future updates within the current scope (CMS, auth, admin, plugin system). Major new framework adapters or new admin-panel modules may ship as separate add-ons."

**30-day refund (paste on pricing page):**
> "30-day refund. No questions asked. If the template isn't for you, email for a full refund."

## §6. 3 conversion tactics to layer on launch day

| Tactic | Why | Effort |
|---|---|---|
| Hard date + small "founder" badge | More credible than counter at low traffic | Low |
| 30-day refund on pricing page | ShipKit's differentiator; cheap insurance for v0.0.x | Low |
| One strategic partner discount (e.g. Vercel credit) | Social proof without marketplace overhead | Medium |

## §7. Anti-patterns specific to DeesseJS

- **Don't gate the agent story by tier.** Agent-first is the wedge — it must be in the cheapest tier. Gate features (CMS modules, admin panels) by tier, not the positioning claim.
- **Don't promise "agent workflows" or "vector search" for free.** Scope the FAQ explicitly.
- **Don't race MakerKit/Supastarter on enterprise features.** Sell the agent story cleanly at launch. Bedrock-tier features come later.

## §8. Pre-launch checklist (before turning the pricing page on)

- [ ] FAQ entry: lifetime updates scope carve-out (copy from §5)
- [ ] Pricing page: 30-day refund banner
- [ ] Pricing page: hard date Sept 30, 2026 + founder count widget
- [ ] Post-purchase email: dedupe the lifetime promise + scope
- [ ] Public Notion page: founder count update (weekly)
- [ ] Stripe/Lemon Squeezy: 3 tiers × 2 prices (founder/regular) = 6 SKUs, properly throttled by date

## §9. How to apply

- **Asked about pricing:** lead with §5 recommendation (3 tiers), §6 conversion tactics, §4 anti-patterns to avoid.
- **Asked about founder pricing duration:** hard date, not counter. Sept 30, 2026 closes it.
- **Asked "should I add a 4th tier?":** no — 3 tiers capture all segments. 4+ creates confusion.
- **Asked about annual fee:** no — lifetime updates is 2026 default, the inverse is now a yellow flag.

## Related memory

- `project-2026-saas-template-landscape.md` — strategic context (where DeesseJS fits)
- `reference-mcp-server-checklist.md` — MCP is part of the "all future updates" scope
- `reference-content-collections-next16-patterns.md` — the blog/changelog engine that ships behind the pricing page