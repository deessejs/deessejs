---
name: project-cloud-feasibility-staleness
description: What the feasibility doc (2026-06-16) says that's now wrong — tech-2026-06.md is the replacement tech spec
metadata:
  type: project
---

The feasibility doc `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` was authored **2026-06-16**, **one day AFTER** the Vercel 30-min changelog of 2026-06-15. The research workflow that produced it missed the changelog.

## What the feasibility doc says vs what's true now

| Claim in feasibility doc | Stale? | Replacement |
|---|---|---|
| Risk #5: "Vercel Function 300s duration ceiling blocks long agent loops" | **OBSOLETE** | Functions now run up to **1800s (30 min) on Pro/Enterprise with Fluid Compute + `maxDuration=1800`**, BETA, Node.js 20/22/24 + Python 3.12-3.14. Edge runtime NOT covered. |
| Trigger.dev as queue primitive because of duration | **PARTIALLY COLLAPSED** | Long agent loops can stay on Vercel Functions now. Trigger.dev still has value for UX (streaming) and per-tenant job isolation. Decision: keep Trigger.dev for v0, but the 4.9 streaming architecture can be simplified. |
| 4.x job architecture (4.9 wiring) | **NEEDS RE-DESIGN** | Re-evaluate the split between Function-resident loops and Trigger.dev-resident jobs under the 30-min envelope. |
| AI-heavy tenant cost model (Risk #2, 54% margin) | **NEEDS RE-MODELING** | Fluid Compute bills **active CPU only** (pauses on I/O). The 54% margin was based on wall-clock billing. Re-model under active-CPU. |
| Edge runtime gap (control plane on Edge) | **UNAFFECTED** | The 25s-response / 300s-stream Edge envelope is unchanged. Control plane stays on Edge. |

## What the feasibility doc is STILL valid for

- **Business case** (P0/P1 user needs, market gap, competitor teardowns, $99/$599/$999 pricing, $1.50/1M LLM overage, $0.50/1M Vercel invocations, $0.10/GB Trigger.dev)
- **Vendor stack choices** (Vercel Platforms, Turso, Upstash, Trigger.dev, Resend, Stripe Connect, Cloudflare DNS — all confirmed in `tech-2026-06.md`)
- **Unit economics thesis** (87%+ gross margin at Team-tier median, with the caveat that the cost model under Fluid Compute is a re-model, not a re-thesis)

## Where the tech claims actually live now

`documents/internal/product/cloud/tech-2026-06.md` is the **replacement tech spec**. Synthesized from the 12 specialist subagents (A1-A4, B1-B4, C1-C2) on 2026-06-18. Read it as the canonical source for:
- Provisioning flow timing (4-6 min baseline → 75-180s with caching + parallelization wins)
- Vercel API specifics (`POST /v11/projects`, not v1)
- DEESSEJS_SECRET claim set
- LLM metering failure modes
- Escape hatch matrix

## When to edit the feasibility doc

- **Never cite the 300s claim, Risk #5, or the 4.x architecture as decided.** Anchor on `tech-2026-06.md` instead.
- **Do edit** the business case sections (user needs, competitor teardowns, pricing) — those are still valid.
- **If you want to "fix" a stale tech section in the feasibility doc**, replace it with a pointer to `tech-2026-06.md` rather than rewriting inline. The risk is divergence between the two documents.

**How to apply:** Treat the feasibility doc as a business case with a tech section that is SUPERSEDED. Don't quote the tech section. If asked "is the feasibility doc still valid?" — answer: "the business case yes, the tech details no; the replacement is `tech-2026-06.md`."

Related: [[project-cloud-vendor-stack]] (the current vendor stack), [[project-cloud-v0-private-beta]] (v0 plan that re-models the cost)