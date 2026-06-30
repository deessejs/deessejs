---
name: project-web-tech-lead-agent
description: New web-tech-lead subagent created 2026-06-26 — owns apps/web (live) + apps/docs + packages/ui; do NOT route apps/template work to it
metadata:
  type: project
---

A new custom subagent was added on 2026-06-26: **`web-tech-lead`** (defined at `.claude/agents/web-tech-lead/README.md`, memory at `.claude/agent-memory/web-tech-lead/`).

## Scope split

| Path | Owning agent |
|---|---|
| `apps/web/` (LIVE marketing site) | **web-tech-lead** |
| `apps/docs/` (Fumadocs) | **web-tech-lead** |
| `packages/ui/` | **web-tech-lead** (read + write) |
| `packages/*` consumed by web/docs | **web-tech-lead** |
| `scripts/` + root monorepo config | **web-tech-lead** |
| `apps/template/**` | **tech-lead** (you, this agent) |
| `apps/lite/**` | **tech-lead** |
| `apps/cloud/**` | **tech-lead** |

## Why this split

`apps/web/` (the live DeesseJS marketing site) and `apps/template/apps/web/` (the buyer template marketing) are **two different apps** with different audiences. They share a folder name by historical accident, not by design. Putting them under different agents prevents:
- Drift between the founder-facing live site and the buyer-facing template copy
- Confusion when "the blog" or "the homepage" is mentioned (web-tech-lead handles the live one, tech-lead handles the template one)
- Mixed contexts when reviewing PRs that touch both

## How to use this in hand-offs

When you (tech-lead) get a request that involves a path under `apps/web/` or `apps/docs/` and the work is about the **live** site (real pricing, real hero, real founder copy), route it to `web-tech-lead`. Specifically:

- "Change the pricing on the home page" → if `apps/web/src/app/(unprotected)/(marketing)/page.tsx` → web-tech-lead
- "Update the docs landing" → if `apps/docs/src/app/(home)/page.tsx` → web-tech-lead
- "Add a new shadcn component to the design system" → web-tech-lead (packages/ui is in scope)
- "Add a blog post to the buyer template" → tech-lead (you) — spec 15 is template-scope
- "Wire up blog for the live marketing site" → web-tech-lead (delete-test anchored in apps/web)

## When to be cautious

The path ambiguity is real. Always check `git status` and verify the file path before assuming scope. If the path is ambiguous, ask.

**How to apply:** When delegating work or reviewing code, check the path. If under `apps/web/` or `apps/docs/`, this is `web-tech-lead`'s domain unless the task explicitly says "for the buyer template" (which then routes back to apps/template/apps/web/, your domain).

Related: [[project-deessejs-overview]] (overall product context), [[feedback-read-spec-titles-and-status-carefully]] (spec 15 = buyer template scope)