# Stripe

## Decision

**Stripe** as the only payment processor in v1. No Lemon Squeezy, no Polar, no Paddle wrapper.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked (ADR 0009 in `10-decisions/`)

## Scope

Stripe handles:

- **Subscriptions** per org (per feature 3.3).
- **Per-seat pricing** (the 3 tiers Solo / Team / Studio).
- **Usage-based pricing** for LLM tokens (per feature 3.5, 3.19) — the wedge differentiator.
- **Customer portal** (per feature 3.2).
- **Tax handling** via Stripe Tax (per feature 3.10).
- **Webhooks** for billing events (per feature 3.17).

Stripe is **not** used for:

- One-time template purchases (that's our checkout, separate from the buyer's app).
- Payouts to the buyer's customers (Stripe Connect is for that, but it's a v2 feature).

## What Stripe gives us

1. **Hosted checkout.** Stripe handles the entire payment UX, including PCI compliance.
2. **Customer portal.** Subscriptions, invoices, payment methods — all in Stripe's UI.
3. **Subscriptions with proration.** Upgrade, downgrade, prorated billing.
4. **Stripe Tax.** EU VAT, US sales tax, etc. — Stripe handles it.
5. **Metered usage.** Per-tenant LLM token counts flow from Upstash → Stripe metered usage → invoice.
6. **Webhooks.** Subscription created/updated/cancelled → app reacts idempotently.
7. **Stripe Sigma** for the buyer's revenue reporting (we don't pre-build this; the buyer uses Stripe Sigma or their own dashboard).

## Why direct Stripe (no Lemon Squeezy / Polar wrapper)

| Alternative | Why not |
|---|---|
| **Lemon Squeezy** | Tax / MoR handling is nice. But the abstraction cost is real for a small segment. Buyer can wrap Stripe themselves if they want LS. |
| **Polar** | OSS-friendly. Adds another vendor. |
| **Paddle** | Similar to Lemon Squeezy. Same trade-offs. |
| **Direct Stripe (chosen)** | Most flexible. Buyer can switch to LS/Polar/Paddle by replacing one module. The modular contract applies: the buyer deletes `packages/billing/` and replaces it with their own. |

We stay on direct Stripe. The modular contract means the buyer is never locked in.

## Architecture

```
App → Stripe Checkout (hosted)
   │
   ├── Subscriptions per org
   ├── Customer portal link
   └── Webhooks → /api/stripe/webhook (idempotent handler)

Stripe → App (via webhooks)
   │
   └── Subscription created/updated/cancelled → DB updated

App → Stripe Metered Usage
   │
   └── Per-tenant LLM tokens reported monthly
```

All Stripe access goes through `apps/template/packages/billing/` — a single module the buyer can replace.

## Subscriptions per org (feature 3.3)

Each org has its own Stripe subscription. The mapping:

- `org.id` ↔ `stripe.customer.id` ↔ `stripe.subscription.id`

Stored in Postgres. When a user creates an org, the app calls Stripe to create a customer (lazy — at first checkout).

## Usage-based pricing for LLM tokens (the wedge)

Per feature 3.5, 17.15:

```ts
// In packages/billing/stripe-metered.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function reportLLMUsage(orgId: string, tokens: number) {
  const subscription = await getOrgSubscription(orgId);

  await stripe.subscriptionItems.createUsageRecord(
    subscription.itemId,
    {
      quantity: tokens,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    }
  );
}
```

The metering layer (in `packages/ai/meter.ts`) calls this on every LLM call.

## Webhook handler

Stripe webhooks are **idempotent and resilient**:

- Signature verification (Stripe's `stripe.webhooks.constructEvent`).
- Idempotency: if we've processed this event ID, skip.
- Retries: Stripe retries on 5xx; we handle this gracefully.
- DLQ: failed events after N retries go to a dead-letter queue for manual inspection.

## Tax handling

Stripe Tax is **opt-in for the buyer**. They toggle it in their Stripe dashboard. We don't pre-build tax selection; Stripe handles EU VAT, US sales tax, etc.

## Constraints

- **All Stripe API calls go through `packages/billing/`.** No direct Stripe calls from feature modules.
- **Webhook handler is the only place we receive Stripe events.** No polling.
- **Idempotency keys on all mutations.** Stripe's idempotency layer prevents double-charging on retries.
- **Per-tenant hard caps on metered usage** (feature 17.16). Prevents runaway AI bills.

## What the buyer can replace

The buyer can swap Stripe for Lemon Squeezy, Polar, Paddle, or their own provider by:

1. Deleting `apps/template/packages/billing/`.
2. Replacing with their own module.
3. The rest of the app continues to work (modular contract).

This is the "no vendor lock-in" promise.

## Cross-references

- [`../10-decisions/0009-billing-stripe-direct.md`](../10-decisions/) — the ADR (when written).
- [`../../product/features/03-billing.md`](../../product/features/03-billing.md) — the billing feature inventory.
- [`../../product/pricing.md`](../../product/pricing.md) — the pricing strategy.
- [`./vercel-ai-sdk.md`](./vercel-ai-sdk.md) — AI SDK metering flows to Stripe.
- [`./upstash-redis-realtime.md`](./upstash-redis-realtime.md) — metering backend.
