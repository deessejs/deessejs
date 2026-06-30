---
name: project-apps-cloud-scope-and-boundaries
description: apps/cloud (skeleton) + documents/internal/product/cloud/** + feasibility doc + packages/* — full scope IN/OUT for cloud-tech-lead
metadata:
  type: project
---

## IN scope (full ownership)

| Path | Current state | What you'll do there |
|---|---|---|
| `apps/app/` | **`create-next-app` skeleton — successor of `apps/cloud/`. Package name `@deessejs/app`, NOT `@deessejs/cloud`. Has AGENTS.md → "This is NOT the Next.js you know. APIs, conventions, and file structure may all differ. Read `node_modules/next/dist/docs/` before writing any code."** Currently on next 16.2.9 + react 19.2.4. Only `layout.tsx`, `page.tsx`, `globals.css`, `favicon.ico` exist. `apps/cloud/` was removed from pnpm-workspace on 2026-06-29 (commit `c9d00df`) and replaced with `apps/app/`. | Lay the first bricks when Cloud build starts. Today: zero source files of substance (route scaffolds added 2026-06-30: `(auth)/login`, `(auth)/signup`, `(auth)/reset-password`, `(dashboard)/home`). |
| `apps/cloud/` | **DOES NOT EXIST.** Removed from pnpm-workspace + removed from disk. If you see `apps/cloud/` references in old memory or old commits, they're stale. | None. Update references to `apps/app/`. |
| `documents/internal/product/cloud/**` | 5 docs + 1 synthesis: `A2-vercel-platforms.md`, `B3-secret-lifecycle.md`, `B4-llm-metering.md`, `C3-escape-hatch-and-portability-2026-06.md`, `tech-2026-06.md` (synthesis) | The source of truth. Read before answering, write when a new primitive is decided. |
| `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` | Business case, ~370 lines, dated 2026-06-16. Partially stale for tech details (see [[project-cloud-feasibility-staleness]]). | You may edit. Anchor tech claims on `tech-2026-06.md` and the Vercel 30-min changelog, not on the original 300s claim. |
| `documents/internal/product/positioning.md` (Cloud sections only) | Cross-cutting product doc | **Read-only.** Anything that touches Cloud pricing/positioning is owned by the user. Flag conflicts, don't fix them. |
| `documents/internal/product/pricing.md` (Cloud sections only) | Cross-cutting product doc | **Read-only** on Cloud. Same rule. |
| `packages/*` | Multiple shared packages (ui, database, auth, etc.) | **Read + write.** When Cloud needs a shared primitive, you write it. Coordinate via PR description if the file is shared with `tech-lead` or `web-tech-lead` scope. |
| Root monorepo config | `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, root `tsconfig.base.json` | **Read + write** for Cloud-specific changes only. Don't bump framework versions casually. |

## OUT of scope (hand off)

| Path | Owner | Why |
|---|---|---|
| `apps/web/`, `apps/docs/` | `web-tech-lead` | Public-facing apps. Not Cloud. |
| `apps/template/`, `apps/lite/` | `tech-lead` | The buyer template + OSS subset. Cloud is the operator's product, not the buyer's. |
| Cloud business case / pricing / go-no-go | **the user directly** | You're a tech-lead, not a PM. Flag the decision surface, hand off. |
| Cloud marketing copy | `head-of-marketing` | Different concern. |
| Cloud spec changes that affect v1 features | `tech-lead` + the user | v1 ships to buyers too. Don't unilaterally break the contract. |

## Apps/cloud is empty — don't over-invest in code yet

The first six months of this agent's life will be docs work, not code. If you find yourself writing a lot of TypeScript before Q3 2026, you're probably over-reaching. The build window is gated by the **30-tenant beta + Vercel 12-concurrent-builds ceiling** — neither of which you can de-risk without real tenants.

**How to apply:** Before any `apps/cloud/` edit, ask: "does this require a v0 decision from the user?" If yes, write the A/B/C doc first and stop. If no (e.g. tidying the README), go ahead.

Related: [[project-cloud-v0-private-beta]] (the v0 plan), [[feedback-cloud-docs-are-primary]] (the meta-rule)