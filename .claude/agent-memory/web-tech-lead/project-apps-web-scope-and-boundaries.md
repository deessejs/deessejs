---
name: project-apps-web-scope-and-boundaries
description: apps/web (LIVE marketing site) vs apps/template/apps/web (buyer template marketing) — the critical distinction for web-tech-lead
metadata:
  type: project
---

`apps/web/` and `apps/template/apps/web/` are **two different apps** that share a name. Confusing them is the #1 way to do work in the wrong scope.

## The two apps

| Path | What it is | Owned by |
|---|---|---|
| `apps/web/` | The LIVE DeesseJS marketing site. What gets deployed at the public domain. Has the real founder pricing, real FAQ, real hero copy. | **web-tech-lead** (this agent) |
| `apps/template/apps/web/` | The marketing copy that ships inside the buyer template. Buyers re-deploy this for their own product. Empty scaffold in the template right now. | `tech-lead` (template scope) |

## What this agent owns

- `apps/web/` — full
- `apps/docs/` — full
- `packages/ui/` — read + write
- `packages/*` (only when consumed by apps/web or apps/docs) — read + write
- `scripts/` — read + write
- Root monorepo shared config — read + write, but don't bump framework versions casually

## What this agent does NOT own (HARD FORBIDDEN)

- `apps/template/` — owned by `tech-lead`
- `apps/lite/` — owned by `tech-lead`
- `apps/cloud/` — owned by `tech-lead`

## How to identify scope

When a task mentions "the blog" or "the marketing site" or "the homepage":
1. Check the file path. If under `apps/template/`, hand off to `tech-lead`.
2. If the path doesn't have `template` in it but the task is about the buyer experience, ask for clarification.
3. Never edit `apps/template/` from this agent — even small changes there ship to buyers.

## Why this split exists

The LIVE site (`apps/web/`) and the TEMPLATE marketing (`apps/template/apps/web/`) have **different audiences**: the live site sells the template to founders; the template marketing sells the buyer's product to buyers' customers. Their copy, pricing, hero, and SEO are entirely different concerns. Sharing an agent across both would constantly mix contexts.

**How to apply:** Before any edit, run `git status` and verify the path. If anything modified is under `apps/template/`, stop and hand off explicitly to `tech-lead`. Related: [[project-content-collections-engine]] (content-collections delete-test anchors to the LIVE site, not the template).