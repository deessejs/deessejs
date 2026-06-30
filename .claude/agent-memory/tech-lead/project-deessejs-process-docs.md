---
name: project-deessejs-process-docs
description: Three canonical process docs already exist for DeesseJS — role-definitions (what/how/when-safe-to-ship), build-roadmap (M0–M8 milestones with stale checkboxes), release-process (3 release types + semver strict). Agent should reuse, not reinvent.
metadata:
  type: project
---

# Existing process docs as task structure

**Why:** DeesseJS has 3 process docs already in place that the agent did NOT have on its mental map. They're the canonical artifact for task structure — agent's job is to wire them to the live system (GH Project board + labels + milestones), not to design new ones.

**How to apply:** When the user asks "can you manage tasks" or "I want to drop you context and you organize it", the answer is NOT "let me design a system" — it's "let me hook these 3 docs to GH Issues + Project board".

## Three docs

### 1. `documents/internal/process/role-definitions.md` (last_updated 2026-06-17)
Three roles, "what / how / when safe to ship":
- **Founder/PM** (Diego) — owns feature scope, pricing, marketing copy, distribution, buyer voice. Veto on "Apple" promise / no half-built features.
- **Tech lead** (me, as agent) — owns stack, module structure, ADRs, code review, delete-test discipline. Veto on red delete-tests / stale ADRs.
- **Release manager** — owns versioning, changelog, tag, gate. Veto on any release where gate criteria unmet.

→ for the agent, when receiving context from Diego: respect his scope, don't drift into Founder territory (final say on product/positioning).

### 2. `documents/internal/product/build-roadmap.md`
M0 → M8 milestone plan:
- M0: scaffold (M0 = pnpm workspace + Next.js + Drizzle + Better Auth + Tailwind/shadcn + Fumadocs + oRPC + Hono mount + Trigger.dev + Upstash + R2 + Stripe + Resend + .env.example + pnpm dev end-to-end)
- M1: auth + orgs (Better Auth with email/magic/Google OAuth, sessions, 2FA, passkeys, admin plugin, rate-limit, sign-up/in/out pages, org creation + switcher, admin user list, first org-scoped table)
- M2: RBAC (Drizzle tables roles/permissions/rolePermissions/memberRoles, seed 4 default roles per org, `requirePermission(orgId, userId, permission)` helper, role editor UI, permission gates, impersonation UI, audit log)
- M3: Billing (Stripe products/prices, customer portal, org-scoped subs, webhook handler, pricing/checkout/portal UI, usage-based hook, 14-day trial no card)
- M4: Operational features parallel (onboarding wizard 8 steps, mails Resend, storage R2, in-app notifications Realtime, i18n en only, blog Fumadocs first post, docs)
- M5: API + SDK + CLI (oRPC contracts, Hono routes, OpenAPI gen, TS SDK published npm, CLI scaffold)
- M6: AI primitives (LLM provider abstraction Vercel AI SDK, structured output Zod, streaming UI, agent loops, per-tenant cost tracking)
- M7: Landing + sales (landing page, Stripe checkout, email capture, analytics, demo end-to-end deployed)
- M8: Pre-launch QA (delete tests, docs review, 5 fresh-user wizard tests, first-hour measurement, OWASP top 10, Lighthouse)

**Critical:** ~70% of checkboxes in this doc are still `[ ]` but the work has actually been done. This is the "status ✅ aspirational" trap documented in [[feedback-read-spec-titles-and-status-carefully]]. **Status reflection required** before reusing as task source — the doc's truth is in its structure (M0..M8), not its checkboxes.

### 3. `documents/internal/process/release-process.md` (last_updated 2026-06-17)
Three release types with gates:
- **Patch** v0.0.x — infra/deps/tooling. Gate: tech lead alone. Cadence: when increment done, not on timer.
- **Minor** v0.x.0 — feature milestone (M1..M8). Gate: tech lead + release manager.
- **Major** v1.0.0 — commercial GA. Gate: founder + tech lead + release manager, any can veto.

→ pattern: "ship when there's something worth shipping, not on a calendar. Discipline is in the gate, not the cadence."

Cadence plan (planned path): v0.0.1 → v0.0.9 (scaffold patches) → v0.1.0 (M0) → v0.2.0 (M1) → ... → v0.8.0 (M7) → v0.9.0 (M8) → v1.0.0 (GA).

## Wiring plan (when project scope refresh goes through)

- GH labels: `area:{web,marketing,legal,infra,auth,docs,product,design,cloud}`, `priority:{P0,P1,P2,P3}`, `type:{build,copy,infra,research,bug}`, `lane:{quick-fix,backlog,private}`
- GH milestones: M0..M8 + `LAUNCH-PREP` + `OUT-OF-SCOPE`
- Project board "DeesseJS roadmap" with custom fields: Status (Todo/In Progress/In Review/Done/Blocked), Priority, Effort (XS/S/M/L/XL)
- Auto-add workflow (1 allowed on free plan): match `label:lane:backlog` → add to project
- Lane system doc: `documents/internal/process/agent-inbox.md`

Related: [[reference-github-projects-v2-api]], [[project-gh-cli-state]], [[feedback-read-spec-titles-and-status-carefully]]
