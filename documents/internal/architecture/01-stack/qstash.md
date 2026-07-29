# Upstash QStash

## Decision

**Upstash QStash** for simple cron, delayed delivery, and fan-out — alongside Trigger.dev, which handles the heavier workflows.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked (alongside Trigger.dev — see `trigger-dev.md`)

## Scope

QStash is used for:

- **Simple cron** (e.g. "send a digest email every Monday at 9am").
- **Delayed delivery** (e.g. "send this email in 1 hour if the user hasn't acted").
- **Fan-out** (e.g. "send this webhook to 1000 subscribers").
- **Lightweight retries** for at-most-once-with-retry semantics.

QStash is **not** used for:

- **Complex workflows** — that's Trigger.dev.
- **Long-running tasks** (≥5min) — QStash's max duration is shorter than Trigger.dev's.
- **Stateful orchestration** — QStash is fire-and-forget or scheduled.
- **Dashboards and observability** — QStash is minimal; Trigger.dev's dashboard is the operator UI.

## What QStash gives us

1. **HTTP-based.** Publish a message to a queue by POSTing to an HTTP endpoint. No SDK ceremony.
2. **Schedule with cron syntax** or delay syntax (`{ "delay": 3600 }`).
3. **Built-in retries** with exponential backoff.
4. **Dead letter queue** for failed deliveries.
5. **Fan-out** via topics (one publish → N subscribers).
6. **Serverless pricing.** Cheap for our use case.

## Why QStash (not just Trigger.dev)

| Trade-off | Trigger.dev | QStash |
|---|---|---|
| Setup cost per job | Higher (define job, register, configure schedule) | Lower (one POST) |
| Per-job dashboard | Yes (logs, retries, history) | No (just delivery state) |
| Cron syntax | Yes | Yes |
| Long-running (≥5min) | Yes (hours) | No (max ~5min) |
| Fan-out | Manual | Native (topics) |
| Pricing | Per job run | Per message |

For a simple "send digest every Monday at 9am", QStash is one HTTP call. Trigger.dev requires defining a job, registering it, and managing the schedule in code. The cron-only use case doesn't benefit from Trigger.dev's heavier machinery.

## Architecture

```
App → QStash HTTP API
       │
       ├── Schedules (cron)
       ├── Delayed messages
       ├── Fan-out topics
       └── Dead letter queue (for failed deliveries)
```

QStash is called from API routes, server actions, or other jobs (yes, a Trigger.dev job can enqueue a QStash message).

## Example: weekly digest

```ts
// apps/template/packages/jobs/schedule-weekly-digest.ts
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

await qstash.publishJSON({
  url: `${process.env.APP_URL}/api/cron/weekly-digest`,
  cron: '0 9 * * 1', // Monday 9am
  body: { orgId },
});
```

The receiving endpoint (`/api/cron/weekly-digest`) handles the digest logic. QStash retries on failure.

## Example: delayed "forgot to action" reminder

```ts
// In a server action, after a user signs up but doesn't act for 1 hour
await qstash.publishJSON({
  url: `${process.env.APP_URL}/api/emails/forgot-to-act`,
  delay: 3600, // 1 hour in seconds
  body: { userId, email },
});
```

If the user acts before the hour is up, our handler can publish a cancel (or just ignore the message — it's idempotent).

## Fan-out

For broadcasting to many subscribers (e.g. webhook fan-out):

```ts
// Publish to a topic, not a single endpoint
await qstash.publishJSON({
  topic: 'webhooks-out',
  body: { event, payload },
});

// Subscribers receive the message
await qstash.subscriptions.create({
  topic: 'webhooks-out',
  endpoint: 'https://customer1.com/webhook',
});
```

## Failure modes

| Failure | Mitigation |
|---|---|
| QStash outage | Schedule retries. Critical paths fall back to Trigger.dev or in-process cron. |
| Missed delivery (downstream 5xx) | QStash retries with backoff. After max retries, message goes to DLQ. |
| Latency on delivery | Acceptable for cron use case (1-minute slop is fine). For latency-sensitive paths, use Trigger.dev. |

## Constraints

- **No long jobs.** If a job takes more than 5 minutes, it goes to Trigger.dev.
- **No state in QStash.** QStash messages are JSON payloads. State lives in our DB.
- **Idempotent receivers.** Every QStash endpoint must handle the same message twice (retries).

## Cross-references

- [`./trigger-dev.md`](./trigger-dev.md) — the workflow / long-running sibling.
- [`./upstash-redis-realtime.md`](./upstash-redis-realtime.md) — Upstash vendor context.
- [`../10-decisions/`](../10-decisions/) — ADR for background jobs (when written).
- [`../../product/features/04-background-jobs.md`](../../product/features/04-background-jobs.md) — the jobs feature inventory.
