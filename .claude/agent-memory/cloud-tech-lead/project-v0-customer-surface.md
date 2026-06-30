---
name: project-v0-customer-surface
description: V0 customer-facing surface decision 2026-06-29 — 14 routes (5 auth + 2 device auth + 1 dashboard + 5 projects + 1 profile). V0 is NOT the managed hosting tier; it's the minimum loop to register a project, link the `deesse` CLI, and see analytics. Full inventory in [[C1-v0-customer-surface]].
metadata:
  type: project
---

On 2026-06-29, the user clarified V0 scope ("un moyen de gérer des projets deessejs, qui permet de lier le cli 'deesse', pour vérifier l'histoire de licence, analyses") and asked what pages we'd need beyond login/signup/forgot-password/home/profile.

**Why:** V0 is dramatically smaller than the managed hosting tier I'd been carrying in memory. The full managed hosting tier (per-tenant Vercel + Turso + Resend + Stripe Connect + PASETO secrets + Drizzle Studio embed) = **V1, not V0**. V0 is the minimum loop: sign up → create project → link CLI → see analytics. Nothing else.

**How to apply:** When a future question touches "what does V0 ship?" or "how many routes?", anchor on the **14-route inventory** in `documents/internal/product/app/C1-v0-customer-surface-2026-06-29.md`. Do NOT anchor on the 23-surface v1 inventory in `C3-escape-hatch-and-portability-2026-06.md` — that doc is parked for v1.

## V0 = 14 routes

| Bucket | Count | Routes |
|---|---|---|
| Auth | 5 | /login, /signup, /forgot-password, /reset-password, /verify-email |
| Device auth | 2 | /device, /device/approve |
| App shell | 1 | /dashboard |
| Projects | 5 | /projects, /projects/new, /projects/[id], /projects/[id]/cli, /projects/[id]/settings |
| Account | 1 | /profile |

## V0 defers (V1 or to apps/web/)

- `/` (landing) → lives in `apps/web/`, not `apps/app/`
- `/onboarding` → inline on `/dashboard` empty state
- `/billing` → V0 license is free during beta
- `/projects/[id]/analytics` → folded into `/projects/[id]` as a tab
- Multi-user / team / invitations → single user per workspace V0
- Per-tenant Vercel/Turso provisioning, PASETO secrets, Stripe Connect, Resend subdomains → all V1

## Key architectural implication

V0 uses **one shared Postgres** (Neon free or Turso single DB) with `tenant_id` on every table. No per-tenant DBs. License verification is a simple HTTP check against a project key (random string in DB), **not** the PASETO `DEESSEJS_SECRET` envelope (that's V1).

## Reuse vs build for auth pages

The template ships `LoginCard` / `SignupCard` / `ForgotPasswordCard` (commit `4712a92` in `apps/template/apps/web/`). Recommendation in C1: reuse the visual pattern in `apps/app/`, adapt copy, ship with Better Auth's handlers. Saves ~1-2 days.

## Open questions still pending (decide before build)

1. ~~**CLI auth route strategy**~~ — **RESOLVED 2026-06-29:** option A (separate `/device` + `/device/approve` routes). Documented in C1 §4.1. The `deesse auth login` command uses **Better Auth's native device authorization plugin** (RFC 8628) — we do not write any custom OAuth code. Inventory lifted from 12 → 14 routes. See [[reference-better-auth-device-flow]].
2. Email verification enforced in V0? (recommendation: yes)
3. Single project view: 1 tab vs 2 tabs? (recommendation: 2 tabs)
4. Regenerate key: confirm modal? (recommendation: yes)
5. Delete project: confirm modal with type-name-to-confirm? (recommendation: yes)
6. Empty state on `/dashboard` for zero projects? (recommendation: illustration + CTA "Create your first project")

## Brand rename that landed today

`apps/cloud/` → `apps/app/`, `@deessejs/cloud` → `@deessejs/app`, `documents/internal/product/cloud/` → `documents/internal/product/app/`. Done 2026-06-29 (task #60-65). Marketing files in `apps/web/`, `documents/internal/marketing/**`, `documents/internal/architecture/**` that mention "DeesseJS Cloud" — NOT renamed (out of my scope, flagged for those agents).

Related: [[C1-v0-customer-surface]] (full doc), [[reference-better-auth-device-flow]] (CLI auth flow API), [[tech-2026-06]] (V1 synthesis, parked)