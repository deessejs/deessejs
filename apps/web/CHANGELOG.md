# web

## 0.1.1

### Patch Changes

- fefb8a9: Centralize construction of the typed browser oRPC client in a browser-safe API subpath.
- 0bd0d4b: Fetch catalog template details directly for `info` and successful `init` resolution.
- Updated dependencies [92fb760]
- Updated dependencies [fefb8a9]
- Updated dependencies [5e60234]
- Updated dependencies [e866f5a]
- Updated dependencies [a0bca67]
- Updated dependencies [a808ec6]
- Updated dependencies [2df43ce]
- Updated dependencies [0bd0d4b]
- Updated dependencies [4f4f1e1]
- Updated dependencies [3751b9a]
- Updated dependencies [6931a98]
- Updated dependencies [574ff69]
- Updated dependencies [469a158]
- Updated dependencies [47d6353]
- Updated dependencies [d84324b]
- Updated dependencies [2bd3a85]
- Updated dependencies [0fb1a79]
- Updated dependencies [45ee9ea]
- Updated dependencies [38e8d9b]
  - @workspace/api@0.1.0
  - @workspace/contracts@0.1.0
  - @workspace/env@0.0.1
  - @workspace/cookies@0.0.2
  - @workspace/analytics@0.0.2
  - @workspace/ui@0.0.1

## 0.1.0

### Minor Changes

- b456379: Add the `/pricing` route on the marketing site, implementing the three-layer catalog pricing strategy defined in `documents/internal/product/pricing.md`.

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
