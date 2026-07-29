# Upstash Redis + Upstash Realtime

## Decision

**Upstash Redis** (REST API) for caching, sessions, rate limiting, and metering. **Upstash Realtime** on top of Upstash Redis for in-app notifications and any pub/sub use case.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

Upstash is used by:

- **Sessions** (Better Auth plugin backend, per `better-auth.md`).
- **Rate limiting** (Better Auth plugin + per-endpoint).
- **Caching** (any hot data path that benefits from a TTL'd cache).
- **Per-tenant metering** (LLM tokens, API calls, etc., per `vercel-ai-sdk.md`).
- **In-app notifications** (Upstash Realtime, per feature 11.1).
- **Pub/sub** (any future use case: real-time dashboards, live updates, etc.).

Upstash is **not** used for:

- The Postgres database (that's Postgres via Drizzle).
- File storage (that's Cloudflare R2).
- Long-running jobs (that's Trigger.dev for workflows, QStash for cron).

## What Upstash gives us

1. **REST API, not TCP.** Works on edge runtimes (Vercel Edge, Cloudflare Workers) without a long-lived connection.
2. **Per-request pricing.** Generous free tier (256MB, 500K commands/month). Buyer never hits a surprise bill.
3. **Global low-latency.** Multi-region replicas.
4. **Realtime is built on Redis pub/sub.** Typed SSE channels, no third-party dashboard.
5. **Upstash Ratelimit** for rate limiting (used by Better Auth).

## Why Upstash (not self-hosted Redis, not Cloudflare KV, not Vercel KV)

| Alternative | Why not |
|---|---|
| **Self-hosted Redis (Upstash, Render, etc.)** | TCP connection, harder on edge runtimes. More ops burden for the buyer. |
| **Cloudflare KV** | Eventually consistent. Wrong semantics for sessions and rate limiting. |
| **Vercel KV** | Same as Upstash under the hood (now rebranded). Upstash is the canonical choice. |
| **In-memory (per-instance)** | Doesn't work for serverless. State is lost between requests. |
| **Memcached** | No pub/sub, no persistence. |

Upstash wins on:

- **Edge-compatible** (REST API).
- **Realtime built in** (typed SSE channels).
- **Per-request pricing** fits the SaaS template buyer model.
- **Single vendor for cache + rate limit + realtime + metering.**

## Architecture

```
App → Upstash REST API
       │
       ├── Sessions (Better Auth plugin)
       ├── Rate limits (Better Auth + per-endpoint)
       ├── Meter counters (per-tenant LLM tokens, API calls)
       ├── Cache (TTL'd by feature)
       └── Realtime channels (in-app notifications, live updates)
```

All Upstash access goes through a single client (`apps/template/packages/upstash/`) for connection pooling and observability.

## Realtime channels pattern

For in-app notifications (feature 11):

```ts
import { Realtime } from '@upstash/realtime';

const realtime = new Realtime();

const channel = realtime.channel(`org:${orgId}:user:${userId}:notifications`);
await channel.emit('new-notification', { id, type, title, body, link });
```

The client subscribes via a typed SSE endpoint. Messages arrive in <100ms globally.

## Rate limiting

- **Per-IP** (sign-up, sign-in) — Better Auth plugin.
- **Per-API-key** (public REST API) — custom middleware.
- **Per-org** (heavy operations like LLM calls) — feature 17.17.
- **Per-tenant** (storage, jobs) — feature 6.x.

The pattern: a `rateLimit(key, options)` helper backed by Upstash Ratelimit, used at every protected boundary.

## Metering (the wedge)

Per-tenant metering uses Upstash counters:

```ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// On every LLM call
await redis.incrby(`meter:${orgId}:llm:tokens:${YYYYMM}`, tokenCount);
await redis.expire(`meter:${orgId}:llm:tokens:${YYYYMM}`, 60 * 60 * 24 * 35); // 35 days
```

The billing system reads these counters monthly and reports to Stripe metered usage (feature 3.5).

## Failure modes

| Failure | Mitigation |
|---|---|
| Upstash outage | App degrades: sessions may be lost (force re-login), rate limits may not enforce (temporarily), but the app still works. |
| Latency spike on Upstash | Read paths fall back to Postgres. Write paths retry with exponential backoff. |
| Cost spike from metering | Per-tenant hard caps (feature 17.16) prevent runaway. The metering is the cap, not the spend. |

## Cross-references

- [`../10-decisions/`](../10-decisions/) — ADRs for sessions, rate limiting, metering (when written).
- [`../../product/features/11-in-app-notifications.md`](../../product/features/11-in-app-notifications.md) — the in-app notifications feature.
- [`../../product/features/17-ai-primitives.md`](../../product/features/17-ai-primitives.md) — AI primitives that use metering.
- [`./better-auth.md`](./better-auth.md) — Better Auth uses Upstash as the rate-limit backend.
- [`./vercel-ai-sdk.md`](./vercel-ai-sdk.md) — AI SDK calls go through Upstash-backed metering.
