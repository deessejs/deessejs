---
name: project-head-of-design-session-model
description: head-of-design is a PRIMARY session agent for design work, not just a Task-invoked sub-agent; tech-lead (me) is for arch/infra; multi-agent by session not by invocation
metadata:
  type: project
---

Diego's setup is **multi-agent by session**, not by invocation. When he does
design work, the entire session runs with `head-of-design` as the primary
agent — not as a Task-invoked sub-agent. Same for `tech-lead` (me) on
arch/infra, presumably `web-tech-lead` on web surfaces.

**Why:** Confirmed 2026-06-30 during the Vercel product-design skill
integration. I (tech-lead) initially framed head-of-design as a sub-agent
that gets invoked occasionally for design questions. Diego corrected: "moi
je lance des sessions principales avec comme agent le head of design, toute
la session est avec lui." That mental model change is load-bearing.

**How to apply:**

- Skills (like `.claude/skills/product-design/SKILL.md`) are agent-agnostic
  and load in whichever session matches the description. That's fine.
- Agent prompts (like `.claude/agents/head-of-design/README.md`) should
  explicitly reference the skills they consume — the auto-load is implicit,
  the explicit reference makes the dependency visible in git and in session
  intent.
- When Diego asks a design question in a tech-lead session, I'm NOT the
  right primary owner — I should help set up the workflow, ship the
  artefacts (skill, ESLint, coverage gaps, agent README) that head-of-design
  will then consume in its own sessions. I do NOT try to be head-of-design.
- Future similar pattern: each head-of-* agent should have its own
  workflow-contract section that names which skills it consumes end-to-end.

Related: [[project-product-design-skill-integration]] (the Vercel pattern
this insight emerged from), [[project-deessejs-overview]] (general
multi-agent structure).