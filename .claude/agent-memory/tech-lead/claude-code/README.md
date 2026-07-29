---
name: claude-code-index
description: Index of official Claude Code documentation URLs relevant to subagents, workflows, agent teams, plugins, and harness internals
metadata:
  type: reference
---

When working with Claude Code internals (subagents, workflows, hooks, MCP, plugins), WebFetch these first. The docs update frequently — always re-fetch when facts are load-bearing, this list is just a starting index.

**Subagents & workflows (CLI-level concepts — distinct from API Managed Agents)**

- https://code.claude.com/docs/en/sub-agents.md — full subagent reference: frontmatter fields, locations, invocation modes, pitfalls
- https://code.claude.com/docs/en/workflows.md — dynamic workflows: primitives, patterns, limits, triggers, `/workflows` TUI
- https://code.claude.com/docs/en/agents.md — comparison: subagents / agent view / agent teams / workflows
- https://code.claude.com/docs/en/agent-teams.md — agent teams architecture (lead + peers, shared task list, experimental opt-in)
- https://code.claude.com/docs/en/tools-reference.md — formal definitions of the Agent tool and Workflow tool

**Authoring**

- https://code.claude.com/docs/en/cli-reference.md — `--agents` flag (inline JSON), `--agent` flag (whole session), other CLI
- https://code.claude.com/docs/en/plugins-reference.md — plugin agents, restrictions, naming (`plugin:folder:agent`)
- https://code.claude.com/docs/en/hooks.md — hook events including `SubagentStart` / `SubagentStop` / `WorktreeCreate`
- https://code.claude.com/docs/en/permissions.md — `Agent(name)` syntax for permission rules
- https://code.claude.com/docs/en/worktrees.md — worktree model and `isolation: worktree` semantics
- https://code.claude.com/docs/en/memory.md — agent memory scopes (user / project / local)
- https://code.claude.com/docs/en/skills.md — skills API and `disable-model-invocation`

**Practices**

- https://code.claude.com/docs/en/best-practices.md — subagent patterns: investigation, adversarial review, fan out, parallel sessions
- https://code.claude.com/docs/en/common-workflows.md — step-by-step recipes
- https://code.claude.com/docs/en/glossary.md — term definitions

**Map (use to discover new pages)**

- https://code.claude.com/docs/en/claude_code_docs_map.md — full doc index

**Critical distinction** — do NOT confuse these CLI-level concepts with API "Managed Agents" (`client.beta.agents.create()`, `sessions.create()`). The CLI Agent tool is what the LLM invokes inside the harness; the API is for building your own agentic apps. Same word, different worlds — see `claude-code/subagents.md` for the CLI side and the claude-api skill for the API side.
