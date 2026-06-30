---
name: project-cloud-portability-tax
description: The 5 Vercel-specific + 3 operator-owned surfaces that don't move on eject — 4-6 hours of DevOps, not a copy-paste
metadata:
  type: project
---

The "managed SaaS template" pitch depends on the **escape hatch** being real. C3 (escape-hatch-and-portability-2026-06.md) confirms the **data** is portable (18 of 23 v1 surfaces move with `dump.sql` + REST SCAN + rclone sync), but the **platform plumbing** has 5 Vercel-specific surfaces + 3 operator-owned surfaces that the buyer has to manually remediate. Total: **4-6 hours of DevOps, not a copy-paste**.

This is fine for v0 (the buyer chose Cloud knowing the trade-off), but it must be **honest marketing** and the **remediation runbook must exist** before public launch.

## The 5 Vercel-specific surfaces (buyer must re-deploy)

| # | Surface | What it does | Why it doesn't move | Remediation |
|---|---|---|---|---|
| 1 | **Fluid Compute** | The runtime for all Vercel Functions (active-CPU billing, snapshotting, multi-AZ failover) | Vercel-only primitive. No equivalent on Fly.io / Railway / self-host. | Re-deploy to whatever runtime the buyer uses. Vercel Functions become Node.js on the buyer's platform; the `fluid: true` flag disappears. |
| 2 | **Vercel Blob** | Object storage with edge caching | Vercel-only primitive. | Re-point to the buyer's S3/R2/equivalent. Update the `BLOB_READ_WRITE_TOKEN` env var. |
| 3 | **Vercel Cron** | Scheduled jobs (e.g. daily metering report, weekly digest) | Vercel-only primitive. The `vercel.json` cron config is Vercel-specific. | Re-author as `crontab` on the buyer's host, or replace with GitHub Actions / a Trigger.dev cron. |
| 4 | **Edge runtime** | The 25s-response / 300s-stream runtime used by `app.deessejs.com` control plane (NOT the tenant apps) | Cloudflare Workers is the only control plane runtime at v0. Tenant apps are Node.js on Vercel and don't use Edge. | The buyer doesn't get the control plane on eject (it's operator-owned). They don't need to remediate this for tenant functionality. |
| 5 | **Vercel KV** | Redis-compatible key-value store (we use Upstash, NOT Vercel KV — but if any code accidentally imports `@vercel/kv`, it breaks on eject) | Vercel-only. We don't use it. | Search the codebase for `from "@vercel/kv"` — should be zero matches. If any exist, replace with `@upstash/redis` before eject. |

## The 3 operator-owned surfaces (buyer must transfer ownership)

| # | Surface | What it is | Why it doesn't move | Remediation | Time |
|---|---|---|---|---|---|
| 6 | **Cloudflare DNS zone** (`tenants.deessejs.com`) | The wildcard A/AAAA that resolves `*.tenants.deessejs.com` to the operator's Vercel team | The zone is in the operator's Cloudflare account. Wildcard means every tenant subdomain points to the operator's infra. | **NS delegation to the buyer's registrar.** The buyer re-points nameservers at their new DNS host. Operator exports the BIND zone file (256 KiB cap, see A2). | 30-60 min including DNS propagation wait |
| 7 | **Resend account + sender domain** | The `mail.{tenant}.deessejs.com` sender domain in the operator's Resend | The Resend account is the operator's. The sender domain is on the operator's Resend. | **Domain ownership transfer** from the operator's Resend to the buyer's Resend. The buyer must create their own Resend account first. | 1-2 hours including DNS verification |
| 8 | **Trigger.dev org** | The per-tenant project that lives in the operator's shared org | Per-tenant Trigger.dev project is created in the operator's org (Step 5 of provisioning flow). Project definitions are in the buyer-owned template repo, but run history is in the operator's org. | **Project export** via `trigger.dev` CLI (`npx trigger.dev@latest project export`) + import to buyer's own org. In-flight runs are lost. | 1-2 hours |

## The 1 operator-only surface (buyer doesn't get)

| # | Surface | What it is | Why it doesn't move |
|---|---|---|---|
| 9 | **Admin dashboard (21.x)** | The *operator*'s admin UI for managing all tenants — p95 latency per tenant, error rates, billing reconciliation, support tooling | Operator-only. The buyer has their own RBAC admin (surface 2). On eject, 21.x is gone; the buyer runs their own equivalent if they want one. |

## The 18 portable surfaces (move with `dump.sql` + REST SCAN + rclone sync)

Auth, Orgs/RBAC (Turso half of) Billing, Onboarding, Documentation, Blog, Marketing & sales, AI primitives (Turso half — conversation history, provider API keys belong to the buyer), Security & compliance, Performance & DX, Cross-cutting, SEO, Testing, UI, In-app notifications, i18n, CLI, SDK.

## Total eject time estimate (from C3)

- 30-60 min: BIND zone file export + NS delegation
- 1-2 hours: Resend domain transfer + DNS verification
- 1-2 hours: Trigger.dev project export + import
- 1-2 hours: re-deploying 5 Vercel-specific surfaces on the buyer's host
- **Total: 4-6 hours of DevOps work, plus propagation waits**

## How to handle "is Cloud lock-in?"

The honest answer for the marketing site is: **"data is yours, the platform is not."** 18 of 23 v1 surfaces move with a SQL dump + REST SCAN + rclone. The 8 non-portable surfaces above are **the platform tax** that the buyer is paying the operator to operate. This must be in the pricing page and the SLA.

**How to apply:** When asked "can a tenant leave?", point to C3 and this memory. The 4-6 hour DevOps session is the honest answer. The 18-of-23 portable data surfaces are the wedge against lock-in critique.

Related: [[project-cloud-vendor-stack]] (the 8 vendors that create this tax), [[project-cloud-v0-private-beta]] (the v0 plan that must include the eject runbook)