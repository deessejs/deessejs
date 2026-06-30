---
name: project-cli-auth-idea-2026-06-26
description: Uncommitted strategic idea — authed `deessejs` CLI for project init, customer verification, update channel, and viral npm surface. Three scenarios analyzed (full auth / hybrid / anonymous MVP). Recommendation: ship anonymous MVP first to validate, then add license-gated `add` + update channel. No competitor has this pattern.
metadata:
  type: project
---

# deessejs CLI with auth — idea explored 2026-06-26

User floated a CLI idea: `deesse auth login` then `deesse init` to reduce dev burden AND verify customer status. This is an **uncommitted product idea** — exploration only, no code written, no decision made.

## Why: motivation is dual
1. Reduce dev burden (DX) — `deesse init my-saas` is faster than `git clone + manual config`
2. Verify customer status — license-gated access, telemetry on actual usage, license enforcement

## Why it's more than just init friction
The CLI unlocks 5 things beyond just init:
1. Customer verification (license key, signed JWT, verifiable offline)
2. **Update channel** — `deesse update` patches existing projects. **Resolves a real unmet need** ([[project-unmet-needs-2026-06]]): templates go stale as frameworks evolve.
3. Opt-in telemetry — which stack combos buyers actually use
4. Viral surface — `npx create-deessejs-app` is a distribution channel in itself
5. Continuous marketing — npm presence compounds

## Category context (verified 2026-06-26)
**Zero of the 6 surveyed competitors** (supastarter, Makerkit, ShipFast, TurboStarter, SaasRock, Nexty) have an authed CLI. All sell ZIP after purchase. Industry template/starter norm is anonymous `create-next-app` / `create-t3-app` / `shadcn init`. Authed CLIs are SaaS-product pattern (Stripe, Vercel, Linear), not template pattern.

**This is category-bending** — differentiator + friction risk in one move.

## Three scenarios analyzed
- **A: Full auth on init** — high friction at point of purchase, deviates from category
- **B: Auth + ZIP alternative** — best DX for both audiences, two systems to maintain
- **C: Anonymous Lite, authed paid** — clean separation, aligns with [[project-lead-magnets-2026-06]]
- **D: ZIP for purchase, CLI for updates** — post-purchase engagement, solves staleness

## Recommendation: Scenario C + D hybrid (shadcn-style registry)
- `npx create-deessejs-lite my-app` — anonymous, friction-free, ships Lite (lead magnet)
- `deesse auth login --license=KEY` — authed, ties to purchase
- `deesse init my-saas --tier=pro` — authed, full template
- `deesse add admin` — authed, adds Pro/Team features in-place
- `deesse update` — authed, patches existing project

Lemon Squeezy webhook → backend → generate license key → email buyer → CLI validates offline (Ed25519) + revocation list ping.

## Risks named
| Risk | Severity | Mitigation |
|---|---|---|
| Friction at point of purchase | High | ZIP as fallback default; CLI is advanced path |
| Engineering cost (4-6 wk for full version) | High | Ship anonymous MVP first (2-3 days) |
| License key complexity (revocation, rotation) | Medium | Ed25519 offline + revocation list cache, no code watermarking |
| Category counter-current | Medium | Lead with ZIP, position CLI as bonus |
| Support surface | Medium | Auto-update + direct "report bug" link in `deesse help` |

## Validation question (proposed)
Ask 5-10 best prospects from Indie Hackers / PH / r/nextjs:
> "If you bought a $499 template, would you prefer a ZIP, or installing a CLI + doing an auth flow before getting the code?"

- 70%+ say ZIP → ship ZIP-first, CLI as v2
- 50%+ say CLI is OK → pursue Scenario C+D

## Short-term proposal (this week)
Ship **MVP CLI anonyme** in 2-3 days:
- `npx create-deessejs-app my-saas` → clones template + writes `.deessejs/config.json`
- No auth, no license, no update yet
- Captures: viral npm surface, flow feedback, opt-in anonymous telemetry
- Cheap investment that validates the CLI flow before committing to the 6-week build

## Why: this is the kind of bet worth measuring before committing
The competitive context (no one has it) means it's a real differentiator if it works, but the friction risk is real. Anonymous MVP de-risks the flow decision cheaply.

## How to apply
When the user returns to this idea:
- Don't act on Scenario C+D until validation question is answered OR anonymous MVP ships
- If MVP ships and metrics are good → push for full Scenario C+D
- If MVP shows friction → fall back to ZIP-first distribution and consider CLI as v2 post-launch

Related: [[project-lead-magnets-2026-06]] (Lite lead-magnet strategy aligns with anonymous Lite CLI), [[project-unmet-needs-2026-06]] (template staleness is the unmet need update channel solves), [[project-template-market-research-2026-06]] (zero competitors have CLI auth).