---
name: project-cloud-vendor-stack
description: Vendor stack baseline for DeesseJS Cloud v0 — Vercel Platforms, Turso, Upstash, Trigger.dev, Resend, Stripe Connect, Cloudflare DNS, CF Workers (control plane). Last re-verified 2026-06-26 via fresh deep-fetches.
metadata:
  type: project
---

The v0 stack is FIGURED OUT. The feasibility doc and `tech-2026-06.md` together confirm every primitive. **Do not re-debate the stack** in a new doc or PR — if you think a swap is justified, write a new A-doc (or A-extension) and get the user to sign off.

**Last re-verified against vendor sources:** 2026-06-26 (via `fresh search` + `fresh fetch` on official docs/changelogs). Three things moved since the last baseline pass — see "Drift since last baseline" at the bottom.

## The 8 vendors and their roles

| # | Vendor | What it does for Cloud | Why this vendor (not an alternative) | Key API or limit |
|---|---|---|---|---|
| 1 | **Vercel Platforms** | Per-tenant Vercel project under the operator's team account | Documented REST API for `POST /v11/projects` with `environmentVariables[]` and `oidcTokenConfig`. Multi-project per team is the native primitive for SaaS. | `POST /v11/projects`. `oidcTokenConfig.enabled: true, issuerMode: team`. Fluid Compute default since 2025-04-23. **`maxDuration=1800` per-function only during beta** (no project default >800s). 30-min support requires Node 20/22/24 or Python 3.12/3.13/3.14. **12-concurrent-builds ceiling on Pro.** |
| 2 | **Turso** (libSQL) | One DB per tenant, auth token minted by control plane | libSQL = SQLite-compatible, can `dump.sql` export for the escape hatch. Native multi-region replication. | `POST /v1/organizations/{op-org}/databases` + token mint. **Parent schema DB** (`--type schema`) for atomic migrations across child tenant DBs. Per-DB scoped tokens returned in PASERK seal bundle. |
| 3 | **Upstash Redis** | Regional Database with per-tenant `t:{tenantId}:` prefix | **Use Regional, NOT Global, for metering.** Global writes are billed × N regions (1 primary + each read region = $0.2/100K per region). For 30 tenants on Vercel us-east-1, Regional is sufficient. Global's eventual consistency is also wrong for billing reads. | `INCR` is **atomic, NOT idempotent** on retry — see [[project-cloud-metering-failure-modes]]. `@upstash/ratelimit` lib has separate idempotency story (TBD). |
| 4 | **Trigger.dev v4** (NOT v3) | Per-tenant project on a shared operator org | **v4 GA since 2025-08-18** — Waitpoints primitive gives native HTTP-callback idempotency keys + human-in-the-loop pause/resume. Changes the B4 §2 reconciliation story. v3 → v4 migration is documented as "few minutes, minimal code changes." | `POST /v4/projects` + env setup. Warm starts 100-300ms (v3 was "several seconds" cold). |
| 5 | **Resend** | Per-tenant sender subdomain on `mail.{tenant}.deessejs.com` | Domain lives in operator's Resend; transferred on eject. **Option A (single account) + domain-scoped API keys is the documented multi-tenant pattern.** Transactional-only API. | Domain ownership transfer required on eject (see [[project-cloud-portability-tax]]). **Eject = mail interruption during DNS re-propagation** (minutes to hours). Shared sender reputation is the operator risk — subdomain warm-up + monitoring mandatory. |
| 6 | **Stripe Connect Standard** | Buyer's own connected account; metered usage per tenant | **Stripe data already belongs to the buyer's connected account on creation** — escape hatch is free for the billing surface. | `stripe.subscriptionItems.createUsageRecord` with `Idempotency-Key` header. Idempotency-Key TTL **24h**, max 255 chars. POST-only. Replay includes 500s (semantically useful). 100 req/s per account default (200 on request). |
| 7 | **Cloudflare DNS** | Operator-owned `tenants.deessejs.com` zone, wildcard A/AAAA on first label | Wildcard DNS avoids per-tenant zone creation. **Wildcards are first-label-only** (`*.example.com` ✓, `foo.*.example.com` ✗) and **multi-level by default** (`*.example.com` covers `abc.example.com` AND `123.abc.example.com`). Specific records take precedence. Advanced nameservers (Enterprise) follow strict RFC 4592 — Standard nameservers (our plan) are more permissive. | `GET /zones/{id}/dns_records/export` for the BIND zone file (256 KiB cap). Wildcard certs need TXT DCV per hostname. |
| 8 | **Cloudflare Workers (Edge)** | Single Hono route handler at `app.deessejs.com` — the control plane | Incoming HTTP wall time is **UNLIMITED** while client connected (limits doc updated 2026-06-25). `waitUntil()` extends execution +30s after response/disconnect. CPU time 5-min cap (since 2025-03-25). 500 Workers/zone on Paid plan; 1,000 routes/zone; 100 custom domains/zone (use wildcard beyond). | Wall time unlimited (HTTP); 15 min for Cron/Queue/DO alarms; unlimited for DO RPC/Workflow steps. Workers Secrets are KMS-encrypted (acceptable v0; HSM = v2 upgrade). Ed25519 signing keypair lives in Workers Secrets. |

## The 1 piece of architecture that surprised me

The **control plane runs on Cloudflare Workers Edge, NOT Vercel**. `app.deessejs.com` is a single Hono route behind Cloudflare Access. The control plane is a separate runtime from the tenant apps (which run on Vercel).

**Why this matters for proposals:**
- Anything that needs to run synchronously during signup can **stream updates over a long-lived connection** — the 25s/300s envelope I used to cite is dead (limits doc was updated 2026-06-25).
- Anything that needs durable async work goes to Trigger.dev v4 jobs (now with Waitpoint idempotency).
- The control plane is the ONLY entity that holds the Ed25519 signing keypair for `DEESSEJS_SECRET`. Tenant apps verify; only the control plane mints.
- Cloudflare Workers Secrets are KMS-encrypted, which is acceptable for v0 (HSM is a v2 upgrade).

## What you CAN propose (within the stack)

- **New API calls against the same vendors.** E.g. a new Vercel project endpoint, a new Upstash command.
- **Re-configuring an existing vendor's primitives.** E.g. switching from shared Upstash to per-tenant dedicated DB for Enterprise tier.
- **Adding a sibling vendor that fills a gap.** E.g. Cloudflare R2 for object storage (mentioned in C3 §1 row 6 — `R2` is already in the stack, just not in this 8-vendor table because the table is about control plane + per-tenant, and R2 is "per-tenant prefix in a shared bucket").

## What you CANNOT propose without an A-doc

- Replacing any of the 8 vendors with an alternative.
- Adding a new vendor to the control plane hot path.
- Changing the Ed25519 / PASETO / `POST /exchange` / PASERK `seal` design (see [[project-deessejs-secret-paseto]]).

## Drift since last baseline (must propagate to docs)

Three things moved between the last README baseline and the 2026-06-26 fresh-fetches. None break the design — all are wins or clarifications.

1. **Trigger.dev v3 → v4 GA.** README still says v3. v4 ships Waitpoints, which changes B4 §2.
2. **CF Workers Edge wall time.** README says "25s-response / 300s-stream Edge envelope." Officially dead since today's limits doc update — HTTP wall-time is now unlimited while client connected.
3. **Upstash Global vs Regional for metering.** README implies Global. Global has two problems for metering: (a) writes cost × N regions, (b) eventual consistency = stale reads on counters. **Use Regional for metering** at 30 tenants. Global still makes sense for read-latency-sensitive workloads that are not billing.

Related: [[project-cloud-v0-private-beta]] (v0 plan that this stack serves), [[project-cloud-feasibility-staleness]] (the 300s claim that this stack is independent of), [[project-deessejs-secret-paseto]] (the secret design this stack protects)

**How to apply:** Anchor every Cloud architectural answer on this 8-vendor stack. If a question is "can we use X instead of Y?" — the answer is almost always no, unless you can name the constraint it lifts AND the constraint it introduces. When a vendor claim is dated >6 months, re-verify with `fresh fetch` against official docs before citing it.