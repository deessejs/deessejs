---
name: project-cloud-v0-private-beta
description: DeesseJS Cloud v0 plan — Q3 2026 launch, 30-tenant hard cap, $99/mo × 20 design partners, 87% gross margin floor, 4-6 min provisioning target
metadata:
  type: project
---

The v0 of DeesseJS Cloud is **private beta, Q3 2026, hard-capped at 30 tenants**. Every architectural decision in the Cloud space must pass through this filter.

## The v0 numbers (from the feasibility doc + tech-2026-06.md)

| Invariant | Value | Source | Hard? |
|---|---|---|---|
| Launch window | 2026-Q3 | Feasibility §Recommendation | Soft (slip to Q4 if needed) |
| Tenant cap at v0 | **30** | Feasibility §Recommendation | **Hard** — do not propose primitives that need >30 tenants to validate |
| Founder's rate for design partners | $99/mo (20 design partners max) | Feasibility P0 #5 | Hard |
| Public tiers (post-beta) | $299 / $599 / $999 | Feasibility P0 #3 | Soft — re-evaluate at GA |
| Usage-based overage | $1.50/1M LLM tokens, $0.50/1M Vercel invocations, $0.10/GB Trigger.dev compute | Feasibility P0 #3 | Soft — re-model under Fluid Compute active-CPU billing |
| Gross margin floor | **87%+ at Team-tier median usage** | Feasibility §Recommendation | **Hard** — any new primitive that breaks this gets rejected |
| Provisioning target (buyer signup → first 200 OK) | 4-6 min baseline → **2 min target** (C1.7 in tech-2026-06.md) | tech-2026-06 §C1 | Soft at v0, hard at GA |
| First-boot / cold start | 5-10s cold, 0.5-1s warm | tech-2026-06 §C1.2 row 9 | Soft |
| Vercel 12-concurrent-builds ceiling | ~480 tenants/day at 150s builds | Feasibility §Technical Feasibility | **Hard at v0** — fine for 30-tenant beta, a wall at >1000 tenants/mo |
| DEESSEJS_SECRET lifetime | 365 days default | B3 §1.1 | Soft — re-evaluate at GA |

## What v0 explicitly does NOT include

- **Public launch.** v0 is private beta only.
- **Multi-region.** Default `iad1`, `fra1` only.
- **Agency tier (white-label, multi-tenant for agencies).** v1+.
- **SOC2 / HIPAA / SSO.** v2 after Vercel Enterprise migration.
- **HSM-backed key custody.** v2.
- **5+5 design partner limit beyond 20.** 20 is the cap.

## The decision gates between v0 and GA

1. **Empirical gross margin validation** — actual AI-heavy tenant usage from the 30 beta tenants. Must hold 80%+ on real workloads.
2. **Noisy-neighbor validation on shared Upstash** — verify that the per-tenant `t:{tenantId}:` prefix is enough to isolate hot tenants. If not, graduate to dedicated Upstash DB per Enterprise tenant earlier.
3. **Vercel 12-concurrent-builds ceiling** — confirm onboarding at 100 tenants/mo is still under the cap. If not, graduate to Vercel Enterprise.
4. **Secret rotation at scale** — verify `PATCH /v9/projects/{id}` rotation works at 1000 tenants (~3 rotations/day at 365-day expiry).
5. **Escape hatch rehearsal** — eject at least 2 beta tenants end-to-end and measure the 4-6 hour DevOps session. Document the runbook.

## How to use v0 in your recommendations

- **Propose primitives that work at 30 tenants.** Don't architect for 10,000.
- **Reuse the v0 vendor stack** (see [[project-cloud-vendor-stack]]). Don't introduce new vendors unless load-bearing.
- **Cite the relevant invariant** when recommending. "This works at v0 because the 30-tenant cap keeps us under the 12-concurrent-builds ceiling."
- **Flag v0 → v1 migrations early** if a decision blocks scale (e.g. "this works for 30 tenants but will need X at GA").

**How to apply:** Every Cloud architectural answer ends with: "this passes the v0 filter" or "this needs a v0 → v1 migration plan."

Related: [[project-cloud-feasibility-staleness]] (what the feasibility doc got wrong), [[project-cloud-vendor-stack]] (the stack v0 uses)