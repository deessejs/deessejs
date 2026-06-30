---
name: project-cloud-metering-failure-modes
description: Upstash INCRBY + Stripe createUsageRecord double-write — the 6 failure modes from B4 §2 that will lose money on retries if not reconciled
metadata:
  type: project
---

The LLM token metering in DeesseJS Cloud is a **double-write pattern**: Upstash `INCRBY` for the local meter + Stripe `createUsageRecord` for the billing record. The two are **NOT actually reconciled** in the spec as written. This memory distills B4 §2 so you can spot the failure modes in any code review.

## The 6 failure modes (in order of how much money they lose)

### 1. INCRBY is not idempotent on retry (THE asymmetry)

`INCR` is a Redis primitive that **always adds**, even if the client retried because the response was lost. The Upstash REST API doc is explicit:
> "Operations like `INCR` are atomic at the Redis level ... but atomicity does not imply exactly-once. A retry that re-runs the entire LLM call (e.g. Vercel AI SDK retry on a 5xx, or a Trigger.dev job retry) will double-increment both Upstash and Stripe. There is no client-side dedup without an application-level idempotency key."

**Stripe IS idempotent if you set the `Idempotency-Key` header. The Upstash call is not.** That asymmetry produces persistent drift between the two meters over time.

**Fix pattern:** wrap the LLM call in a request-id-keyed dedup that tracks "did I already count this call?" before either write. Without this, you either over-charge the buyer (Upstash is correct, Stripe retries) or under-charge (Stripe is correct, Upstash retries — but the buyer sees the overage on their bill).

### 2. Upstash durability is durable-after-ack, but the ack is the boundary

If Upstash ACKs the increment, the value is durable. If the response is lost between ack and client, the next retry increments again. Same root cause as #1.

### 3. Stripe createUsageRecord is idempotent but expensive on the wrong order

The spec doesn't pin the call order. If Stripe is the **last** step (after Upstash + budget + rate-limit), a failure of (a)-(d) blocks (e). If Stripe is the **first** step, a failure blocks the entire LLM call. The correct order is: (1) idempotency-key check, (2) budget cap (Upstash), (3) rate limit (Upstash), (4) LLM call, (5) Upstash increment, (6) Stripe `createUsageRecord` with `Idempotency-Key`. Document this order in the metering wrapper, not in a comment.

### 4. Clock skew between Upstash and Stripe `timestamp`

`stripe.subscriptionItems.createUsageRecord({ timestamp: Math.floor(Date.now() / 1000) })` uses the **client clock**. If the client clock is ahead/behind Stripe's, the usage record lands in the wrong billing period. Stripe clamps but logs a warning — and the warning is invisible to the operator.

**Fix pattern:** use Stripe's `stripe.invoiceItems.create` with `period.start` / `period.end` derived from the **server clock** of the control plane, not the tenant function. Add a daily reconciliation job that compares Upstash totals per `meter:{orgId}:llm:tokens:{YYYYMM}` to the Stripe `usage_record_summaries` for the same `subscription_item`.

### 5. Burst writes from a single Vercel Function invocation

A Vercel AI SDK `generateText` call may trigger multiple internal model calls (tool use, retries, streaming chunks). The metering wrapper counts at the wrong granularity if it wraps `generateText` instead of the underlying model call. A 1-message chat may bill 1 token or 10,000 tokens depending on wrapper placement.

**Fix pattern:** wrap the lowest-level model call (the `languageModel.doGenerate` or `doStream` boundary), not the user-facing `generateText`.

### 6. The Upstash counter and the Stripe `quantity` are not the same unit

The Upstash counter is `meter:{orgId}:llm:tokens:{YYYYMM}` (raw token count, both input and output). Stripe's `quantity` is whatever the metered usage price is configured for — usually the same unit, but if a future price changes unit (e.g. to "per-1k-tokens"), the Stripe call divides. The spec doesn't pin which side does the unit conversion, so they drift.

**Fix pattern:** the **wrapper** does the unit conversion. Both sides get the raw token count; Stripe configures the price in the same unit. Or vice versa. Document the choice.

## How to spot these in code review

- Any metering wrapper without an idempotency key → fail review (#1, #2)
- Any wrapper that calls Stripe before Upstash → likely wrong order (#3)
- Any wrapper that uses `Date.now()` for the Stripe `timestamp` → flag (#4)
- Any wrapper that wraps `generateText` rather than the underlying model call → likely wrong granularity (#5)
- Any place where the unit conversion is implicit → fail review (#6)

## How to handle "the spec already covers this"

The spec `documents/internal/product/features/03-billing.md` and `documents/internal/product/features/17-ai-primitives.md` describe the double-write pattern but **do not pin the call order, the idempotency key, the granularity, or the reconciliation job**. If anyone points to the spec and says "this is handled", they're pointing to a spec that **will lose money on retries**. The fix is a new B-doc (probably `B5-llm-metering-correctness.md` or `B6-metering-reconciliation.md`) that pins all 4 unknowns.

**How to apply:** When reviewing Cloud metering code, run the 6-mode checklist. When asked "is the metering spec complete?", answer "the surface is described but the call order, idempotency, granularity, and reconciliation are not pinned — see B4 §2 + this memory."

Related: [[project-deessejs-secret-paseto]] (envelope-only design that protects secret-related integrity), [[project-cloud-vendor-stack]] (Upstash + Stripe are the two meters)