---
name: claude-code-workflows
description: Claude Code Workflow tool — JS script that orchestrates many subagents in background with deterministic control flow; distinct from the Agent tool
metadata:
  type: reference
---

Authoritative detail at https://code.claude.com/docs/en/workflows.md. Available since v2.1.154 on all paid plans (Pro needs `/config` toggle).

## What it is (vs Agent tool)

- **Agent tool** — delegate ONE task to ONE subagent, returns summary to parent
- **Workflow tool** — execute a JS script that orchestrates many subagents; intermediate results stay in script variables, NOT in Claude's context

Doc quote: *"A workflow moves the plan into code. With subagents, skills, and agent teams, Claude is the orchestrator […]. A workflow script holds the loop, the branching, and the intermediate results itself, so Claude's context holds only the final answer."*

## Script primitives

Plain JS, no types, isolated runtime separated from the conversation. No direct FS/shell from the script — agents do all I/O.

| Primitive | Purpose |
|---|---|
| `agent(prompt, opts)` | Spawn one subagent |
| `parallel(thunks)` | Barrier — awaits ALL before returning |
| `pipeline(items, stage1, stage2, ...)` | Each item through all stages, no barrier between stages (DEFAULT) |
| `phase(title)` | Group agents visually in progress UI |
| `workflow(nameOrRef, args)` | Call child workflow (1 level nesting only) |
| `log(message)` | Progress message above progress tree |
| `args` | Global — invocation params |
| `budget` | `{ total, spent(), remaining() }` for token caps |

`agent()` opts: `label`, `phase`, `schema` (JSON Schema for structured output), `model`, `isolation: 'worktree'`, `agentType`.

## Hard limits

- **16 concurrent agents** (less on low-CPU machines)
- **1000 agents total per run** (runaway backstop)
- **4096 items max** per single `parallel()`/`pipeline()` call
- **No mid-run user input** except permission prompts
- Scripts are plain JS — `: string[]` annotations, `interface`, generics fail to parse
- No `Date.now()`/`Math.random()` in scripts (breaks resume) — pass timestamps via `args`, vary by index for randomness

## Recommended patterns

- **pipeline by default** — only `parallel` when stage N needs cross-item context from ALL of stage N-1 (dedup, early-exit, cross-comparison)
- **loop-until-dry** — accumulate findings until K consecutive empty rounds
- **adversarial verify** — N independent verifiers per finding, majority refutes = kill
- **multi-modal sweep** — fan out search across dimensions (by-container / by-content / by-entity / by-time)
- **completeness critic** — final agent asks "what's missing", feeds next round

## Triggers

- `ultracode` keyword in prompt (e.g. `ultracode: audit every API endpoint`)
- `/effort ultracode` — Claude plans workflow for every substantive task
- `/deep-research <question>` — bundled workflow (multi-angle research, cross-check, vote, cited report)
- Saved workflows in `.claude/workflows/` or `~/.claude/workflows/`, invoked via `/name`

## Observability

`/workflows` opens TUI: list of runs, phases, agents, tokens, elapsed. Keys: `p` pause/resume, `x` stop, `r` restart agent, `s` save, `↑/↓` drill-down.

## Disable

- `/config` toggle (Dynamic workflows off)
- `disableWorkflows: true` in `~/.claude/settings.json`
- `CLAUDE_CODE_DISABLE_WORKFLOWS=1` env var
- Managed settings org-wide

## When to reach for Workflow over Agent tool

- Task too big for one turn to coordinate
- Want orchestration codified and rerunnable
- Need cross-validation between independent agents
- Want intermediate results filtered before reaching Claude's context (cheap context hygiene)

When NOT: simple one-off delegations (use Agent tool), interactive back-and-forth (use main thread), tasks needing user input mid-run (Workflow can't prompt).

Related: [[claude-code-subagents]] (the workers that workflows orchestrate), [[claude-code-index]] (doc URLs).
