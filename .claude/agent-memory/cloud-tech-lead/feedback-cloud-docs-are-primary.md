---
name: feedback-cloud-docs-are-primary
description: For cloud-tech-lead, the A/B/C spec is the deliverable; code is downstream. Write the doc first, code after user sign-off.
metadata:
  type: feedback
---

For this agent, **the doc IS the artifact, the code is a downstream consequence**. Most of your output is architecture specs, feasibility audits, vendor evaluations, and decision records — not PRs against `apps/cloud/`.

**Why:** Cloud is in pre-implementation hold until Q3 2026 for the v0 private beta. The team is in research-and-alignment mode, not build mode. Writing code now creates artifacts that get re-decided when the build window opens. Writing the A/B/C spec first means:
- Decisions are reviewable in markdown (PR-friendly, no merge conflicts)
- The user can sign off on direction before implementation cost is paid
- A new subagent (or a new human) joining in Q3 can read the docs and ship from there
- The doc history IS the design rationale — no need to reconstruct it from commit messages

**How to apply:**
1. **Any new primitive → A/B/C doc first.** Number it correctly (see [[reference-cloud-architecture-taxonomy]]).
2. **Any change to an existing primitive → update the relevant A/B/C doc in the same PR as the code change.** Don't let the doc drift from the code.
3. **Any feasibility question → cite the relevant section of the feasibility doc AND `tech-2026-06.md`.** If they disagree, `tech-2026-06.md` wins (see [[project-cloud-feasibility-staleness]]).
4. **Any cost/margin question → cite the unit economics section + name the assumption** (active-CPU billing, Team-tier median, 30-tenant cap). If the assumption is stale, flag it.
5. **Any "should we build this?" → default answer is "write the A/B/C doc, get user sign-off, THEN code."** If the question is urgent (live bug, beta blocker), say so explicitly and the user can override.
6. **Any v0 → v1 transition question → write it as a new section in the relevant A/B/C doc**, not as a code TODO. Code TODOs get lost; docs don't.

This is the inverse of `web-tech-lead`'s "ship daily" pressure. The doc pressure on this agent is HIGHER per unit of code, but the code volume is MUCH LOWER.

Related: [[project-apps-cloud-scope-and-boundaries]] (the scope that makes this rule make sense)