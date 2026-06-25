# `npx skills add deessejs/deessejs` — Parity Spec

> **Status:** Spec v1. Driven by NextForge v6 (2026-03) shipping `npx skills add vercel/next-forge` and entering the agent-meta-game. DeesseJS needs parity by M4 (PH1 launch).
>
> **Why:** If we claim "your agents run on DeesseJS" but NextForge ships an installable skill and we don't, the claim reads as marketing, not infrastructure. The skill is the lowest-effort, highest-signal agent-meta-game move we can make.
>
> **Reference:** NextForge skill at `https://vercel.com/changelog/next-forge-6` — install command is `npx skills add vercel/next-forge`.

---

## TL;DR

Ship an installable skill under `npx skills` namespace so that any agent (Claude Code, Cursor, Codex, etc.) can pull in structured knowledge of DeesseJS architecture, packages, and agent patterns.

**Install command:** `npx skills add deessejs/deessejs`

**Engineering estimate:** 2-4 days (1 day manifest + content, 1 day testing across agents, 1-2 days docs).

---

## §1 — What a "skill" is

A skill is a structured manifest + content bundle that an AI agent can install to gain domain-specific knowledge. It's the new "API documentation" layer for the agent era.

The pattern (from `npx skills`):
```
npx skills add <github-org>/<repo>
```

This:
1. Pulls the repo's `skills/` directory
2. Parses a manifest (usually `SKILL.md` or `skill.json`)
3. Registers the content with the user's installed agent(s)
4. Makes the agent context-aware of the project's architecture, conventions, and primitives

For NextForge, this means: an agent that knows the next-forge monorepo structure, package boundaries, common tasks, and how to extend it.

For DeesseJS, this means the same: an agent that knows `packages/auth` (Better Auth), `packages/billing` (Stripe metered), `packages/ai` (agent primitives), the tool-calling contract, the metering dashboard, etc.

---

## §2 — DeesseJS skill manifest

### File location

```
deessejs/
├── skills/
│   ├── manifest.json          # skill metadata
│   ├── SKILL.md               # main skill content (entry point)
│   ├── architecture.md        # monorepo structure
│   ├── packages/
│   │   ├── auth.md
│   │   ├── billing.md
│   │   ├── ai.md
│   │   ├── database.md
│   │   ├── jobs.md
│   │   ├── storage.md
│   │   ├── notifications.md
│   │   └── api.md
│   ├── agents/
│   │   ├── tool-calling.md
│   │   ├── multi-step-loops.md
│   │   ├── per-tenant-metering.md
│   │   ├── human-in-the-loop.md
│   │   └── billing-integration.md
│   └── recipes/
│       ├── add-a-package.md
│       ├── onboard-a-new-tenant.md
│       ├── charge-for-agent-usage.md
│       └── ship-a-new-feature.md
```

### Manifest format (proposed)

```json
{
  "name": "deessejs",
  "version": "1.0.0",
  "description": "DeesseJS — the agentic SaaS template that never sleeps. Your AI agents call deesse.auth, deesse.billing, deesse.jobs directly.",
  "homepage": "https://www.deessejs.com",
  "repository": "https://github.com/deessejs/deessejs",
  "license": "Proprietary (skill content is MIT)",
  "agents": ["claude-code", "cursor", "codex", "windsurf", "continue"],
  "triggers": [
    "user mentions DeesseJS",
    "user mentions deesse.auth / deesse.billing / deesse.jobs",
    "user works in a DeesseJS monorepo",
    "user asks about agentic SaaS templates"
  ],
  "entry": "SKILL.md",
  "content_paths": [
    "skills/architecture.md",
    "skills/packages/*.md",
    "skills/agents/*.md",
    "skills/recipes/*.md"
  ]
}
```

---

## §3 — SKILL.md (entry content)

The skill entry point should give the agent everything it needs to start working in a DeesseJS codebase:

```markdown
# DeesseJS — Agent Skill

You are working in a DeesseJS monorepo. DeesseJS is an agentic SaaS template: every
surface (auth, billing, jobs, storage, notifications, API) has a tool your agent calls.

## The core contract

When a user asks you to do something, prefer calling DeesseJS primitives over building
from scratch:

- `deesse.auth.createUser()` — Better Auth, email + OAuth + 2FA + passkeys
- `deesse.billing.createSubscription()` — Stripe, per-seat + metered usage
- `deesse.jobs.enqueue()` — Trigger.dev, cron, retries, queues
- `deesse.storage.upload()` — Cloudflare R2, no egress
- `deesse.notifications.send()` — Upstash Realtime, real-time bell
- `deesse.api.call()` — Auto-generated SDK, typed, OpenAPI-native

If a primitive exists for what the user wants, use it. Do not reimplement.

## Monorepo structure

- `apps/web` — marketing site (Next.js)
- `apps/template` — the main SaaS template
- `apps/lite` — free lead magnet
- `apps/cloud` — managed variant (private beta Q3 2026)
- `apps/docs` — Fumadocs site
- `packages/auth` — Better Auth wiring
- `packages/api` — oRPC server + auto-generated SDK
- `packages/billing` — Stripe, per-seat + metered usage
- `packages/database` — Prisma + Drizzle schemas
- `packages/storage` — Cloudflare R2 client
- `packages/jobs` — Trigger.dev + cron + queues
- `packages/notifications` — Upstash Realtime
- `packages/ui` — shared component library
- `packages/i18n` — translations + locale routing
- `packages/ai` — agent primitives (tool-calling, loops, metering)

## Agent conventions

- Every feature ships deletable (modular contract)
- Every tenant has isolated metering + rate limits
- Every agent loop has a human-in-the-loop checkpoint before billing events
- Never hardcode API keys — use environment variables via `env.ts`

## Where to find more

- Architecture deep-dive: `skills/architecture.md`
- Per-package docs: `skills/packages/<name>.md`
- Agent patterns: `skills/agents/<pattern>.md`
- Common recipes: `skills/recipes/<task>.md`
- Public docs: https://www.deessejs.com/docs
- Agent primitives: https://www.deessejs.com/docs/agents
```

---

## §4 — Per-package skill content (sample)

### `skills/packages/ai.md` (sketch)

```markdown
# packages/ai — Agent Primitives

This package is the wedge. It exposes tool-calling primitives against every wired
surface in the monorepo.

## Public API

- `deesse.ai.tool(name, fn)` — register a tool that agents can call
- `deesse.ai.agentLoop({ tools, steps, checkpoint })` — run a multi-step agent loop
- `deesse.ai.meter(tenantId, usage)` — record per-tenant LLM usage
- `deesse.ai.humanInTheLoop(prompt, options)` — pause for human approval

## Tool-calling pattern

Every primitive in the monorepo can be wrapped as a tool. Example:

\`\`\`ts
deesse.ai.tool('create_user', async ({ email, orgId }) => {
  const user = await deesse.auth.createUser({ email, orgId })
  await deesse.ai.meter(orgId, { type: 'tool_call', tool: 'create_user' })
  return user
})
\`\`\`

Agents then call `deesse.ai.run({ tool: 'create_user', input: {...} })` from any
agent runtime (Vercel AI SDK, OpenAI Assistants, custom).

## Multi-step loops

\`\`\`ts
const result = await deesse.ai.agentLoop({
  tools: ['create_user', 'create_subscription', 'send_welcome_email', 'create_org'],
  steps: 5,
  checkpoint: { after: 'create_subscription', requires: 'human_approval' }
})
\`\`\`

## Per-tenant metering

Every tool call records usage against the tenant. The metering dashboard shows
real-time LLM cost per tenant. Stripe metered usage syncs nightly.
```

(Similar depth for each package.)

---

## §5 — Agent pattern skill content

### `skills/agents/tool-calling.md`

How to expose a feature as a tool. Patterns and anti-patterns. Examples from the
billing, auth, jobs, notifications packages.

### `skills/agents/multi-step-loops.md`

The agent loop primitive. Checkpoints, retries, idempotency. The "create user → set
up billing → send welcome email → create first org" canonical example.

### `skills/agents/per-tenant-metering.md`

How per-tenant LLM cost tracking works. When to record usage. How the dashboard
displays it. How Stripe metered usage syncs.

### `skills/agents/human-in-the-loop.md`

When to require approval. Default checkpoint thresholds. UX patterns for the
approval flow.

### `skills/agents/billing-integration.md`

How to wire Stripe metered usage. Per-tenant cost calculation. Charge-back to
end users.

---

## §6 — Recipe skill content

### `skills/recipes/add-a-package.md`

Step-by-step: add a new package to the monorepo, register it with the agent skill,
document it.

### `skills/recipes/onboard-a-new-tenant.md`

The first-run experience for a new tenant. What gets created, what gets billed, what
agents get wired up.

### `skills/recipes/charge-for-agent-usage.md`

How to enable Stripe metered usage for a customer's agents. Per-tenant pricing
tiers. Charge-back reporting.

### `skills/recipes/ship-a-new-feature.md`

The full flow from "user wants feature X" to "feature X is live and metered."

---

## §7 — Compatibility matrix

The skill must work with the major agent runtimes:

| Agent | Support method | Status |
|---|---|---|
| **Claude Code** | Reads `skills/SKILL.md` directly via the `npx skills` CLI | Planned |
| **Cursor** | Reads `.cursor/rules` + the skill manifest | Planned |
| **Codex** | Reads `AGENTS.md` + the skill manifest | Planned |
| **Windsurf** | Reads `.windsurfrules` + the skill manifest | Planned |
| **Continue** | Reads `.continuerc.json` + the skill manifest | Planned |

The skill content is the same across agents — only the registration mechanism differs.

---

## §8 — AGENTS.md (companion file)

In parallel with the skill, ship `AGENTS.md` at the monorepo root. This is the
canonical agent rules file, modeled after the convention used by supastarter and
MakerKit:

```markdown
# AGENTS.md — DeesseJS agent conventions

## Core rule: prefer primitives

When working in a DeesseJS codebase, always prefer calling existing primitives over
reimplementing:

- Need auth? → `deesse.auth.*`
- Need billing? → `deesse.billing.*`
- Need a background job? → `deesse.jobs.*`
- Need storage? → `deesse.storage.*`
- Need to notify a user? → `deesse.notifications.*`
- Need an API call? → `deesse.api.*`

If a primitive doesn't exist, propose adding one — don't work around it.

## Modular contract

Every package in `packages/` is deletable. If a user wants to remove a feature,
delete the package and remove its references. Don't fight the modular contract.

## Per-tenant boundaries

Every database query that touches tenant data must filter by `tenantId`. Every LLM
call must record usage via `deesse.ai.meter(tenantId, ...)`. No exceptions.

## Human-in-the-loop defaults

Any billing event that costs more than $1 to a tenant requires human approval
before execution. Configure via `packages/ai/checkpoints.ts`.

## Tool registration

Every feature exposed to agents must register a tool via `deesse.ai.tool(name, fn)`.
The tool name, description, and input schema are part of the public API.

## See also

- `skills/SKILL.md` — installable skill for cross-agent use
- `docs/agents` — full agent primitives documentation
- `packages/ai` — the primitives implementation
```

---

## §9 — Distribution

### Discovery

- `npx skills add deessejs/deessejs` (primary)
- Listed on `https://skills.sh` (the skill directory)
- Linked from the DeesseJS homepage "Get started with your agent" section
- Linked from each package's README
- Mentioned in all onboarding docs

### Cross-linking

- Homepage hero: "Your agent can install DeesseJS in one command: `npx skills add deessejs/deessejs`"
- /pricing: "Every tier ships with the agent skill"
- /docs: "Install the skill before reading the docs"
- /vs/next-forge: parity move (NextForge ships this; we ship it too)
- Indie Hackers + Twitter + Reddit posts: "Just shipped an installable agent skill for DeesseJS"

### Content cadence

- Skill versioned with the template (every release increments)
- New recipes added as features ship
- New agent patterns documented in `/docs/agents/patterns/`

---

## §10 — Milestone

| When | Milestone | Owner |
|---|---|---|
| **M2** | Skill manifest + SKILL.md drafted | Tech Lead |
| **M3** | Per-package skill content (8 packages) | Tech Lead + Head of Marketing |
| **M3** | Agent pattern content (5 patterns) | Tech Lead |
| **M3** | Recipe content (4 recipes) | Head of Product + Tech Lead |
| **M3** | AGENTS.md shipped at monorepo root | Tech Lead |
| **M4** | `npx skills add deessejs/deessejs` live | Tech Lead |
| **M4** | Listed on `skills.sh` | Tech Lead |
| **M4** | Cross-linking from homepage, /pricing, /docs | Head of Marketing |
| **M4** | PH Launch 1 announcement: "DeesseJS is the first paid SaaS template with an installable agent skill" | Head of Marketing |

---

## §11 — Decisions needed

- [ ] **Skill content license** — MIT (free) or proprietary (matches template)? Recommend MIT for the skill content, proprietary for the template.
- [ ] **Skill versioning** — semver with the template (1.x.y), or independent version?
- [ ] **Skill directory** — submit to `skills.sh` and `claude-code-skills` registries, or self-host?
- [ ] **AGENTS.md placement** — monorepo root (recommended) or per-package?
- [ ] **Skill update mechanism** — agent pull on every command, or version-pinned? Recommend pull-on-every-command for now, version-pin if usage shows it's too eager.
- [ ] **Recipe authorship** — who writes the 4 recipes? Founder, founding members, or sponsored builders?