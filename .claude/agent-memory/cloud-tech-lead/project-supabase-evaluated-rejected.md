---
name: project-supabase-evaluated-rejected
description: Supabase evaluated as a potential swap for parts of the v0 stack on 2026-06-26 — verdict: rejected for v0 (Turso is 11× cheaper and escape hatch is simpler). Reconsider for v2 if scale >1000 tenants.
metadata:
  type: project
---

On 2026-06-26, the user asked to research Supabase Platform SDK + API as a comparison to the current 8-vendor stack. I ran a focused `fresh search` + `fresh fetch` sweep across Supabase for Platforms guide, Management API, Branching, pricing, connection management, backups, and multi-tenant RLS patterns.

**Decision:** **Supabase is NOT in the v0 stack.** Keep Turso + Upstash + Trigger.dev + Stripe + Resend + Vercel + CF Workers + Cloudflare DNS.

## Why we rejected Supabase for v0

1. **Compute cost is 11× higher.** Pro plan $25/mo base + $10/instance × 30 tenants = **$325/mo**. vs Turso Scaler plan $29/mo for 10,000 DBs. Same DB tier, ~11× cost gap.
2. **Escape hatch is harder on Supabase.** `pg_dump --format=custom` requires direct connection (port 5432, not pooler). Two connection strings per tenant to manage. **Storage buckets + Edge Functions + Auth users schema are NOT included in pg_dump** — buyer has to migrate those separately. vs Turso: `turso db dump` = single SQL file, restore = one command.
3. **Connection pool pressure.** Micro instance = 60 direct / 200 pooler. At 30 tenants with N serverless functions each, we approach pooler ceiling fast. Need Small ($15) at least, Medium ($60) for safety margin.

## Why we might revisit for v2 (1000+ tenants)

- **Supabase RLS pattern (shared DB + tenant_id + RLS policies)** becomes cost-attractive at scale. 1 Supabase project serves all tenants, RLS does isolation.
- **Supabase Branching** ($0.01344/h) is the only mature "git-style DB branches for preview environments" primitive on the market. Could replace our manual Turso throwaway-DB approach for Vercel preview deployments.
- **Supabase Auth** would solve an auth gap IF the template doesn't already ship one. (As of 2026-06-26, this is unspecified in the A/B/C docs — check before assuming.)
- **Supabase Claim Flow** (OAuth + project transfer) confirms the pattern is industry-standard. Our own `POST /exchange` + C3 portability tax follows the same conceptual pattern, just less formalized.

## Lessons captured from the Supabase deep-dive

- **Claim Flow OAuth** is the canonical pattern for "operator-controlled project that buyer can claim." Our Turso + Stripe Connect + Resend Option A→B triptyque covers the same conceptual surface. Reasonable to formalize it as a single A-doc.
- **RLS footgun is real.** Every new table needs RLS. UPDATE without SELECT policy = silent 0 rows. `(SELECT auth.jwt())` wrapper mandatory for perf. `FORCE ROW LEVEL SECURITY` mandatory to prevent superuser bypass. **This validates our DB-per-tenant choice for v0** — we avoid RLS entirely by construction.
- **Connection pool sizing is the hidden cost.** Micro = 60 direct / 200 pooler. Plan ceiling for 30 tenants on Micro with pooler-only access.
- **Branching pricing can spiral.** $0.01344/h × 150 active branches = ~$48/day = $1,440/mo. Governance mandatory if adopted.

## What changed in vendor docs (date-stamped)

- Supabase for Platforms guide: full pattern documented at `supabase.com/docs/guides/integrations/supabase-for-platforms` — includes OAuth integration setup, project provisioning, **Claim flow** at `GET /v1/oauth/authorize/project-claim`, and Platform Kit (embeddable UI components).
- Branching moved to **default-dashboard (no-Git)** mode per `supabase.com/features/branching`. Git-based still supported.
- Some Management API endpoints are gated: `database/migrations`, `database/backups/restore-point`, `database/backups/undo` — "submit a form to get access." To verify eligibility before committing to this path.

## When to re-evaluate

- **When tenant count approaches 1000.** Recompute Supabase Pro vs Turso Scaler unit economics.
- **When we add Vercel preview environments** to the template. Branching becomes attractive if preview usage is high.
- **If Supabase Auth** turns out to solve a real gap in our template that we haven't noticed.

**How to apply:** If a future conversation asks "should we use Supabase?", answer is **no for v0, revisit at scale**. If a future conversation asks "what did we learn from looking at Supabase?", surface the Claim Flow pattern, RLS footgun, and connection pool sizing as the three durable lessons.

Related: [[project-cloud-vendor-stack]] (the stack this evaluation compared against), [[research-snapshot-2026-06-26]] (broader vendor sweep context)