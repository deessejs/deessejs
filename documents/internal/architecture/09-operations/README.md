# `09-operations/` — Operations handbook

## Purpose

What to do **after** the system is live. Observability, incident response, on-call, and runbooks for the most common (and most dangerous) failure modes.

This is for the operator (the buyer's SRE / internal team), not for end users. DeesseJS ships an admin dashboard for org-level admin; this folder is the *operator*-level playbook.

## What's in here

- `README.md` (this file) — entry point, observability stack, on-call philosophy.
- `observability.md` — what we measure, where (logs, metrics, traces), and what we alert on.
- `incident-response.md` — the severity matrix, the comms template, the postmortem process.
- `runbooks/` — one file per incident type (DB connection lost, webhook flood, LLM cost spike, etc.).

## Observability stack

- **Logs:** structured, JSON, level-based. Swappable backend (buyer picks).
- **Metrics:** request rate, error rate, latency p50/p95/p99, queue depth, job duration.
- **Traces:** OpenTelemetry, server-side only in v1. End-to-end traces cascade with the deferred observability feature (17.24).
- **Buyer-facing surface:** the admin dashboard ([feature 21.12 system health](../../product/features/21-admin-dashboard.md)) exposes the operator's view of the system.

## On-call philosophy

- We **do not** ship a v1 incident-management tool. Buyers wire their own (Incident.io, Firehydrant, etc.).
- We **do** ship the admin dashboard and the runbooks, so the operator can act on a page in <5 minutes for known issues.
- **Runbook-first.** Every alert links to a runbook. Every runbook ends with "if this didn't fix it, escalate to: ...".

## Conventions

- **Runbooks are checklists**, not essays. Short, imperative, copy-pasteable commands.
- **Incident postmortems are blameless** and live alongside the runbook that should have caught the issue.
- **An incident that recurs** gets a permanent fix in code, not a new runbook.

## Related

- [`runbooks/`](./runbooks/) — the playbooks.
- [`../product/features/21-admin-dashboard.md`](../../product/features/21-admin-dashboard.md) — the operator UI.
- [`06-security/`](../06-security/) — incident types that originate as security events.
- [`07-deployment/`](../07-deployment/) — deploy-time failure modes.
