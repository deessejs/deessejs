---
name: claude-code-skills
description: Skills concept in Claude Code — CLI SKILL.md (progressive disclosure, frontmatter, locations, invocation, preload via subagents) AND API Skills (versioned objects for Managed Agents)
metadata:
  type: reference
---

Authoritative docs: https://code.claude.com/docs/en/skills.md (CLI) and https://platform.claude.com/docs/en/managed-agents/skills.md (API). Re-fetch when facts are load-bearing.

## Critical distinction: TWO surfaces called "skills"

| | CLI Skills (`SKILL.md`) | API Skills (`/v1/skills`) |
|---|---|---|
| Format | Folder with `SKILL.md` on disk | Versioned object in Anthropic backend |
| Who loads | Claude Code CLI loop (tool `Skill`) | Agent in a Managed container |
| Invocation | Tool `Skill` (auto) or `/<name>` slash command | Container mount at session start |
| Versioning | No | Yes (immutable versions) |
| Who defines | User via file | Developer via SDK/API |
| Network | Full | None (sandbox) |
| Standard | `agentskills.io` (open) | Anthropic beta (`skills-2025-10-02`) |
| Pre-built | None (only custom + bundled CLI utilities) | Yes (`xlsx`/`docx`/`pptx`/`pdf`) |

**Claude Code supports ONLY Custom Skills (filesystem).** The pre-built Anthropic skills (`xlsx` etc.) are NOT available in Claude Code — they're for Managed Agents / claude.ai.

## CLI Skills — philosophy: progressive disclosure

A skill = a folder with a `SKILL.md` that teaches Claude a reusable procedure or domain.

3 load levels:

1. **Metadata** (always in context): `name` + `description` (~100 tokens)
2. **Instructions** (when invoked): body of `SKILL.md`
3. **Resources** (on demand): referenced annex files, scripts, templates

Doc: *"Create a skill when you keep pasting the same instructions, checklist, or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact."*

## File structure

```
my-skill/
├── SKILL.md            # Required
├── template.md         # Optional
├── examples/           # Optional
└── scripts/            # Optional
```

Keep `SKILL.md` < 500 lines — move detail into referenced files.

## Frontmatter fields

| Field | Notes |
|---|---|
| `name` | Display name. Default = folder name. For plugin root SKILL.md, `name` becomes the slash command. |
| `description` | **Recommended.** Drives auto-discovery. Cap 1536 chars combined with `when_to_use`. |
| `when_to_use` | Additional context (triggers, example queries). Appended to `description`. |
| `argument-hint` | Autocomplete hint: `[issue-number]`, `[filename] [format]` |
| `arguments` | Named arguments for `$name` substitution |
| `disable-model-invocation` | `true` = user-only. Cannot be preloaded. Default `false`. |
| `user-invocable` | `false` = hidden from `/` menu. Background knowledge. Default `true`. |
| `allowed-tools` | Tools usable without permission prompts during the skill. Doesn't restrict the pool. |
| `disallowed-tools` | Tools removed from pool during the skill. Lifts on next user message. |
| `model` | Override for the current turn (`sonnet`/`opus`/etc./`inherit`) |
| `effort` | `low`/`medium`/`high`/`xhigh`/`max` |
| `context` | `fork` = runs in isolated subagent |
| `agent` | Subagent type if `context: fork`. Default `general-purpose`. |
| `hooks` | Lifecycle hooks scoped to the skill |
| `paths` | Glob patterns limiting activation to matching files |
| `shell` | `bash` or `powershell` (requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`) |

## 3 canonical combinations

| Frontmatter | User invokes | Claude invokes | When loaded |
|---|---|---|---|
| (default) | Yes | Yes | Description in context, body on invoke |
| `disable-model-invocation: true` | Yes | No | Description NOT in context, body on user invoke |
| `user-invocable: false` | No | Yes | Description in context, body on auto invoke |

## Locations (priority order)

1. **Enterprise** (managed settings) — entire org
2. **Personal**: `~/.claude/skills/<skill>/SKILL.md` — all your projects
3. **Project**: `.claude/skills/<skill>/SKILL.md` — versionable
4. **Plugin**: `<plugin>/skills/<skill>/SKILL.md` — namespaced `plugin:skill`
5. **Bundled** — shipped with Claude Code (unless `disableBundledSkills`)

Personal/project override bundled with same name. Live reload (no restart needed).

Nested discovery: skills also loaded from `.claude/skills/` in subdirectories, scoped (e.g. `apps/web:deploy`). `--add-dir` picks them up too.

## Invocation

- **Tool `Skill`** (auto) — Claude decides if description matches
- **`/<skill-name>`** (user) — works even for `disable-model-invocation: true`
- **`/plugin:skill`** — scoped skills

`skillOverrides` in settings tunes visibility without editing `SKILL.md`.

## Preload via subagents

`skills:` field in `.claude/agents/<name>.md` injects **full content** at subagent start (not just descriptions).

**Constraint**: `disable-model-invocation: true` skills CANNOT be preloaded (explicit in docs).

Doesn't restrict access to other skills — to fully block, remove `Skill` from `tools` or add to `disallowedTools`.

## Built-in skills shipped with Claude Code

**App workflow**: `/run`, `/verify`, `/run-skill-generator`
**Dev**: `/code-review` (low/medium/high/max), `/batch` (big change → 5-30 parallel worktrees, each opens a PR), `/debug`, `/simplify`
**Meta/ops**: `/init`, `/update-config`, `/keybindings-help`, `/fewer-permission-prompts`, `/loop`, `/claude-api`, `/review`, `/security-review`, `/statusline`, `/insights`, `/team-onboarding`

## Variable substitutions

- `$ARGUMENTS` — all args joined. Without it in body, Claude Code appends `ARGUMENTS: <args>` automatically.
- `$0`, `$1`, `$2` — positional args
- `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`

## Dynamic context injection (!command)

`!`command`` blocks execute BEFORE Claude sees the prompt — output replaces placeholder. `!` must be at line start or after whitespace. For multi-line: fenced block ` ```! ... ``` `.

## Best practices

- **`description` is THE decisive field.** *"the single most important factor in whether Claude invokes the skill"*. Put key use case first (truncated to 1536 chars).
- **Conciseness** — once loaded, content stays in context for rest of session (recurring token cost).
- **Splitting** — 3 skills × 100 lines > 1 × 300.
- **Preload vs on-demand**: subagent specialized → preload; reference → auto-discovery; user-triggered workflow → `disable-model-invocation`; used by ALL agents → put in CLAUDE.md instead (recurring cost).
- **Test with `skill-creator` plugin** (eval cases, benchmark with/without, tune description).
- **`allowed-tools` too broad** = danger in shared-repo skill.

## Pitfalls

- Never triggered → description too vague → add natural triggers, test with skill-creator
- Over-triggered → description too broad → narrow it or `disable-model-invocation: true`
- Description cut in listing → too many skills / too long → `skillOverrides: {skill: "name-only"}`, raise `skillListingBudgetFraction`, trim
- YAML malformed → Claude loads body without description → run `--debug`
- Skill loses influence after several turns → not lost, model picks other tools → reinforce description or use hooks for enforcement
- `context: fork` without explicit task → subagent gets guidelines but no task → add task or remove `context: fork`
- Preloading a `disable-model-invocation: true` skill → use different skill or remove that flag
- `Bash(${CLAUDE_PROJECT_DIR}/...)` in `allowed-tools` doesn't match → upgrade Claude Code (fixed v2.1.196)
- `!cmd`` doesn't execute → `!` preceded by char → put `!` at line start or after whitespace
- Custom skill doesn't override bundled → check path

## API Skills (Managed Agents) — quick reference

**Beta header**: `anthropic-beta: skills-2025-10-02`

**Endpoints**:

- `POST /v1/skills` — create (upload zip or files via `files_from_dir()`)
- `GET /v1/skills` — list
- `POST /v1/skills/{id}/versions` — new immutable version
- `GET /v1/skills/{id}/versions/{version}/download` — download

CLI: `ant beta:skills create --file example_skill.zip --beta skills-2025-10-02`

**Attach to agent** (`agents.create`):

```python
agent = client.beta.agents.create(
    model="claude-opus-4-8",
    skills=[
        {"type": "anthropic", "skill_id": "xlsx"},
        {"type": "custom", "skill_id": "skill_abc123", "version": "latest"},
    ],
)
```

**Limits**: 20 skills per session (counted across all multiagent agents).

**Pre-built Anthropic**: `xlsx`, `docx`, `pptx`, `pdf`. NOT available in Claude Code.

**Runtime constraints** (API/Managed): no network, no runtime package install, only pre-installed packages.

**Not ZDR-eligible** — skill definitions and execution data follow standard retention.

Related: [[claude-code-subagents]] (subagent `skills:` field preloads them), [[claude-code-workflows]], [[claude-code-index]].
