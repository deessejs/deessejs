# `runbooks/` — Incident playbooks

## Purpose

One file per known incident type. Each runbook is a **checklist an on-call operator can execute under pressure** — short, imperative, copy-pasteable.

The rule: **if it can break, it has a runbook**. If something broke and there's no runbook, the first postmortem action is to write one.

## What's in here

One `<incident>.md` per known failure mode. Examples (not exhaustive):

- `db-connection-lost.md`
- `stripe-webhook-flood.md`
- `llm-cost-spike.md`
- `upstash-rate-limit-throttling.md`
- `r2-upload-failures.md`
- `trigger-dev-queue-backup.md`
- `oidc-provider-down.md`
- `deploy-failed-via-github-actions.md`

## Runbook template

Every runbook in this folder follows the same structure:

1. **Symptoms** — what the operator sees (alert text, dashboard panel, customer report).
2. **Severity** — Sev1 (revenue-impacting, all tenants), Sev2 (partial degradation), Sev3 (single tenant).
3. **Triage** — first 5 minutes: confirm the alert, identify scope, page the right person.
4. **Mitigation** — step-by-step, with copy-pasteable commands. **Stop the bleeding first, fix root cause second.**
5. **Verification** — how to know it's resolved.
6. **Escalation** — who to call if the runbook doesn't fix it.
7. **Postmortem trigger** — when this incident closes, schedule a postmortem and add a feedback loop (new alert, new test, new runbook).

## Conventions

- **Runbooks are tested.** If a runbook can't be rehearsed, it's not ready.
- **Outdated runbooks are dangerous.** If a step no longer works, fix the runbook before the next incident.
- **One runbook per failure mode.** Don't combine "DB down" and "DB slow" — they're different incidents with different mitigations.

## Related

- [`../README.md`](../README.md) — incident response framework.
- [`../observability.md`](../observability.md) — what alerts exist and why.
- [`06-security/`](../../06-security/) — security-incident runbooks may live there when they're security-specific.
