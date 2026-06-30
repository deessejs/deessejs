---
name: project-offer-ladder-recommendation-2026-06-29
description: Recommendation (uncommitted as of 2026-06-29) to drop Pro tier from DeesseJS offer ladder. Move from Lite+Starter+Pro+Team to Lite+Starter+Team. Rationale: Pro is capability-gated which contradicts the verified structural-gating market pattern, Pro↔Team gap is thin (layover not destination), 3-tier is canonical, mid-tier captures the smallest cohort. Suggest Starter $299, Team $899-$999.
metadata:
  type: project
---

# Offer ladder recommendation — drop Pro (2026-06-29)

User asked: keep Lite+Starter+Pro+Team or simplify to Lite+Starter+Team? Recommendation delivered: **drop Pro**.

## The 3-tier ladder (recommended)

| Tier | Price | What |
|---|---|---|
| Lite | Free (MIT) | Lead magnet, npm-installable, demo |
| Starter | $299 | 1 project, 1 dev, full stack, community support, Stripe single-tenant |
| Team | $899-$999 | Multi-project, 3-5 seats, white-label, agency scope, priority support, Stripe Connect per-tenant |

## Why: Pro doesn't carry its weight

1. **Capability gating contradicts market pattern.** Every competitor with 3 tiers gates **structurally** (seats/scope/support) not by feature. Pro is the only DeesseJS tier doing feature gating (Stripe Connect, multi-project, "advanced features").
2. **Pro↔Team gap is thin, not structural.** A buyer who needs Pro features needs Team seats within 6 months. Pro is a layover, not a destination.
3. **Mid-tier captures smallest cohort.** Two ~50% jumps (Starter $399 → Pro $599 → Team $999) means buyers pick bottom or jump straight to Team. Pro is skipped, not chosen.
4. **3-tier is canonical.** Makerkit (2 paid), TurboStarter (2 paid), ShipFast (3 paid), supastarter (3 paid), SaasRock (3 paid). The structural pattern is structural gating across 2-3 paid tiers.
5. **SaasRock's $1,999 Pro is the anti-pattern.** "All RockStacks Latest" vs "RockStack Latest" for $1,500 delta = weakly-justified anti-pattern we should not copy.

## Why: 3-tier ladders win operationally

- **Mental model:** "free → solo → team." Buyers don't calculate mid-tiers.
- **Cohort counter works cleanly:** one cap, one deadline, not two.
- **Founder pricing 2026-07-31 closes without becoming a 4th tier mess.**
- **Marketing copy writes itself:** tier-1 / tier-2 framing instead of explaining 4 SKUs.
- **Support overhead halves.**
- **Sales motion shifts** from "which tier fits?" to "solo or team?"

## What to do with Pro's orphaned features

- **Per-tenant Stripe Connect** → move with Team (it's a multi-project primitive)
- **Multi-project** → Team feature (structural)
- **"Advanced features"** → kill the tier, ship to Starter, remove the gate

This aligns with [[project-template-market-research-2026-06]] recommendation: *"move admin/blog/i18n to Starter; differentiate on seats/scope/support tier."*

## Starter price: $299 (not $249, not $349)

- ShipFast $199 is the floor
- Makerkit $299, TurboStarter $299 are the median
- $249 reads defensive; $349 reads premium without leaving median band
- **$299 is the median buy** — defends against ShipFast on completeness, defends against Makerkit/TurboStarter on full-stack scope

## What you lose vs gain

- **Lose:** ~30-50% of Pro conversions (thin, since Pro is layover)
- **Gain:** cleaner funnel, single cohort cap, single founder deadline, simpler copy, halved support overhead

## Status: uncommitted as of 2026-06-29

User asked for opinion and to save. Has NOT explicitly approved the recommendation. Decision pending. If confirmed, follow-up actions:
1. Refactor `src/lib/pricing/matrix.ts` — remove Pro row
2. Refactor `src/lib/pricing/data.ts` — drop Pro tier, keep Starter + Team + Lite
3. Refactor `src/app/(unprotected)/(marketing)/pricing/page.tsx` — rewire comparison blocks
4. Re-cut marketing copy — "solo or team" frame replaces "tier ladder"
5. Update `/changelog` with the change

## How to apply

When the user returns to pricing/offer decisions:
- Cross-check any new tier proposal against this recommendation
- If the user wants to **add** a tier (e.g. agency/white-label sub-tier within Team), confirm it's structural not capability
- If the user wants to **raise** Starter price, defend $299 as the median anchor — only move if explicit positioning shift

Related: [[project-template-market-research-2026-06]] (competitor benchmarks), [[project-web-marketing-site-audit-2026-06-26]] (pricing CTA + capability gating audit), [[project-positioning-hybrid-2026-06]] (positioning frame), [[project-lead-magnets-2026-06]] (Lite strategy), [[project-cli-auth-idea-2026-06-26]] (CLI auth scope is unaffected by tier choice).