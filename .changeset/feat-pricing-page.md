---
"web": minor
---

Add the `/pricing` route on the marketing site, implementing the three-layer catalog pricing strategy defined in `documents/internal/product/pricing.md`.

Page composition:

- Hero, three-layer cards (Open Community, Pro, Enterprise), detailed comparison table.
- A "What lifetime means here" section with four bullets covering the future-template guarantee, no lock-in, amortized cost, and the 14-day refund window.
- Refund and license bullets, with a Pro Education note and a `mailto:` link to request access.
- Persona block, FAQ accordion, and a footer CTA strip with a primary `Browse the catalog` action and a secondary `Email us` mailto.

Marketing-side copy is driven by a single config object (`apps/web/src/lib/pricing.ts`). All strings mirror the strategy doc verbatim, so the doc stays the single source of truth.

Strategy-doc updates reflected in the page:

- Pro is now a one-shot $299 lifetime package, full Pro catalog, no per-template price, no renewal, no subscription.
- The 12-month update window and 50% renewal sections are removed from `documents/internal/product/pricing.md`.
- The freelancer re-sell clause is kept as-is.

V1 has no checkout: Pro CTAs point at `mailto:hello@deessejs.com`. The CTA wording is factual, no guru-selling copy. No em dashes in the page or in the strategy doc body.
