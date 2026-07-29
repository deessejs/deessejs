---
name: claude-code-subagents
description: How to create custom subagents in Claude Code — locations, frontmatter fields, invocation modes, plugin restrictions, examples, and pitfalls
metadata:
  type: reference
---

Authoritative detail lives at https://code.claude.com/docs/en/sub-agents.md — re-fetch when facts are load-bearing. This file captures the stable structure so I can scaffold quickly without re-reading the full doc.

## Where subagents can be defined (priority order)

1. **Managed** — `.claude/agents/` in managed settings (deployed by org admin, overrides everything)
2. **`--agents` CLI flag** — inline JSON, session-only, not persisted
3. **Project** — `.claude/agents/<name>.md` (version in git)
4. **User** — `~/.claude/agents/<name>.md` (all your projects on the machine)
5. **Plugin** — `agents/` in a plugin (toggleable, follows plugin lifecycle)

Duplicate `name` in same scope → one silently wins. `/doctor` (v2.1.196+) reports collisions.

## File structure

Markdown file + YAML frontmatter. Required: `name`, `description`. Everything else is optional. Body of markdown = system prompt of the subagent (NOT inherited from the main Claude Code system prompt).

```markdown
---
name: my-agent
description: Use proactively when...   # CRITICAL — drives auto-delegation
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are... [system prompt body]
```

## Frontmatter fields

| Field | Values | Default | Key notes |
|---|---|---|---|
| `name` | string | — | Required. lowercase + hyphens. Filename need not match. |
| `description` | string | — | Required. Drives auto-delegation. Start with "Use proactively…" to force. |
| `tools` | pattern list | inherit all | Allowlist. `Agent(worker, researcher)` permits spawning listed subagents. |
| `disallowedTools` | pattern list | none | Denylist. Applied BEFORE `tools`. `mcp__*` removes all MCP. |
| `model` | sonnet/opus/haiku/fable/inherit/full-ID | inherit | Resolution: env `CLAUDE_CODE_SUBAGENT_MODEL` > invocation > frontmatter > main |
| `permissionMode` | default/acceptEdits/auto/dontAsk/bypassPermissions/plan | inherit | **Ignored for plugin agents.** Parent's `bypassPermissions` always wins. |
| `maxTurns` | int | none | Cap on agentic turns before forced stop. |
| `skills` | list | none | **Preload** — full content injected at start. Subagent can still invoke other skills via `Skill` tool unless excluded. |
| `mcpServers` | list | none | Inline (subagent-scoped, disconnected at end) or reference by name. **Ignored for plugin agents.** |
| `hooks` | hooks config | none | Lifecycle hooks scoped to subagent. `Stop` → `SubagentStop`. **Ignored for plugin agents.** |
| `memory` | user/project/local | none | Auto-adds Read/Write/Edit. Loads first 200 lines / 25KB of `MEMORY.md`. |
| `background` | bool | false | Force background mode. |
| `effort` | low/medium/high/xhigh/max | inherit session | Per-model availability. |
| `isolation` | `worktree` | none | Temp git worktree from default branch (NOT HEAD). Auto-cleanup if no changes. |
| `color` | red/blue/green/yellow/purple/orange/pink/cyan | none | Display color in task list. |
| `initialPrompt` | string | none | Auto-submitted when agent runs as main agent (`--agent`). Commands/skills resolved. |

**Tools that NEVER work in a subagent even if listed**: `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` (except `permissionMode: plan`), `ScheduleWakeup`, `WaitForMcpServers`.

## Invocation modes

1. Auto-delegation — Claude reads `description` and decides
2. Natural language — "Use the X subagent to…"
3. `@agent-name (agent)` — guaranteed
4. Whole session — `claude --agent <name>` makes main thread itself a subagent

## CLI `--agents` flag (inline JSON)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Use proactively after code changes",
    "prompt": "You are a senior reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

PowerShell: use here-string `@'...'@`. Field `prompt` replaces markdown body. Not persisted.

## Plugin agents

Same format in plugin's `agents/` directory. **Silently ignored fields** for plugin agents: `hooks`, `mcpServers`, `permissionMode`. Workaround: copy file to `.claude/agents/`.

Naming: `plugin-name:agent-name`, or `plugin-name:folder:agent` if nested (e.g. `agents/review/security.md` → `my-plugin:review:security`).

## Patterns worth remembering

- **Read-only research**: `tools: Read, Grep, Glob, Bash` + haiku model
- **Heavy lifting with collision safety**: `isolation: worktree` + sonnet
- **Cross-session learning**: `memory: project` + explicit "check memory / save findings" in body
- **Read-only with enforced guardrails**: `tools: Bash` + `hooks.PreToolUse` script that exits 2 on writes
- **Coordinator that spawns**: `tools: Agent(worker, researcher), Read, Bash` (allowlist only works for main-agent mode, not for sub-spawning)
- **Nested subagents**: depth limit is fixed, depth 5 can't spawn more. Omit `Agent` from tools to prevent spawn.

## Common pitfalls

1. Hot-edits don't reload — restart session, or use `/agents`
2. Duplicate names silently lost — `/doctor` finds them
3. Plugin + hooks/MCP/permissions silently ignored — copy out of plugin
4. Parent's `bypassPermissions` always wins over subagent's `permissionMode`
5. Parent's `auto` mode → subagent inherits, frontmatter `permissionMode` ignored
6. `Agent(...)` allowlist works only for main-agent mode, NOT sub-spawning
7. Built-in `Explore` and `Plan` ignore `CLAUDE.md` and git status — restate rules in delegation prompt if they must reach the subagent
8. Worktree auto-cleanup if no changes; persists if anything modified
9. `disable-model-invocation: true` skills cannot be preloaded
10. Hook matcher regex unanchored — `db-agent` matches `prod-db-agent`. Anchor `^db-agent$`. Plugin names contain `:` so always regex-evaluated unanchored
11. `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` disables built-ins in non-interactive/SDK mode
12. Built-in `Explore`/`Plan` are one-shot — can't resume. Use `general-purpose` or custom for resumable runs

## Best practices

- **`description` is the single most important field.** Phrase as "Use proactively when X" / "Use immediately after Y". Include the keywords users would type.
- System prompt = short, focused, one agent = one responsibility. Include invocation checklist + output format.
- `disallowedTools` preferred over `tools` if only need to block 1-2 things (less brittle).
- Model choice: haiku for high-volume cheap reads, sonnet default for most work, opus for reasoning-heavy, `inherit` to follow session.
- Memory scope: `project` (versionnable) by default. Tell subagent explicitly to read/save.

Related: [[claude-code-workflows]] (orchestrator over subagents), [[claude-code-index]] (doc URLs).
