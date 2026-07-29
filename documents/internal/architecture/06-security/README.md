# `06-security/` — Security architecture

## Purpose

Threat model, OWASP coverage, secrets management, data handling. The architecture-level specs that turn the security feature inventory into a defensible posture.

This folder is for **decisions and rationale**, not runbooks (those live in `09-operations/runbooks/`).

## What's in here

- `README.md` (this file) — entry point + threat-model summary.
- `threat-model.md` — STRIDE-style analysis: assets, trust boundaries, threats, mitigations.
- `owasp-coverage.md` — the OWASP Top 10 mapped to our features and ADRs.
- `secrets-management.md` — where secrets live, how they rotate, how leaks are detected.
- `data-handling.md` — GDPR, encryption at rest / in transit, retention, deletion, portability.

## Threat model at a glance

- **Assets:** tenant data, LLM API keys, Stripe keys, auth sessions, billing data, AI conversation history.
- **Trust boundaries:** web ↔ API, API ↔ DB, app ↔ third-party (Stripe, Resend, R2, Upstash, AI providers), buyer app ↔ buyer's end users.
- **Top threats:** cross-tenant data leak, auth bypass, Stripe webhook spoofing, LLM cost abuse, secret leak via logs, prompt injection.
- **Mitigations:** see the files above; OWASP Top 10 reviewed pre-launch.

## Conventions

- **No secrets in code, env examples, or logs.** `.env.example` is placeholder-only.
- **No PII in logs.** Structured logging with redaction at the framework level.
- **All new features touch this folder** in their PR description: "threat model affected? OWASP category? data handling change?".
- **Certifications (SOC2, HIPAA) are explicitly out of scope** for v1. Architecture supports, certification is the buyer's journey.

## Related

- [`../product/features/18-security-and-compliance.md`](../../product/features/18-security-and-compliance.md) — the security feature inventory.
- [`01-stack/better-auth.md`](../01-stack/better-auth.md) — auth provider and its security model.
- [`02-data-model/`](../02-data-model/) — schema-level security considerations.
- [`07-deployment/secrets-management.md`](../07-deployment/secrets-management.md) — where env vars live in each deploy target.
- [`09-operations/incident-response.md`](../09-operations/incident-response.md) — what to do when something goes wrong.
