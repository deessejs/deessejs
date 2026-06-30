---
name: project-build-state-2026-06-25
description: Snapshot of DeesseJS build maturity vs build-roadmap.md (M0-M8) — M1 mostly done, M2 next, ~30% of v1 features built; several scaffold directories empty
metadata:
  type: project
---

# Build state snapshot — 2026-06-25

**Where the repo actually is vs the v1 build roadmap** (`documents/internal/product/build-roadmap.md`).

## Apps (root + nested workspaces)

- `apps/web` (`@deessejs/web` v0.1.0) — **marketing site, active**. PixelBlast three.js hero, header wired to /login /signup /docs. Recent commits (last 10) are all UI tuning on this app.
- `apps/cloud` (`@deessejs/cloud` v0.1.0) — **SKELETON ONLY**. next.config.ts + postcss.config + minimal src/. Supposed to be the "control plane" per architecture/00-system-overview. Currently a lie in the docs.
- `apps/docs` — **Fumadocs 16 scaffolded**. meta.json for Template/Lite tabs, theme black, /redirects to /docs. Content light.
- `apps/template/apps/{web,cli,docs}` — **buyer template workspace**. apps/web has routes (app), (unprotected), api/, layout.tsx. cli + docs empty.
- `apps/template/packages/` (14 declared, 5 built): api (26 files), auth (11), cache (14), database (15), mail (30), ui (11) — **BUILT**. Empty: admin, ai, i18n, logs, notifications, sdk, storage, utils.
- `apps/lite/apps/web` — lead-magnet mini-template, only web/ exists but pnpm-workspace.yaml references cli/docs/packages/* that don't exist → **drift**.
- `apps/demo` — **EMPTY**. Was supposed to be the "first public artifact" (M7 milestone). Critical gap if positioning pivots to "proof of no half-built features."

## Roadmap alignment

| Milestone | State |
|---|---|
| M0 scaffold | Partial (core packages built; trigger.dev, r2, stripe pkgs missing) |
| M1 auth+orgs | Package built; UI wiring blocked on Hono mount |
| M2 RBAC | NOT STARTED (admin pkg = 0 files) |
| M3 billing | NOT STARTED |
| M4 ops (wizard, mails, storage, notifications, blog, docs) | Partiel — mail ✓; wizard/notifications/onboarding = vide |
| M5 API/SDK/CLI | API built; SDK/CLI = vides |
| M6 AI | NOT STARTED (ai pkg = 0 files) |
| M7 landing+checkout | Hero visuel prêt; copy non figé (cf [[project-positioning-drift-2026-06-25]]) |
| M8 QA | NOT STARTED |

**Estimation.** ~3-4 semaines into a 10-week solo plan. Critical path M0→M1→M2→M3 still has M2 (RBAC) and M3 (billing) as the next load-bearing items.

**How to apply.** When asked "what's next?" — M2 RBAC is the natural next milestone. When asked "what's the gap?" — apps/cloud + apps/demo being empty are the two visible holes in the architecture narrative. When asked "is the buyer template shippable?" — no, ~40% of v1 features missing.

Related: [[project-package-implementation-state]], [[project-deessejs-overview]]