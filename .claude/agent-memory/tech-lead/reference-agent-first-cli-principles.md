---
name: reference-agent-first-cli-principles
description: 8 design principles for CLIs whose primary audience is AI coding agents; user confirmed 2026-07-02 this is the strategic direction
metadata:
  type: reference
---

The 8 principles distilled from the 2026-07-02 session where the founder confirmed "le cli sera principalement utilisé par des agents". Source: `documents/internal/architecture/12-apps/cli/architecture.md#agent-first-contract`.

## When to apply

- Designing any new CLI in the DeesseJS ecosystem
- Auditing an existing CLI to see if it would survive agent use
- Choosing between libraries: prefer ones that produce structured, parseable output over interactive UX
- Reviewing PRs that touch CLI behavior

## The 8 principles

### 1. Every option has a flag (no interactive prompts)

If the user is an agent and didn't pass a flag, the CLI **errors** with a usage hint, not a prompt. Agents cannot reliably fill in `@clack/prompts`/`inquirer` UIs.

### 2. Detect-agent and bail to non-interactive

Use `@vercel/detect-agent` (Vite 6+ pattern). When detected:
- Print the non-interactive form to stderr upfront
- Auto-fill defaults from `DEESSE_*` env vars
- Never block on input

### 3. `--json` output mode for structured results

When `--json` is passed, all output goes to stdout as a single JSON object:

```json
{
  "ok": true,
  "template": {...},
  "project": {...},
  "packageManager": "pnpm@9.15.0",
  "steps": [{"name": "fetch", "status": "ok", "durationMs": 1240}, ...],
  "nextSteps": ["cd my-app", "pnpm dev"]
}
```

Include a `"version"` field in the JSON shape so breaking changes are explicit.

### 4. Semantic exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (bad flag, missing template, validation) |
| 2 | Network/IO failure |
| 3 | Template invalid |
| 4 | Post-process failure |
| 5 | Install failure |
| 6 | Git failure |

Agents branch on the exit code without parsing the error message.

### 5. Stdout is parseable, stderr is human-friendly

- **`stdout`**: `--json` output only (when `--json` is passed). Empty otherwise.
- **`stderr`**: spinners, progress, errors, the outro block. Everything an agent doesn't need to parse.

Inverts the default of most CLIs. 12-factor discipline.

### 6. `--help` is self-documenting and machine-parseable

Verbose by design. Includes:
- Full flag list with aliases
- Exit code table
- Env var table
- 4+ examples (including the agent-friendly one-liner)

An agent can `deesse --help > help.txt` and parse it once.

### 7. Auto-fill from env when running as an agent

When `@vercel/detect-agent` returns true, additional env vars populate defaults:
- `DEESSE_TEMPLATE`
- `DEESSE_PORT`
- `DEESSE_ORG`
- `DEESSE_PACKAGE_MANAGER`
- `DEESSE_AUTH` (overrides `GIGET_AUTH`)

A coding-agent platform can set these once and every `deesse init` invocation inherits them.

### 8. E2E with a real agent

A CI job spawns a real AI agent (Claude Code headless) in a temp dir, prompts it to scaffold a template, asserts:
- Agent ran exactly one `deesse init` with the right flags
- Output is valid JSON
- Exit code is 0
- The resulting project typechecks and builds

This is the canary. If a real agent can't use the CLI, no agent will.

## Anti-patterns (forbidden)

- ❌ Interactive prompts (clack/inquirer/prompts) as the primary UX
- ❌ Picker UI when a flag is missing
- ❌ Putting machine-parseable data in stderr (the agent greps stdout)
- ❌ Single exit code for all failures
- ❌ Logs to stdout by default
- ❌ "Beautiful" output that breaks when piped
- ❌ Implicit defaults the agent has to guess

## Cross-references

- [[project-12-apps-cli-section]] — the doc section these principles live in
- [[project-12-apps-cli-vs-buyer-cli]] — the two-CLIs distinction (init = agent-first, buyer = not)
- [[project-positioning-drift-2026-06-25]] — the broader "agentic wins" thesis that this fits under
