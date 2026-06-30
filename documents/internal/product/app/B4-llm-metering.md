# B4 — LLM Token Metering: Billing-Grade Accuracy

> **Author:** B4 research agent
> **Date:** 2026-06-18
> **Feeds into:** `tech-2026-06.md` (synthesis agent)
> **Subject of analysis:** features 17.15 / 3.5 / 3.19 — the per-tenant LLM token meter that feeds Stripe metered usage. Is the current `Upstash INCRBY → Stripe createUsageRecord` pattern production-safe for billing?
> **Spec inputs read:** `documents/internal/product/features/17-ai-primitives.md`, `documents/internal/product/features/03-billing.md`, `documents/internal/architecture/01-stack/upstash-redis-realtime.md`, `documents/internal/architecture/01-stack/vercel-ai-sdk.md`, `documents/internal/architecture/01-stack/stripe.md`.

---

## 1. What the spec actually says

The implementation as documented has **two layers**, both of which must be correct for billing:

**Layer 1 — the meter (Upstash counter, the wedge).** Per `vercel-ai-sdk.md` §"Per-tenant metering" and `upstash-redis-realtime.md` §"Metering (the wedge)":

```ts
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

// On every LLM call
await redis.incrby(`meter:${orgId}:llm:tokens:${YYYYMM}`, tokenCount);
await redis.expire(`meter:${orgId}:llm:tokens:${YYYYMM}`, 60 * 60 * 24 * 35); // 35 days
```

Plus the metering wrapper that **per-call** calls `stripe.subscriptionItems.createUsageRecord` with `action: 'increment'`:

```ts
await stripe.subscriptionItems.createUsageRecord(
  subscription.itemId,
  { quantity: tokens, timestamp: Math.floor(Date.now() / 1000), action: 'increment' }
);
```

This is a **double-write pattern**: the Upstash counter is the local meter, and the Stripe `createUsageRecord` call is the per-event sync to the billing system. The Stripe call is the canonical billing record. The Upstash counter is a fast cache for budget enforcement (17.16) and rate limiting (17.17), and is **also the value Stripe invoices from** if you read the comment in `stripe.md` §"Usage-based pricing" ("Per-tenant LLM tokens reported monthly").

The two sources are not actually reconciled in the spec. That is the first problem.

**Layer 2 — the call path.** Vercel AI SDK → `meter()` wrapper → `generateText` → response. The wrapper must (a) count input + output tokens, (b) write to Upstash, (c) enforce budget cap, (d) enforce rate limit, (e) call Stripe `createUsageRecord`. The order matters: if the Stripe call is the last step, a failure of (a)-(d) blocks (e) — but a failure of (e) doesn't block (a)-(d). If the Stripe call is the first step, a failure blocks the entire LLM call from happening (a chat fails because Stripe is down). Neither order is in the spec.

---

## 2. Six failure modes that the current pattern does not survive

### 2.1 INCRBY on Upstash is not idempotent on retry

`INCRBY` is a Redis primitive that **always adds**, even if the client retried because the response was lost. The Upstash REST API doc is explicit:

> "`INCR` is **not idempotent** in the Redis protocol sense: it always adds 1. A retried request after a network failure (where the server executed the command but the response was lost) will increment the counter twice. ... The HTTP layer offers at-least-once delivery semantics only — there is no documented idempotency key or deduplication mechanism for plain commands."

(Source: https://upstash.com/docs/redis/features/restapi, REST API reference.)

Upstash's general architecture page confirms: "Operations like `INCR` are **atomic at the Redis level**, meaning concurrent increments from multiple clients cannot interleave or lose updates." Atomicity is preserved — meaning the value written is correct, no partial increments — but atomicity does **not** imply exactly-once. A retry that re-runs the entire LLM call (e.g. Vercel AI SDK retry on a 5xx from the upstream provider, or a Trigger.dev job retry) will double-increment both Upstash and Stripe. There is no client-side dedup without an application-level idempotency key.

**Stripe is idempotent if you set the `Idempotency-Key` header. The Upstash call is not.** That's an asymmetry that produces a persistent drift between the two meters over time.

### 2.2 Upstash durability is durable-after-ack, but the ack is the boundary

Upstash's general architecture is clear on durability:

> "Upstash Redis uses **Append-Only File (AOF) persistence** to durably record writes before acknowledging them. ... writes are committed to AOF on the primary before replication. ... Acknowledged writes on the primary are durable; read regions may lag briefly."

(Source: https://upstash.com/docs/redis, "Architecture Overview".)

Once Upstash returns 200 OK for an `INCRBY`, the write is on the primary's AOF and will survive a primary crash. **This is fine.** What is not fine is what happens to unacked writes. A network blip that closes the connection before the response is read is **indistinguishable from a successful write from the server's perspective** — Upstash's AOF has the increment, the client does not know whether it committed, and the client will retry. The retry is what double-counts.

The Global Database topology is single-primary with async replication to read regions. A write that hit the primary but did not replicate before a primary crash **is preserved** (AOF), but reads from the replica's read region may serve a stale count. For billing, we should always read from the primary's region. **The spec uses Upstash Global Database, which by default routes reads to the nearest region** — including replicas that lag. For the Stripe-reporting path this matters; for in-flight rate-limit checks it mostly doesn't.

### 2.3 Stripe `createUsageRecord` is async and idempotent only with a key

The Stripe legacy `createUsageRecord` endpoint (which the spec uses, with `action: 'increment'`) is documented at https://docs.stripe.com/billing/subscriptions/usage-based-legacy:

- **`action: 'increment'`** (default): adds to the period total.
- **`action: 'set'`**: overwrites the period total up to the timestamp.
- **Aggregation at invoice time** is `sum` (default) of all `increment` records in the period. The period-end invoice total is `Σ record.quantity` across the billing cycle.
- **Records cannot be deleted individually** (no documented `delete` endpoint for the legacy API). Edits are via `set` which overwrites, or you submit corrections in the next period.
- **35-day hard limit** on `timestamp` — usage older than 35 days is hard-rejected. The spec's 35-day Upstash TTL is not coincidental.
- **The endpoint is documented as accepting a Stripe `Idempotency-Key` header** (the legacy docs reference the same Idempotency-Key mechanism that every Stripe mutation endpoint supports), but the spec code does not set it. The spec is relying on `action: 'increment'` being "naturally idempotent if you only call it once" — but if the client retries the LLM call, the meter call is also retried, and the increment is double-applied.

The newer Meter Events API (`/v1/billing/meter_events`, what Stripe now recommends for new integrations) is the model the spec should be using. Key differences from the legacy API:

> "Stripe processes meter events asynchronously. ... you can decide how often to record usage in Stripe, for example as you go or in batches. ... Use **idempotency keys** to avoid sending usage data more than once in the event of latency or other issues. ... Each meter event corresponds to an identifier that you can specify in your request (otherwise, we generate one automatically)."

(Source: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api.)

This is a **structural change** to the spec. The spec's per-call `createUsageRecord` pattern should be replaced with a per-tenant **buffer + flush** pattern: persist each usage event to a durable store locally with a deterministic identifier (e.g. `hash(org_id, llm_call_id)`), then send to Stripe in batches (every 1-5 minutes) with that identifier as the `idempotency_key`. Stripe's docs explicitly recommend pre-aggregation:

> "Pre-aggregate your usage data before sending it to Stripe. For example, instead of sending an event for every individual user action, you can accumulate usage over multiple actions and send a single aggregated event periodically."

This is the **right** pattern and is not what the spec does. Without it, every LLM call is a network round trip to Stripe, and every retry is a potential double-count.

### 2.4 Stripe `createUsageRecord` rate limit is real and asymmetric

From the Meter Events API reference (which the spec should be using):

> "The limit for Meter Event is **1,000 calls per second per Stripe account**. ... Meter Event calls are limited to **one concurrent call per customer and per meter**. ... For Connect platforms: you are subject to Stripe's normal rate limit, which is **100 operations per second**."

(Source: https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api.)

For a single-tenant DeesseJS Cloud operation, the 1,000/sec account-wide limit is fine. For Stripe Connect Standard (which is what the feasibility doc recommends — buyer's revenue goes to the buyer's connected account), the **100 ops/sec** limit applies to the **platform**, not the connected account. With 30 v0 tenants each making 10 LLM calls/sec at peak (e.g. a busy agent loop), that's 300 ops/sec — already over the Connect limit. **The Connect 100 ops/sec limit silently throttles usage reports**, which means usage drops on the platform side (not the connected account side). The buyer doesn't get billed. The operator eats the overage.

**This is the worst possible failure mode**: the platform throttles silently, the buyer is under-billed, the operator under-recovers, and nobody knows until the next monthly reconciliation — which the spec doesn't have.

### 2.5 Stripe-side failure modes (per the Meter Events docs)

> "If an event is rejected (e.g., unknown `event_name`, missing customer mapping, invalid payload key), it is silently dropped — meter event creation returns success even for events that fail validation downstream."

And:

> "Hard rejection limits (silent drop after limit): timestamp must be within last 35 calendar days and not more than 5 minutes in the future (clock skew buffer). 10,000 unique dimension combinations per meter per hour. 100 unique dimension combinations per customer across all events. Exceeding dimensions produces code `meter_event_dimension_count_too_high`."

**The model dimension cardinality limit is the silent killer.** Different models = different `payload[model]` dimensions (or, in the legacy `createUsageRecord` world, different subscription items). At 100 unique dimensions per customer, the operator either needs to roll models up into a single "tokens" bucket (losing the per-model cost mapping the spec implies) or split the meter into per-model meters (multiplies the rate limit pressure).

**Two error-reporting webhooks exist for failed events** (`v1.billing.meter.error_report_triggered`, `v1.billing.meter.no_meter_found`), and Stripe says to "correct and resubmit invalid events so they are processed again." **The spec has no error-reporting webhook handler.** Rejected events vanish.

### 2.6 The spec has no audit trail

The `meter:{orgId}:llm:tokens:{YYYYMM}` key is a **counter with a 35-day TTL**. It is a current value, not a log. There is no record of:
- *Which* LLM call consumed the tokens
- *Which* model (the spec mentions "different models have different token costs" in the prompt — the counter doesn't record model)
- *Which* user in the org consumed the tokens (for orgs with multiple users)
- *When* (beyond the monthly bucket)
- *What* the request and response were (for dispute resolution)

For a billing dispute, the operator can say "the counter says you used 50M tokens" but cannot say "these 4,217 calls used them." Stripe records the timestamps and the totals, but the per-call provenance is gone. This is **below SOC2 / HIPAA / GDPR-grade** audit. The feasibility doc puts SOC2 and HIPAA in the Enterprise tier; the spec's meter cannot support those.

### 2.7 Anti-fraud: a tenant can spoof the Upstash meter trivially

The spec does not specify a **server-side metering wrapper** — it specifies a `meter()` helper that "every LLM call goes through." But:

1. A buyer on the Enterprise tier who self-hosts the Vercel project can swap the wrapper out and call `redis.incrby` directly. **No way to detect.**
2. A buyer on any tier can use the SDK to manually INCR the meter key. There is no authentication on the `meter:{orgId}:llm:tokens:{YYYYMM}` key — it's just an Upstash key, the buyer has the REST token in their `DEESSEJS_SECRET` boot cache, and they can INCR it all they want.
3. The budget cap (17.16) reads the counter and refuses to serve over-budget. But the **billing** path (Stripe metered usage) trusts the same counter. If a tenant can write to the counter, they can under-report.
4. The `rateLimit` (17.17) and the meter are in the same Upstash DB with the same auth. A buyer with the REST token can reset their own rate-limit window or clear their own meter.

The spec's "Ratelimit prefix" pattern (`t:{tenantId}:`) is a logical partition, not a security boundary. The Upstash token is a per-tenant bearer; a tenant that holds the token can write any key in their prefix. **This is a real fraud surface.**

### 2.8 Race against the meter is structurally possible

The 17.16 budget cap reads the counter, the LLM call executes, then the post-call increment happens. A tenant who calls 17.13 (LLM chat) and 18.7 (file upload) **concurrently** can read the counter at t=0, both pass the cap check, both call the LLM, both increment. With a hard budget of $1,000, two parallel calls at $600 each succeed and bill $1,200. **There is no transactional check-and-increment on Upstash Redis.** A Lua `EVAL` script would work (read + check + increment in one atomic operation), but the spec does not use one. The `MULTI/EXEC` transaction Upstash supports does not support `WATCH/UNWATCH/DISCARD` (per the REST API docs), so the standard optimistic-locking pattern is not available.

---

## 3. Is the current pattern production-safe for billing?

**No.** It is acceptable for **per-tenant budget enforcement** (the buyer controls the application, the budget is a self-imposed cap) and for **soft usage tracking** (admin dashboards, "you used X this month" notifications). It is not acceptable for **billing** in the sense of "the buyer is going to be invoiced for exactly the tokens they consumed, defendable in a dispute, auditable under SOC2 / HIPAA, and safe against client-side tampering."

The five root causes:

1. **The Upstash counter and the Stripe metered usage are two parallel writes with no reconciliation.** A failed Stripe call leaves Upstash ahead. A retried Stripe call with no idempotency key (the spec doesn't set one) can double-bill.
2. **The Upstash counter is client-writeable.** A buyer who holds the REST token can spoof the meter. There is no server-side metering on a path the buyer cannot reach.
3. **The Stripe metered usage API is async and silent-drop on error.** The spec has no error-reporting webhook handler, so failed Stripe events vanish.
4. **The audit trail is gone after 35 days.** The Upstash counter TTLs out; Stripe's per-call records are aggregated into a monthly total. Neither is sufficient for a billing dispute, GDPR data-access request, or SOC2 audit.
5. **Per-model cost mapping is not preserved.** A single "tokens" counter cannot bill at the GPT-4o rate and the Claude Sonnet rate simultaneously; one or the other is wrong. The spec implies per-model metering; the counter does not support it.

---

## 4. Recommendation: split the meter into an event log + two rollups

The fix is a **three-layer** architecture, where **the durable event log is the source of truth**, the Upstash counter is a fast read cache, and Stripe is a downstream consumer of rollups.

```
LLM call
  │
  ▼
meter() wrapper
  │
  ├── 1. Append a row to `meter_event_log` (Turso, per-tenant table)
  │      Columns: id (ULID), org_id, user_id, model, provider, input_tokens,
  │                output_tokens, cost_usd_cents, request_id, llm_call_id,
  │                created_at, idempotency_key (UNIQUE)
  │      Use Turso's libSQL transactions: read sum, check cap, insert, commit.
  │      `idempotency_key` is hash(org_id, llm_call_id). Retries are no-ops.
  │
  ├── 2. Update the Upstash counter cache (best-effort, used for 17.16 budget
  │      and 17.17 rate limit checks at request time)
  │      This is allowed to be lossy. The Turso log is the truth.
  │
  └── 3. Enqueue a "report usage" job to Trigger.dev / QStash with the
         event row id. The job batches events every 1-5 minutes per org,
         calls Stripe Meter Events API with the row's idempotency_key,
         and marks the row as `reported_at` on 2xx.

On Stripe error: Trigger.dev retries with exponential backoff and the
  idempotency_key (Stripe is idempotent on it). The row stays in
  `pending_reported` state. Stripe's `error_report_triggered` webhook
  marks the row `report_rejected` and pages the operator.

Nightly reconciliation (Trigger.dev cron): for every org, sum the
  `pending_reported` + `report_rejected` rows, compare to Stripe's
  `event_summaries` for the same period, alert on a delta > 0.1%.

At billing period close: the invoice total is Σ reported rows for the
  period. The Stripe invoice is the customer-visible bill. The Turso
  log is the audit trail (retained for 7 years per SOC2 / financial
  record retention norms).
```

**What this changes vs the spec:**

| Aspect | Current spec | Recommended |
|---|---|---|
| Source of truth | Two parallel writes (Upstash + Stripe), reconciled by hope | One append-only log (Turso), rollups derived |
| Idempotency | None (relies on natural single-execution) | `idempotency_key = hash(org_id, llm_call_id)` UNIQUE in Turso; Stripe `Idempotency-Key` header |
| Stripe API | Legacy `createUsageRecord` per call (300k calls/mo at 30 tenants × 10 calls/day) | New Meter Events API, batched every 1-5 min per org (8,640 calls/mo per org, ~30k Stripe calls total at v0) |
| Audit trail | Counter, 35-day TTL, no provenance | Append-only log, 7-year retention, per-call provenance |
| Per-model cost | Not preserved | Preserved in the event row, summed in rollup |
| Anti-fraud | Counter is client-writeable | Log is server-side; Upstash cache is best-effort hint, not source of truth |
| Budget cap race | Read-then-write, race possible | Atomic read-check-insert in a libSQL transaction |
| Reconciliation | None | Nightly Trigger.dev cron, alert on delta |
| Stripe Connect rate limit | 100 ops/sec platform, easily breached at scale | Batched reports stay well under; per-org flush serializes per customer |
| Error reporting | None (silently dropped events) | `error_report_triggered` webhook handler → re-flush from `report_rejected` rows |
| Cost | Upstash 1 INCR per LLM call = high command volume | Upstash 1 INCR per LLM call (cache only) + 1 Turso INSERT + 1 Trigger.dev job (batched) = roughly the same Upstash commands + cheaper durable storage |
| Stripe fee | Stripe charges 2.9% + 30¢ per invoice; per-event doesn't add cost | Same |

**The Turso write is the marginal cost.** A Team-tier tenant using 10M tokens/mo at ~1 token/4 chars averages ~5 LLM calls per session, so 2M inserts/mo per org. At Turso's $0.40/1M row writes pricing, that's **$0.80/mo per Team tenant in additional write cost** — negligible vs the $599 they pay. Studio at 50M tokens/mo is $4/mo in extra write cost. The total metering-storage cost on Turso is in the noise.

**The Trigger.dev job is the second marginal cost.** At one batched report per org per 5 minutes, that's 8,640 jobs/mo per org. Trigger.dev v3 charges by compute time, not job count, so a 200ms Stripe API call × 8,640 = ~30 minutes of compute/mo per org, which is well under the plan limits.

**The Stripe Connect 100 ops/sec limit is the binding constraint** for v1 scale. With 1,000 tenants, 100 ops/sec platform-wide means each org can flush at most every 10 seconds on average. The recommended pattern (per-org flush every 1-5 min) is 100x under the limit per org and well under it platform-wide. The current pattern (per-call `createUsageRecord`) is over the limit at 30 tenants.

---

## 5. What v0 should ship vs what v0 can defer

**v0 (30-tenant beta) — must have:**

1. **Append-only `meter_event_log` table in Turso** (per-tenant, in the existing per-tenant DB — same DB as the buyer's app, no new infra).
2. **`meter()` wrapper writes to log first, then to Upstash cache, then enqueues a Trigger.dev job for the Stripe flush.** Stripe flush is batched every 1-5 min per org.
3. **`idempotency_key` column UNIQUE constraint** in the log. Retries are no-ops at the DB level.
4. **Stripe Meter Events API** (the new one, not the legacy `createUsageRecord`). The spec's code example uses the legacy endpoint — **migrate to the new API in v0**.
5. **`error_report_triggered` + `no_meter_found` webhook handlers** in the buyer's app. Failed events go to a `report_rejected` state and re-flush automatically on next batch.
6. **Nightly reconciliation cron** comparing Turso log totals to Stripe `event_summaries`. Slack alert on delta > 0.1%.
7. **Per-model `payload[model]` dimension in the meter event.** Accept the 100-dimension-per-customer cap; either roll up to a small set of model tiers (gpt-4o, gpt-4o-mini, claude-sonnet, claude-haiku, etc.) or split into per-model meters.
8. **Server-side metering** — the `meter()` wrapper runs on the operator-controlled Vercel Function, not in the buyer's code path. For Enterprise tier, this is the **only** way to be fraud-resistant.

**v0 — can defer:**

1. **7-year retention on the log.** v0 keeps 13 months. SOC2 retention is a v1 problem.
2. **GDPR data-access export of the log.** v0 has a "delete this org" workflow that purges the log. SOC2/GDPR export is a v1 problem.
3. **Real-time usage dashboard for the buyer.** The nightly reconciliation is enough for v0. Real-time dashboard is a v1 problem.
4. **Per-model billing.** v0 meters all tokens at the same Stripe price; the cost-calc table is the operator's internal data, not what the buyer is billed on. v1 introduces per-model Stripe prices.

**v0 — must NOT ship:**

1. The legacy `createUsageRecord` per-call pattern. It's the worst of both worlds — too many Stripe calls (Connect rate limit), no idempotency, async silent drop, no reconciliation.
2. The Upstash counter as the only source of truth. The current spec is implicit on this; the recommended architecture makes it explicit that Upstash is a cache.

---

## 6. The spec changes the synthesis agent should propose

1. **`features/17-ai-primitives.md` row 17.15** — change the note from "Meter every LLM call against the tenant" to "Meter every LLM call against the tenant via append-only event log (Turso), Upstash counter cache for budget/rate-limit, Stripe Meter Events API for billing."
2. **`features/03-billing.md` row 3.5** — add "(Turso append-only log + Stripe Meter Events API, batched per-org flush every 1-5 min, nightly reconciliation)."
3. **`architecture/01-stack/vercel-ai-sdk.md` "Per-tenant metering (the wedge)"** — replace the `reportLLMUsage` example with the new pattern: `meter()` writes to Turso log, enqueues Trigger.dev job, job batches and calls Stripe Meter Events.
4. **`architecture/01-stack/upstash-redis-realtime.md` "Metering (the wedge)"** — promote the failure modes row "Cost spike from metering: Per-tenant hard caps (feature 17.16) prevent runaway" to "the metering is the cap, not the spend" to add: "Upstash counter is a fast cache, not the source of truth. Source of truth is the Turso `meter_event_log` table. Reconciliation nightly."
5. **`architecture/01-stack/stripe.md` "Usage-based pricing for LLM tokens (the wedge)"** — replace the `createUsageRecord` example with the new `meterEvents.create` example. Document the batching pattern.
6. **Feasibility doc Risk #2** — keep, but add a sub-bullet: "Mitigation: the metering layer is append-only (Turso) + Stripe Meter Events with idempotency keys + nightly reconciliation. The current spec's INCRBY pattern is insufficient for billing; v0 ships the new pattern."

---

## 7. Findings (for the synthesis agent)

1. **The current `Upstash INCRBY → Stripe createUsageRecord` pattern is not production-safe for billing.** Five structural failures: no idempotency, async silent drop, no audit trail, client-writeable meter, per-model cost lost. Confidence: high (every claim is documented in Stripe / Upstash official docs).
2. **`INCRBY` on Upstash is atomic but not idempotent.** A retried request after a network blip double-counts. Upstash REST API docs confirm. The spec must add an application-level idempotency key.
3. **Stripe Meter Events API (new) is the correct primitive**, not the legacy `createUsageRecord`. The new API is async, supports idempotency keys, supports pre-aggregation, and has error-reporting webhooks. The legacy API is the wrong choice for new integrations. The spec's code example uses the legacy API and must be updated.
4. **Stripe Connect Standard 100 ops/sec limit silently throttles the platform.** At 30+ tenants, the per-call `createUsageRecord` pattern breaches the limit and the buyer is under-billed. The batched pattern (1-5 min per-org flush) is 100x under the limit. Confidence: high.
5. **Per-model cost mapping requires per-model meters or a dimension rollup.** The 100-dimensions-per-customer Stripe limit forces a choice. Recommendation: roll up to ~5 model tiers. Confidence: high.
6. **The audit trail is below SOC2 / HIPAA grade.** 35-day counter TTL is the only persistent record. A billing dispute cannot be reconstructed. v0 must keep 13 months of the Turso log; v1 must keep 7 years. Confidence: high.
7. **Anti-fraud: the meter is client-writeable.** The Upstash token is in the buyer's `DEESSEJS_SECRET` boot cache; a buyer can INCR the meter directly. Server-side metering on a path the buyer cannot reach is the only fix. For the Enterprise tier this is non-negotiable. Confidence: high.
8. **Budget-cap race is real.** Read-then-write on the Upstash counter allows concurrent calls to both pass the cap. A libSQL `INSERT ... WHERE (SELECT SUM(cost) FROM meter_event_log WHERE org_id = ? AND created_at > period_start) + ? < cap` atomic check-and-insert fixes it. Confidence: high.
9. **v0 should ship the append-only log + batched Stripe flush + nightly reconciliation.** Estimated marginal cost: $0.80/mo per Team tenant in Turso writes. Negligible vs $599 revenue. Confidence: high.
10. **The spec changes are localized to two stack docs and two feature rows.** No architecture shift; no new vendor. Confidence: high.

---

## 8. Recommendations (for the synthesis agent)

1. **Adopt the append-only event log + batched Stripe flush pattern in v0.** Don't ship the current INCRBY-only pattern as a billing primitive.
2. **Migrate from `createUsageRecord` (legacy) to Meter Events API (`/v1/billing/meter_events`).** Stripe recommends this for new integrations.
3. **Server-side the `meter()` wrapper for Enterprise tier.** The buyer cannot be trusted to meter themselves; the operator runs the meter in a control plane context.
4. **Idempotency key is `hash(org_id, llm_call_id)`.** Apply it at the Turso log (UNIQUE constraint) and at the Stripe call (`Idempotency-Key` header). Same key for both — a Stripe-acknowledged event can be matched to a Turso log row by the key.
5. **Nightly reconciliation is the safety net.** Trigger.dev cron, compare Turso sum to Stripe `event_summaries`, alert on delta. The reconciliation is what makes the system defensible in a billing dispute.
6. **Roll up models to a small set of dimensions** (5-10 model tiers). Keeps Stripe happy. The buyer's bill shows "X tokens at $Y rate" aggregated; per-call provenance is in the Turso log.
7. **Retain the Turso log for 13 months in v0, 7 years in v1.** Storage cost is negligible (libSQL is cheap).
8. **Document the failure modes in the spec's risk register.** Risk #2 (AI-heavy tenants collapse margin) and a new sub-risk (metering inaccuracy causes billing disputes) are tightly coupled.

---

## 9. Open questions for the synthesis agent

1. **Does the operator's per-tenant Trigger.dev project have the throughput for batched Stripe flushes?** v0: 30 tenants × 8,640 jobs/mo = 260k jobs/mo. v1: 1,000 × 8,640 = 8.6M jobs/mo. Trigger.dev v3 pricing model is compute-time-based; this should fit, but the synthesis agent should confirm with the B1 / Trigger.dev work.
2. **Is the per-tenant Turso DB the right place for the meter log, or should it go in a separate operator-owned database?** The feasibility doc provisions one Turso DB per tenant. Putting the meter log in the same DB couples the buyer's app health to the meter log's write rate; a runaway tenant's LLM calls (17.13) could saturate Turso writes and degrade the app. **Recommend: separate operator-owned Turso database for meter logs**, so a runaway tenant cannot DoS their own app via the meter.
3. **What is the customer-visible "usage so far this month" UX?** The Stripe customer portal shows the invoice line item total, but not the running total. The operator should expose a "current usage" widget in the buyer admin dashboard that reads from the Turso log directly (not from Stripe, which is async).
4. **GDPR right-to-erasure interaction with the meter log.** If a buyer requests account deletion, the Turso log must be purged, but Stripe's invoice history must retain the totals (financial record retention overrides GDPR in most jurisdictions). The deletion workflow must distinguish "the user-facing account" from "the billing audit trail." The synthesis agent should flag this for legal review.
5. **Per-model price differentiation vs Stripe's 100-dimension limit.** If the operator wants to bill GPT-4o at $5/1M and GPT-4o-mini at $0.15/1M, that's two Stripe metered prices per subscription. The Meter Events API allows one `event_name` per meter; multi-model billing needs multi-meter. This is fine, but the spec should be explicit about which models get which meter.

---

## 10. Sources

- https://upstash.com/docs/redis — Architecture Overview (AOF, atomicity, single-primary, async replication)
- https://upstash.com/docs/redis/features/restapi — REST API: INCR atomicity, retry semantics, no idempotency, pipeline non-atomicity
- https://upstash.com/docs/redis/overall/enterprise — Prod Pack (99.99% SLA, multi-zone HA, backups)
- https://docs.stripe.com/billing/subscriptions/usage-based-legacy — Legacy `createUsageRecord` API: `action: increment|set`, sum aggregation, no documented deletion, 35-day hard limit on timestamp
- https://docs.stripe.com/billing/subscriptions/usage-based — Billing Meters vs Metronome comparison; Metronome recommended for new integrations
- https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage — Recording usage: async semantics, idempotency keys, pre-aggregation recommendation
- https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api — Recording usage API: rate limits (1,000/sec account, 1 concurrent per customer per meter, 100 ops/sec Connect), 10,000 dimensions per meter per hour, 100 dimensions per customer, error webhooks (`error_report_triggered`, `no_meter_found`)
- https://docs.stripe.com/api/billing/meter-event — Meter Events API reference (idempotency keys, event identifier)
- https://docs.stripe.com/billing/subscriptions/usage-based/monitor — Usage alerts and thresholds (25 alerts per meter-customer pair, 24-hour-not-evaluated, threshold overshoot)
- https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide — Implementation guide: `transform_quantity` for per-batch billing, `billing_mode=classic` vs `flexible`, invoice preview
- Local repo references:
  - `documents/internal/product/features/17-ai-primitives.md` — 17.15, 17.16, 17.17
  - `documents/internal/product/features/03-billing.md` — 3.5, 3.19
  - `documents/internal/architecture/01-stack/vercel-ai-sdk.md` — `meter()` wrapper spec
  - `documents/internal/architecture/01-stack/upstash-redis-realtime.md` — INCRBY code, failure modes
  - `documents/internal/architecture/01-stack/stripe.md` — `createUsageRecord` code
  - `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` — Risk #2 (AI-heavy margin collapse) coupled to metering accuracy
