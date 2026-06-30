---
name: project-pricing-page-2026-06-26
description: /pricing route shipped 2026-06-26 with full feature comparison matrix; pricing data lives in apps/web/src/lib/pricing/* (new pattern mirroring lib/blog/*); home page has a compact 3-card teaser
metadata:
  type: project
---

# /pricing route — shipped 2026-06-26

The marketing site (`apps/web`) has a dedicated pricing route at `/pricing`, replacing the previous inline pricing block on the home page. The home page now shows a compact 3-card teaser that links to `/pricing`.

## Architecture

```
apps/web/src/
├── app/(unprotected)/(marketing)/
│   ├── page.tsx                        # home, with compact 3-card pricing teaser
│   └── pricing/page.tsx                # NEW — full pricing route
├── components/pricing/                 # NEW
│   ├── tier-grid.tsx                   # 3-card tier row (Raze Layer 1)
│   ├── feature-matrix.tsx              # desktop table + mobile accordion (Layer 2)
│   ├── comparison-block.tsx            # DeesseJS vs supastarter vs MakerKit (Layer 3)
│   ├── proof-row.tsx                   # what-you-ship-on-day-1 (Layer 4)
│   ├── guarantee-strip.tsx             # 14-day money-back trust strip
│   └── pricing-faq.tsx                 # pricing-specific FAQ subset
└── lib/pricing/                        # NEW — shared data location
    ├── types.ts                        # Tier, FeatureCategory, FeatureRow, etc.
    ├── data.ts                         # tiers, founder offer (RETIRED), guarantee, comparisonBlocks, proofItems, pricingFaqs
    └── matrix.ts                       # 5 categories × ~22 feature rows
```

**New pattern (breaks `apps/web/CLAUDE.md §1`):** Pricing data is now extracted to `apps/web/src/lib/pricing/*` instead of being inline in `page.tsx`. This mirrors `apps/web/src/lib/blog/*`. CLAUDE.md was updated to document this.

**Founder-member offer was retired.** Initially shipped with an inverted full-width `FounderBanner` at the top of `/pricing`, but the user asked to retire it. The page now leads with `<h1>Pick your plan.</h1>` and the tier grid directly. The `founderOffer` data object and `FounderBanner` component are deleted (no dead code).

## @workspace/ui Table primitive

Added on 2026-06-26 via `pnpm dlx shadcn@latest add table` from `packages/ui/`. Now used by `feature-matrix.tsx` and `comparison-block.tsx`. The generated file is DOM-only (no `@base-ui/react/*` imports), ships `data-slot` attrs on every component, and accepts `className` overrides on `<table>` only — the `overflow-x-auto` wrapper is on the outer `<div data-slot="table-container">` and CANNOT be styled via the `<Table>` prop. To customize the wrapper, pass className via `<div>` wrapping `<Table>`.

DESIGN.md §7 inventory updated from 17 → 19 primitives (added `Table`; reconciled `Avatar` which was already installed but missing from the list).

## CTA href updates (commit 4e0d437)

| File | Change |
|---|---|
| `home-header.tsx:12` | `#pricing` → `/pricing` |
| `blog/article-cta.tsx:41` | `/#pricing` → `/pricing` |
| `(marketing)/page.tsx:352,641` | `render={<a href="#pricing" />}` → `render={<Link href="/pricing" />}` |

## Why this matters for future work

1. **The pricing page exists** — any future pricing copy / offer / A/B test should be a data change in `lib/pricing/data.ts`, not an inline edit to the page.
2. **Tier data is shared** — the home page teaser imports the same `tiers` array as the dedicated page. If you change tier names, prices, or feature lists, both surfaces update.
3. **The comparison matrix is a key conversion asset** — it currently has 5 categories × ~22 rows. Adding a row means editing `lib/pricing/matrix.ts`. Don't edit the component to hardcode data.
4. **Home page is a teaser** — keep it short. The full page is `/pricing`. Don't reintroduce long-form content on the home (that was the original problem this PR fixed).

## Related memories

- [[project-monorepo-strategy]] — overall apps/web vs apps/template split
- [[feedback-base-ui-tooltip-aschild]] — the gotcha that came up building the matrix tooltips
- [[feedback-shadcn-border-token-subtle]] — applied to the comparison-block + feature-matrix design (hairline borders, no shadows)
- [[project-blog-changelog-redesign-2026-06-29]] — sibling redesign done same design sprint (blog + changelog + article pages got the same multi-iteration treatment)

## Follow-up (2026-06-29)

This pricing page was further redesigned — see [[project-pricing-redesign-2026-06-29]] for the full arc (added FounderBanner, redesigned TierGrid, replaced generic-icon ProofRow with MockupProofRow using AppShell + Content, then simplified to 3 tiers by removing Pro).
