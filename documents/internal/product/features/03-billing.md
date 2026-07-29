# 3. Billing

> The pricing tier is the wedge's commercial surface. Stripe is the floor. The differentiator is per-tenant usage-based pricing for LLM tokens — no competitor ships this end-to-end.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 3.1 | Stripe checkout | ✅ | C | Hosted, Stripe handles tax |
| 3.2 | Customer portal | ✅ | C | Stripe-hosted, one link |
| 3.3 | Subscriptions per org | ✅ | C | Each org has its own subscription |
| 3.4 | Per-seat pricing (3 tiers) | ✅ | C | Solo $299 / Team $599 / Studio $999 |
| 3.5 | Usage-based pricing (LLM tokens) | ✅ | D | Per-tenant metering via Upstash Redis + Stripe metered usage; **no competitor does this end-to-end** |
| 3.6 | Tiered pricing (graduated) | ✅ | C | Stripe native |
| 3.7 | Free trial — 14 days, no card | ✅ | C | Higher conversion than card-required trials |
| 3.8 | Coupons / promo codes | ✅ | C | Stripe native |
| 3.9 | Multi-currency (USD only in v1) | 🟡 | U | Architecture supports; only USD ships. EUR/GBP at launch if buyers ask. |
| 3.10 | Tax handling (Stripe Tax) | ✅ | C | Buyer toggles on; Stripe handles EU VAT, US sales tax |
| 3.11 | Invoice history | ✅ | C | From customer portal |
| 3.12 | Payment methods | ✅ | C | Card, ACH (Stripe), wallets |
| 3.13 | Failed payment recovery (dunning) | ✅ | C | Stripe Smart Retries + email sequence via Resend |
| 3.14 | Plan upgrade / downgrade | ✅ | C | Prorated, immediate |
| 3.15 | Cancellation flow | ✅ | C | Voluntary (with reason capture) + involuntary (dunning) |
| 3.16 | Refunds (admin) | 🟡 | U | UI shows the refund button; actual refund via Stripe dashboard (avoid double-tooling) |
| 3.17 | Webhooks (billing events) | ✅ | C | Idempotent handler, retry logic |
| 3.18 | Revenue reporting (per org) | ⚪ | — | Buyer integrates Stripe Sigma or their own dashboard. We don't pre-build. |
| 3.19 | Per-feature usage tracking | ✅ | D | LLM tokens, API calls, storage GB — anything meterable. Architecture supports arbitrary meters. |
| 3.20 | Lemon Squeezy / Polar wrapper | ⚪ | — | Direct Stripe is the recommendation. LS/Polar are valid for buyers who want tax/MoR handling. |

**Notes:**
- 3.5 / 3.19 (usage-based pricing for LLM tokens, per-tenant metering) is **the** billing differentiator. TurboStarter has credits but not per-tenant; ShipFast doesn't ship billing; SaasRock doesn't ship usage-based.
- 3.16 (refunds) is intentionally light: we don't want to rebuild Stripe's refund tooling. We show a button that links to Stripe.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../pricing.md`](../pricing.md) — tier structure, gate philosophy
- Related: [17-ai-primitives.md](./17-ai-primitives.md) — LLM token metering for usage-based pricing
- Related: [05-mail.md](./05-mail.md) — dunning email sequence via Resend
- Related: [07-api.md](./07-api.md) — Stripe webhook handlers
