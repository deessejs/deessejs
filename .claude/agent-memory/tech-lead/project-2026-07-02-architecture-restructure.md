---
name: project-2026-07-02-architecture-restructure
description: Architecture pivot confirmed by Diego 2026-07-02 — apps/web=marketing, apps/app=Cloud per-tenant shell, packages/ui=DS shared. Buyer template + Lite + CLI live in EXTERNAL sibling repos (template-starter, template-lite, deesse, templates-registry). Reason: avoid nested workspace pain.
metadata:
  type: project
---

# 2026-07-02 architecture — confirmed by Diego

**Status:** canonical. Supersedes the 06-25 snapshot in [[project-build-state-2026-06-25]] and [[project-package-implementation-state]]. Those two memories are now **stale** — do not trust their file paths for the 14 feature packages (those live in `deessejs/template-starter`, not in this monorepo).

## The reframing (load-bearing — Diego's correction 2026-07-02)

**Templates are the center of gravity of the organization AND of this repo.** They are the product. The "Apple of SaaS templates" wedge, the modular contract, the brand promise — all of that is about the templates.

**What changed:** the templates' CODE no longer lives in this monorepo. It moved to sibling repos (`deessejs/template-starter`, `deessejs/template-lite`, etc.). We don't write template code from this repo anymore.

**What this repo IS now:** the organizational hub *around* templates. We build:
- The marketing surface that sells them (`apps/web`)
- The Cloud product that hosts them as per-tenant SaaS (`apps/app`)
- The shared design system they consume (`packages/ui`)
- The CLI scaffolder that creates them (`12-apps/cli/`)
- The templates registry + gallery + deploy button (in `templates-library.md`)

**The boundary for the agent (me):** reasoning about "what's next to build for the template product" is mostly out of scope HERE — that's a `template-starter` conversation, not a `complete-template` conversation. Reasoning about "what's next for the website", "what's next for Cloud", "what's next for the design system", "what's next for the CLI scaffolder", "what's next for the gallery" — that's the in-scope work.

**Why I'm recording this so explicitly:** I previously framed the restructure as "templates moved aside, we focus on web/Cloud now" — which is wrong. Templates are the gravitational center; this repo orbits them. The restructure was about decoupling the CODE base (to avoid nested workspace pain), not about deprioritizing the templates.

## The split

**This monorepo** (`deessejs/deessejs`) ships 4 surfaces:

| Path | Name | What it is | State |
|---|---|---|---|
| `apps/web` | `@deessejs/web` | Marketing site: hero, pricing, blog, changelog, SEO, auth UI shells | 🟢 mature, v0.1.0 |
| `apps/app` | `@deessejs/app` | **DeesseJS Cloud per-tenant app shell** — the SaaS shell DeesseJS hosts per customer | 🟡 scaffold, ~15 files, Next.js 16 + auth UI + (protected)/home + app-sidebar |
| `apps/docs` | (Fumadocs) | Documentation site | 🟡 light content (templates/Tab content) |
| `packages/ui` | `@workspace/ui` | Design system (shadcn v4 `base-nova`, Base UI primitives, Tailwind v4) | 🟡 works, 5/17 primitives shipped, 6 known drifts per `packages/ui/CLAUDE.md` |

**Sibling repos (NOT in this monorepo)** — each on its own purpose, its own CI, its own release cadence:

| Repo | Inferred from | What it is | State |
|---|---|---|---|
| `deessejs/template-starter` | `deessejs/init --template gh:deessejs/template-starter` in [[reference-senior-cli-scaffolding-patterns]] and `12-apps/cli/architecture.md` | Buyer template, self-hosted path. **Contains the 14 feature packages** (api/auth/cache/database/mail/ui/admin/ai/i18n/logs/notifications/sdk/storage/utils) by inference — see "Inference" note below | lived-in, ~40% of v1 features per 06-25 snapshot |
| `deessejs/template-lite` | Same CLI docs | Lead-magnet mini-template (≈ former `apps/lite/`) | early scaffold |
| `deessejs/deesse` | `12-apps/cli/decisions/0002-cli-as-external-published-package.md` ADR 0002 | The `deesse init` CLI scaffolder (npm-published, agent-first) | docs only, no code yet in this repo |
| `deessejs/templates-registry` | `templates-library.md` Q1 + [[reference-vercel-templates-system]] | JSON catalog of templates (gallery reads from here via ISR) | proposed |

**Why:** Diego said *"on a déplacé template et lite vers d'autres repo pour éviter les multi workspaces"*. Rationale: nested pnpm workspaces are painful (dep resolution, build types, CI coupling). One repo = one purpose = clearer ownership + simpler CI.

## Inference note (need Diego's confirmation)

The 14 feature packages (api, auth, cache, database, mail, etc.) being inside `deessejs/template-starter` is **inferred** from `12-apps/cli/architecture.md`:
- The CLI fetches `gh:deessejs/template-starter` via giget as the default buyer template
- That template by definition contains the operating SaaS code (auth, DB, mail, etc.) — there's no separate place for them
- Diego has not explicitly confirmed this

If wrong, the correct location might be:
- A monorepo inside `deessejs/template-starter` with `apps/` + `packages/`
- A separate `deessejs/packages` repo

To verify: ask Diego directly, or read the `manifest.json` of `deessejs/template-starter` once it's accessible.

## What this changes for me (the agent)

- **Don't reference `apps/template/`, `apps/lite/`, `apps/cloud/` or `apps/demo/`** when reasoning — those paths are obsolete in this monorepo.
- **Don't reference the 14 `packages/*` paths** (e.g. `packages/api`, `packages/auth`) — those work happens in `deessejs/template-starter`, not in `complete-template/`.
- **`apps/app` is the Cloud per-tenant shell**, not "the buyer template renamed to a less descriptive name". The Cloud product is a separate offering from the self-hosted template.
- **M1 (auth + orgs)** milestone is about the buyer template (in template-starter repo), NOT about `apps/app`. Cloud's M1 is per-tenant provisioning + session linking.
- **The CLI design in `12-apps/cli/`** is the new scaffolder, separate from any buyer-facing CLI (the latter was in `apps/template/apps/cli/` per system ADR 0002, also now in template-starter repo or gone).
- **`packages/ui` is the cross-repo design system** — it's consumed by `apps/web` AND `apps/app` here, AND should be consumed by `template-starter` once it's extracted (which raises the question: should `packages/ui` also be its own sibling repo?).

## Open concerns this raises

1. **Doc drift, in priority order:**
   - `apps/web/CLAUDE.md` line 7-9 still says *"buyer template (`apps/template/apps/web`) is a separate nested pnpm workspace"* — false now. Needs a 5-line rewrite.
   - `documents/internal/product/build-roadmap.md` references the 14 packages + nested workspace assumptions — partially stale. M0/M1 milestones are in template-starter repo, not this one.
   - `documents/internal/product/features/README.md` "Status by milestone" table still maps features to apps in this monorepo — needs to be reorganized to reflect the split (template features live in template-starter; Cloud features live in apps/app).
   - `documents/internal/architecture/05-modular-contract/` (not yet read) — the wedge doc may be predicated on the nested-workspace modular pattern. Needs review.
   - Positioning drift noted in `apps/web/CLAUDE.md` line: *"positioning.md (stale as of 2026-06-26 — drift tracked in tech-lead memory)"* — still pending.

2. **Cross-repo design system:** `packages/ui` lives here, is consumed by `web` + `app`, but the **buyer template** (the highest-volume consumer) lives in `template-starter`. Three options:
   - **(a)** keep `packages/ui` here, template-starter copies or git-submodules it
   - **(b)** promote `packages/ui` to its own repo `deessejs/ui`
   - **(c)** leave `packages/ui` here, template-starter vendors it via npm: `@deessejs/ui` published from this repo

3. **Memory cleanup:** the old memories `project-build-state-2026-06-25.md` and `project-package-implementation-state.md` carry stale assumptions. The cleanest move is to delete them (superseded by this file). Defer to Diego's call.

4. **22 uncommitted files** — including all the new CLI + templates-library docs. Worth committing in 2 well-scoped commits (CLI docs as one, templates-library as another) before any other work.

## How to apply

When asked about a specific feature's state:
- Check whether it's a *marketing* feature (lives in `apps/web`)
- Check whether it's a *Cloud* feature (lives in `apps/app` here, the rest of the stack in template-starter)
- Check whether it's a *buyer template* feature (lives in `deessejs/template-starter`)
- Check whether it's a *dev tool* feature (lives in `deessejs/deesse` or `deessejs/templates-registry`)

When asked "what's next?" — defer to Diego's milestone for the relevant repo. Don't conflate Cloud M1 with template M1.

When asked about the modular contract — the wedge still holds, but the unit of modularity is **a feature inside `template-starter`** (self-contained, deletable), not a **monorepo package**. The proof test shifts from "delete a workspace package" to "delete a feature folder + its imports from `template-starter`".

Related: [[project-deessejs-overview]] (high-level positioning, still relevant), [[project-deessejs-templates-library-needs]] (4 surfaces, design only — still relevant).
Supersedes: [[project-build-state-2026-06-25]] (snapshot is now stale), [[project-package-implementation-state]] (per-package state is now wrong — packages live in template-starter).
