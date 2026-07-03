---
name: project-cloud-tech-lead-agent
description: New cloud-tech-lead subagent created 2026-06-26 — owns apps/cloud + documents/internal/product/cloud/** + feasibility doc + packages/* for Cloud; do NOT route buyer-template or web/docs work to it
metadata:
  type: project
---

A new custom subagent was added on 2026-06-26: **`cloud-tech-lead`** (defined at `.claude/agents/cloud-tech-lead/README.md`, memory at `.claude/agent-memory/cloud-tech-lead/`).

## Scope split (3-agent roster as of 2026-06-26)

| Path | Owning agent |
|---|---|
| `apps/web/` (LIVE marketing site) | **web-tech-lead** |
| `apps/docs/` (Fumadocs) | **web-tech-lead** |
| `packages/ui/` | **web-tech-lead** (read + write) |
| `apps/cloud/` | **cloud-tech-lead** |
| `documents/internal/product/cloud/**` | **cloud-tech-lead** |
| `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` | **cloud-tech-lead** (full ownership) |
| `packages/*` consumed by Cloud | **cloud-tech-lead** (read + write) |
| `apps/template/**` | **MOVED** → `deessejs/template-starter` (external repo) |
| `apps/lite/**` | **MOVED** → `deessejs/template-lite` (external repo) |
| Buyer-template `packages/*` | **MOVED** → `deessejs/template-starter` |

All three agents have packages/* access. **Conflicts on shared package files are arbitrated by the user.**

## Why this split

Cloud has a **fundamentally different artifact**: the A/B/C spec docs in `documents/internal/product/cloud/` and the `deessejs-cloud-feasibility-2026-06.md` business case. These are the source of truth for Cloud architecture — not the (still empty) `apps/cloud/` code. Putting Cloud under its own agent:

- Prevents the tech-lead (template-scope) from drifting into Cloud architecture decisions that need the feasibility doc + tech-2026-06.md as context
- Lets cloud-tech-lead specialize in **doc-driven architecture** (different from web-tech-lead's code-driven architecture and tech-lead's template-package-driven architecture)
- Encodes the 87% gross margin + 30-tenant cap + Q3 2026 launch filter in the agent's system prompt so it doesn't get re-debated in every PR

## How to use this in hand-offs

When you (tech-lead) get a request that involves a path under `apps/cloud/` or any of the Cloud docs, route to `cloud-tech-lead`:

- "Re-design the metering" → `documents/internal/product/cloud/B4-llm-metering.md` → cloud-tech-lead
- "Is the escape hatch real?" → C3 → cloud-tech-lead
- "How does the secret work?" → B3 → cloud-tech-lead
- "Should we replace Upstash with X?" → cloud-tech-lead (it owns the vendor stack decisions)
- "Add a primitive to the Cloud control plane" → cloud-tech-lead

**Stay out of Cloud.** Even if you're asked "what do you think of the Cloud plan?" — defer to cloud-tech-lead. Your scope is the buyer template; Cloud is the operator product.

## When to be cautious

The Cloud docs use an A/B/C taxonomy. If a path looks like `documents/internal/product/cloud/X{N}-something.md`, that's Cloud scope. The taxonomy rules (A=Architecture, B=Business primitives, C=Customer-facing contracts) are in cloud-tech-lead's memory — don't try to interpret them yourself.

The Cloud feasibility doc is **partially stale** for tech claims (300s ceiling obsolete, 4.x job architecture needs re-design). cloud-tech-lead knows this. If you cite the feasibility doc for tech, you'll be wrong — defer to cloud-tech-lead.

## Related agent-memory work

This is the **third** tech-lead-style subagent:
1. `tech-lead` (you) — buyer template + OSS subset + product/architecture docs
2. `web-tech-lead` (added 2026-06-26) — LIVE marketing + docs + shared UI
3. `cloud-tech-lead` (added 2026-06-26) — operator Cloud + A/B/C specs + shared packages

All three have `memory: project` and persistent agent-memory directories. All three should hand off to each other explicitly when scope bleeds.

**How to apply:** When delegating or reviewing, check the path. If it's under Cloud's scope (apps/cloud, documents/internal/product/cloud/**, the feasibility doc), route to cloud-tech-lead. If it's buyer template (apps/template, the spec files in documents/internal/product/features/), it stays with you. If it's the public marketing or docs apps, it's web-tech-lead.

Related: [[project-deessejs-overview]] (overall product context), [[project-web-tech-lead-agent]] (the parallel split for the public surface), [[project-cloud-feasibility-staleness]] (the 300s claim and the v0 → v1 plan)