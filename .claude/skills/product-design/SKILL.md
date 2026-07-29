---
name: product-design
description: >-
  Single entry point for product design and user-facing implementation in
  apps/web, apps/app, apps/docs, and packages/ui. Use whenever work changes
  what a user sees, understands, chooses, or does: shaping flows, building
  or redesigning pages and components, reviewing URLs or screenshots,
  improving copy, information architecture, component choice, hierarchy,
  layout, interaction, accessibility, responsive behavior, and loading,
  empty, error, permission, billing, or destructive states. Trigger on
  design, UX, UI, usability, flow, onboarding, settings, dashboard, build,
  improve, fix, audit, review, polish, simplify, or production-ready
  requests. Also use when backend behavior changes a user-visible outcome.
  Not for backend-only work with no user-visible effect, tests with no
  shipped UI impact, telemetry, marketing copy, or documentation.
---

# DeesseJS Product Design

The interface must be correct for the user, the product, and the DeesseJS
positioning. Working code is not enough: choose the right interaction,
make scope and consequences clear, cover reality beyond the happy path,
and verify the rendered result.

## Operating Contract

- Start with the job, not the pixels. Identify who is acting, what they
  are trying to accomplish, the product object, and what will change.
- Define the outcome before the output. Problem, desired behavior,
  success signal, non-goals — before choosing a surface.
- Use evidence, not taste. Trace to DESIGN.md, packages/ui/CLAUDE.md,
  apps/*/CLAUDE.md, an accepted PR, or a verified adjacent pattern.
- Treat shipped code as evidence, not automatic precedent. It proves
  what exists, not why it is correct.
- Choose the smallest coherent intervention. Defaults, behavior, reuse
  first. Don't solve one job by creating unrelated settings.
- Decide before decorating. Resolve IA, component semantics, interaction,
  state behavior before styling or rewriting copy.
- Design every reachable state. Loading, empty, sparse, populated,
  validation, error, permission, disabled, destructive, responsive.
- Verify the real surface. Source inspection establishes behavior;
  rendered interface establishes visual quality.
- Keep one entry point. Invoke this skill; it routes internally to
  DESIGN.md, packages/ui/CLAUDE.md, apps/*/CLAUDE.md.

## Request Modes

Resolve the mode from the verb and artifact BEFORE acting.

| Mode      | Typical request                                            | Required behavior                                                                                                              |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Shape     | "design this flow", "how should this work?", feature brief | Frame the problem, compare material alternatives, define flow + states + acceptance criteria + risks. Do not edit unless asked. |
| Implement | "build", "fix", "improve", "make compliant"                | Resolve material decisions, then implement smallest coherent end-to-end change. Do not absorb unrelated findings.               |
| Review    | "audit", "critique", "what's wrong?"                       | Inspect source + rendered evidence, report prioritized findings. Do not edit unless asked.                                     |
| Copy      | "fix the copy", "rewrite these errors"                     | Edit user-facing language + accessible names + directly required JSX only. Report structural blockers without broadening scope. |
| Harden    | "polish", "production-ready", "handle edge cases"          | Preserve settled direction while fixing state, resilience, responsive, accessibility, finish defects.                          |

When intent is ambiguous, use the narrowest mode supported by the verb.
A URL, screenshot, route, or component identifies scope; it does not
authorize edits.

A material decision changes the user's task, default, scope, consequence,
navigation, interaction surface, or reachable states. Copy mechanics,
token replacement, and established component substitutions are not material.

## Decision Authority

Resolve conflicts in this order:

1. The user's explicit goal and constraints.
2. DESIGN.md (canonical spec for the entire DeesseJS design system).
3. packages/ui/CLAUDE.md (operational guide for primitives, tokens).
4. apps/*/CLAUDE.md (per-app paths, gotchas, structure).
5. Accepted PRs with stable evidence (the patterns we've already shipped).
6. General interface heuristics (last resort).

For buyer-customization conflicts: the buyer's explicit decision wins
over DeesseJS defaults. Defaults win over heuristics.

## Skip Rules

Do NOT load this skill for:

- Backend-only work with no user-visible effect
- Database schema, migrations, query optimization
- Telemetry, observability, logging
- Tests with no shipped UI impact
- Generated files (`.content-collections/generated/*`)
- Documentation site content (apps/docs has its own conventions)
- Marketing copy on the website (homepage, pricing, blog posts)
- Sub-agent invocation (Task tool, slash commands)

If unsure, ask the user before loading.

## Routing Table

| Need                              | Load                                                |
| --------------------------------- | --------------------------------------------------- |
| Product/flow/component decision   | DESIGN.md §1 (principles) + this skill              |
| Material visual or layout change  | DESIGN.md §2 (tokens) + packages/ui/CLAUDE.md §5-6  |
| Copy or accessible names          | DESIGN.md §6 (voice) + this skill's Copy mode       |
| Keyboard, focus, forms, a11y      | DESIGN.md §4 (focus) + packages/ui/CLAUDE.md §7     |
| Overflow, localization, errors    | DESIGN.md §3 (token system) + ESLint output         |

## Code vs Prose

```
Can code identify the failure without rendering?
├─ No  → this skill (agent judgment)
└─ Yes
   └─ Can the rule avoid likely false positives?
      ├─ No  → this skill (still risky for lint)
      └─ Yes
         └─ Does the violation have a concrete fix?
            ├─ Yes → ESLint rule (packages/ui/eslint.config.mjs)
            └─ No  → this skill (warning)
```

For each non-mechanical change, answer:

- What user problem does this solve?
- Why is this component appropriate?
- What consequence must the interface communicate?
- Which evidence supports the decision?
- What is the smallest coherent change?

## Verify

1. Confirm the primary job and acceptance criteria.
2. Run `pnpm lint` in the affected app/package.
3. Inspect relevant viewport sizes (compact + wide).
4. Exercise every materially changed reachable state.
5. Verify keyboard order, focus movement, loading behavior.
6. Test long content, large values, constrained width.
7. Cross-check with DESIGN.md — does the change still match the spec?

## Review Output

When in Review mode, lead with findings ordered by user impact:

- P0: blocks primary task, severe a11y failure, unrecoverable harm
- P1: likely task failure, misleading consequence, missing critical state
- P2: meaningful friction, inconsistency, weak hierarchy
- P3: minor craft or consistency improvement

Each finding includes: file/line or rendered location, canonical source
(DESIGN.md section, packages/ui/CLAUDE.md section, PR #), user consequence,
smallest concrete fix.

## Coverage Gaps

Before designing for any of these, check `packages/ui/coverage-gaps.md`:

- Primitives not yet shipped (12 of 17)
- Unresolved design decisions (focus ring, radius scale, text utilities)
- Open positioning questions

When working in a gap zone: propose, don't invent. Surface the gap to
the user before applying a decision.

## Skill Integrity

- Add or change a rule only after DESIGN.md verification and human acceptance.
- Record scope, rationale, evidence, exceptions, and a bad/good example.
- Prefer the narrowest destination: DESIGN.md section, packages/ui/CLAUDE.md
  section, ESLint rule, or coverage gap entry.
- Keep deterministic checks mechanical (ESLint). Keep judgment in prose.
- Never promote one screenshot, one shipped file, or one reviewer comment
  into a universal rule alone.