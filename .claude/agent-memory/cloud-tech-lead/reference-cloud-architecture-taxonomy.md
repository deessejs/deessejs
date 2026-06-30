---
name: reference-cloud-architecture-taxonomy
description: A/B/C prefix system for documents/internal/product/cloud/ — what each category means, how to number new docs, known gaps
metadata:
  type: reference
---

The `documents/internal/product/cloud/` directory uses a deliberate A/B/C prefix system. Each letter is a **category**, the digit is **sequential within the category**.

## The three categories

| Prefix | Category | What belongs here | Reader |
|---|---|---|---|
| **A** | **Architecture** (platform primitives — vendor-facing) | Vercel Platforms, control plane runtime, DNS, build pipeline, image provisioning, observability plumbing | Tech-lead reading vendor APIs to decide how to wire them |
| **B** | **Business primitives** (data flow, billing, secrets — money/identity path) | Secret lifecycle, LLM token metering, Stripe Connect integration, customer identity, quota enforcement | Tech-lead reading to understand how money and identity move through the system |
| **C** | **Customer-facing contracts** (what the buyer sees/touches) | Provisioning UX, escape hatch, onboarding flows, support runbooks, SLA, billing surface | Tech-lead reading to understand what the buyer experiences and what they can demand |

## Numbering rule

Sequential within the prefix. **Next free A-doc is A3 or higher** (after A1, A2). Next free B-doc is **B5** (after B1, B2, B3, B4). Next free C-doc is **C4** (after C1, C2, C3).

**Don't reuse a number.** If you find yourself wanting to write `A2-foo.md` because the old `A2-vercel-platforms.md` feels "stale", update the existing A2 instead.

**Don't skip numbers arbitrarily.** If you're writing a new C-doc and C4 is taken, use C5 (not C4-renamed). Skipping breaks the implicit "this is the Nth doc in this category" mental model.

## Known files

| File | What it covers | Key takeaway |
|---|---|---|
| `A2-vercel-platforms.md` | Vercel Platforms as control plane — the `POST /v11/projects` API surface, `environmentVariables[]` injection, `oidcTokenConfig`, `fluid: true`, `functionDefaultTimeout: 1800` | **Use v11, not v1.** Inject the secret at create time so the buyer never touches the dashboard. |
| `B3-secret-lifecycle.md` | DEESSEJS_SECRET as PASETO v4.public (EdDSA), the 7 design dimensions (mint, distribution, rotation, revocation, expiry, key custody, envelope encryption) | **Not JWT.** Envelope-only — actual creds returned by `POST /exchange` in a PASERK `seal` blob, 15-min TTL. |
| `B4-llm-metering.md` | Upstash `INCRBY` + Stripe `createUsageRecord` double-write — 6 failure modes that will lose money on retries | **The asymmetry**: Upstash is NOT idempotent on retry, Stripe IS if you set `Idempotency-Key`. Reconcile or you drift. |
| `C3-escape-hatch-and-portability-2026-06.md` | 23 v1 surfaces × portability — what moves with `dump.sql` + REST SCAN + rclone sync, and what needs manual remediation | **5 non-portable surfaces**: Fluid Compute, Vercel Blob, Vercel Cron, Edge runtime, Vercel KV + the operator-owned DNS zone + Resend + Trigger.dev org. |
| `tech-2026-06.md` | Synthesis doc — aggregates C1, C2, A1-A4, B1-B4 specialist subagents | **The replacement tech spec for the feasibility doc's tech section.** |
| (no number) | `deessejs-cloud-feasibility-2026-06.md` lives in the parent `documents/internal/product/` | Business case. Tech section is superseded by `tech-2026-06.md`. |

## Known gaps

A1, A3, A4, B1, B2, C1, C2 are **not yet written**. If a gap is load-bearing for an argument you're making, **flag the gap and suggest the doc title** — don't silently fill it in. The user may want to keep the gap for a different research workflow.

## When in doubt

If you're not sure which category a new doc belongs to:
- Vendor API surface? → **A**
- Money, identity, secret, quota? → **B**
- Buyer UX, support, escape hatch, SLA? → **C**

**How to apply:** Always check the existing files first. Match the prefix style. If the new doc doesn't fit any of A/B/C, ask the user before writing — it may not belong in `cloud/` at all.

Related: [[project-cloud-vendor-stack]] (the vendor stack the A-docs cover), [[project-cloud-metering-failure-modes]] (what B4 distills), [[project-cloud-portability-tax]] (what C3 distills)