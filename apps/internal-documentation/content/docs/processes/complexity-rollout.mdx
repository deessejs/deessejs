---
title: Cognitive-complexity tracking — rollout plan
summary: Phase-by-phase plan to introduce the cognitive-complexity ESLint rule, the JSON report aggregator, and the CI workflow.
---

# Cognitive-complexity tracking

## Why

ESLint's `complexity` rule (raw cyclomatic) treats every `&&`, `||` and `?` as equal-weight, which makes its threshold feel arbitrary in modern TypeScript code: most functions will pass; the few that fail look almost identical to the ones that pass.

SonarJS' `sonarjs/cognitive-complexity` is closer to a human's reading cost. Nested branches weigh more than sibling branches, recursion and `?.` chains are counted, and a function with five sequential `if`s is rated differently from one with five nested `if`s. Source: <https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability/>

## What this PR introduces

1. `@workspace/eslint-config/base.js` — registers `sonarjs.configs.recommended` and overrides the cognitive-complexity rule. Also adds a per-glob override for `apps/cli/**` and `packages/contracts/**` where Zod unions and CLI dispatch tables legitimately inflate complexity.
2. `scripts/complexity-collect.ts` — walks every workspace and runs `eslint --format json --output-file reports/complexity/<pkg>.json`.
3. `scripts/complexity-report.ts` — aggregates the per-package JSON, ranks the top 10 findings, and emits `reports/complexity/summary.{md,json}`.
4. `.github/workflows/complexity-report.yml` — runs on every PR and on every push to `staging`/`main`. Posts a sticky PR comment with the top 10 and uploads the JSON to a 30-day artifact.
5. New Turbo tasks: `complexity:json` (per package) and `complexity-report` (aggregator). Root scripts: `pnpm complex:collect`, `pnpm complex:report`.

## Why not just turn the rule on at `warn@10`

Day 1 would surface tens of existing findings, which the lint pipeline (`--max-warnings=0`) would convert into a flood of broken PRs. Adopting a brand-new rule has to be paid in advance: pay the threshold you want by fixing the top of the backlog, *then* enable the lower threshold for net-new code.

## Phase plan

| Phase | Threshold (global) | Threshold (`apps/cli`, `packages/contracts`) | Notes |
|---|---|---|---|
| **Phase 1 (this PR — week 0)** | `warn@15` | `warn@30` | Visibility only. Inventory the debt. No PR blocked. |
| **Phase 2 (week 4)** | `warn@12` | `warn@25` | After paying down the top ~20 findings identified in Phase 1. |
| **Phase 3 (week 8)** | `warn@10 / error@20` | `warn@22` | Cognitive complexity above 20 becomes a hard error. |
| **Phase 4 (week 12)** | `warn@10 / error@15` | `warn@20 / error@25` | Standard floor. Tighten on a per-package basis if a specific package's mean complexity drags. |

Each phase lands as a follow-up PR with a short note in the PR body listing the debt that was paid since the previous phase.

## Debt triage workflow

When a Phase 1/2/3 PR surfaces new findings from net-new code:

1. Read the violation in the lint output — the message quotes the function and the score.
2. Refactor by extracting one of the nested branches into a named helper. SonarJS messages the same functions humans struggle with, so the refactor usually improves readability independently of the metric.
3. If the function *cannot* be simplified (e.g. a reducer over a recursive tree), document the exception with an `// eslint-disable-next-line sonarjs/cognitive-complexity` comment that explains why — never disable the rule globally for the file.

## Why we keep the per-package overrides

Two surfaces generate noise we cannot reasonably remove:

- `apps/cli/**` — command dispatch tables produce long `switch` chains.
- `packages/contracts/**` — Zod unions/refinements for versioned API contracts.

Both are reviewed on the diff, so we keep them at a high `warn` floor instead of forcing maintenance churn.

## Out of scope (future work)

- Replacing SonarJS `cognitive-complexity` with `eslint-plugin-complexity`. SonarJS' metric is the more useful one.
- Per-package mean-complexity budgets in `turbo.json`. Can be added once we have a few weeks of `complexity-report` artifacts to compute a moving average from.
- Visual dashboard. The `complexity-report` artifact already contains enough data to feed a Plotly/Streamlit dashboard if/when one becomes useful. Today the PR comment is sufficient.
