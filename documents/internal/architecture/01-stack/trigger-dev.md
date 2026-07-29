# Trigger.dev

## Decision

**Trigger.dev v3** for code-first background jobs, workflows, and scheduled tasks that need retries, observability, or multi-step orchestration.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked (alongside QStash, which handles simple cron — see `qstash.md`)

## Scope

Trigger.dev is used for:

- **Workflow jobs** with retries, dependencies, and observability.
- **Long-running tasks** (hours) that need state and resume capability.
- **AI agent runs** that can exceed the 300s Vercel Function limit.
- **Webhook-triggered jobs** with complex orchestration.
- **Anything that needs the Trigger.dev dashboard** (logs, retries, run history).

Trigger.dev is **not** used for:

- **Simple cron** (e.g. "run this every morning at 3am") — that's QStash.
- **Synchronous processing** — that's in the request handler.
- **One-off scripts** — that's `scripts/` or a CLI command.

## What Trigger.dev gives us

1. **Code-first jobs.** Define jobs as TypeScript functions, not queue configuration. The job code is in our repo.
2. **Built-in retries with exponential backoff.** Configurable per job.
3. **Concurrency control.** Per-queue and per-tenant (feature 4.7, 4.13).
4. **Dead letter queue.** Failed jobs land here; inspectable and replayable.
5. **Long-running tasks.** v3 supports hours-long runs.
6. **Dashboard.** Logs, traces, run history. The operator UI (feature 4.11, 21.5).
7. **Webhooks in and out.** HTTP triggers and webhook emissions.
8. **Schedules (cron).** Native scheduling support.

## Why Trigger.dev (not Inngest, not BullMQ, not self-hosted)

| Alternative | Why not |
|---|---|
| **Inngest** | Event-driven model. Our jobs are code-first, not event-first. Trigger.dev's mental model fits better. |
| **BullMQ** | Self-hosted Redis queue. We'd build the dashboard, retries, and observability ourselves. |
| **AWS SQS + Lambda** | Vendor lock-in to AWS. Harder to develop locally. |
| **Cloudflare Workers + Cron Triggers** | Limited runtime (CPU time caps). Not enough for our workflows. |
| **Resend's scheduled sends** | For mail only. Not a general job runner. |
| **Vercel Cron** | Limited to short jobs. No retries, no dependencies, no dashboard. |
| **DIY with Postgres + cron** | We'd rebuild Trigger.dev badly. Months of work. |

Trigger.dev wins on:

- **Code-first, not config-first** — matches our "delete what you don't need" modular contract.
- **Built-in dashboard** — saves us from building one.
- **Per-tenant rate limits** — first-class via the concurrency API.
- **Long-running** — supports our AI agent use case.

## Architecture

```
App → Trigger.dev REST API
       │
       ├── Jobs (code in `apps/template/packages/jobs/`)
       ├── Schedules (cron definitions)
       ├── Webhooks (incoming HTTP triggers)
       └── Dashboard (logs, retries, run history)
```

Each job is a TypeScript file in `apps/template/packages/jobs/<job-name>.ts`. Jobs are triggered via the Trigger.dev SDK from API routes, server actions, or other jobs.

## Example: a webhook-triggered job

```ts
// apps/template/packages/jobs/onboarding-welcome.ts
import { event } from '@trigger.dev/sdk';

export const onboardingWelcome = event({
  name: 'onboarding.welcome',
  schema: z.object({ orgId: z.string(), userId: z.string() }),
  run: async ({ orgId, userId }) => {
    // 1. Create default org settings
    // 2. Send welcome email via Resend
    // 3. Schedule follow-up via QStash
    // 4. Track in analytics
  },
});
```

```ts
// Triggered from an API route
import { onboardingWelcome } from '@deessejs/jobs/onboarding-welcome';

await onboardingWelcome.trigger({ orgId, userId });
```

## Constraints

- **Long agent runs (≥300s) MUST run as Trigger.dev jobs**, not as Vercel Functions. This is enforced by code review.
- **Per-tenant concurrency** is configured for any job that touches tenant data (feature 4.13).
- **Dead letter queue** is monitored; failed jobs are alerted via the operator dashboard.
- **No raw queue access.** Always go through Trigger.dev SDK; no direct Redis-based queue manipulation.

## Why alongside QStash (not replacing it)

Trigger.dev is great for **workflows** but overkill for **simple cron**. QStash handles "run this at 3am every day" with one HTTP call. Trigger.dev requires defining a job, registering it, and managing the schedule.

The split:

- **Trigger.dev**: workflows with retries, dependencies, observability, long-running.
- **QStash**: simple cron, fan-out, delayed delivery.

Both are managed services. The buyer signs up for both at deploy time. See `qstash.md` for the QStash rationale.

## Cross-references

- [`./qstash.md`](./qstash.md) — the cron / delayed-delivery sibling.
- [`../10-decisions/`](../10-decisions/) — ADR for background jobs (when written).
- [`../../product/features/04-background-jobs.md`](../../product/features/04-background-jobs.md) — the jobs feature inventory.
- [`../../product/features/17-ai-primitives.md`](../../product/features/17-ai-primitives.md) — AI agents run as jobs.
- [`../09-operations/runbooks/`](../09-operations/runbooks/) — runbooks for job failures.
