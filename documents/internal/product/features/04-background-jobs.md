# 4. Background jobs

> Trigger.dev v3 is the floor. Code-first, not queue-config. Per-org rate limiting is the per-tenant-axis differentiator.

| # | Feature | Status | Source | Note |
|---|---|---|---|---|
| 4.1 | Code-first jobs (Trigger.dev) | ✅ | C | Not queue config; real code |
| 4.2 | Scheduled jobs (cron) | ✅ | C | Trigger.dev schedules |
| 4.3 | Delayed jobs | ✅ | C | `send.at(...)` API |
| 4.4 | Recurring jobs | ✅ | C | Daily, weekly, monthly |
| 4.5 | Job retries (exponential backoff) | ✅ | C | Trigger.dev default |
| 4.6 | Job queues (named) | ✅ | C | Priority lanes |
| 4.7 | Concurrency control | ✅ | C | Per-queue and per-org |
| 4.8 | Dead letter queue | ✅ | C | Failed jobs land here; UI to inspect/replay |
| 4.9 | Long-running tasks (hours) | ✅ | C | Trigger.dev v3 supports |
| 4.10 | Webhook triggers (HTTP) | ✅ | C | Incoming webhook → job |
| 4.11 | Job observability (logs, traces) | ✅ | C | Trigger.dev dashboard |
| 4.12 | Job webhooks (out) | ✅ | C | For buyer integrations |
| 4.13 | Per-org rate limiting | ✅ | D | Job queue is org-scoped; rate limit configurable per org |

**Notes:**
- Trigger.dev v3 is the floor. We don't ship a queue-from-scratch option.
- 4.13 (per-org rate limiting on jobs) is subtle but valuable: prevents one noisy org from starving the others.

## Cross-references

- Parent: [README.md](./README.md)
- Deep dive: [`../architecture.md`](../architecture.md) — Trigger.dev integration
- Related: [07-api.md](./07-api.md) — webhook triggers from public API
- Related: [17-ai-primitives.md](./17-ai-primitives.md) — AI agents run as jobs
