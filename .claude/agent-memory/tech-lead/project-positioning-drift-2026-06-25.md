---
name: project-positioning-drift-2026-06-25
description: RESOLVED 2026-06-26 — DESIGN.md agentic pivot is canonical. product/README.md + positioning.md still stale; rewrite queued. Apple = sub-principle of polish, no longer the wedge.
metadata:
  type: project
---

# Positioning drift — RESOLVED 2026-06-26

## The original inconsistency (2026-06-25)

Two positionings were simultaneously active in the repo:

- **DESIGN.md (root, fresh):** "The SaaS template that never sleeps — your agents are the developers" → agentic wedge, terminal/code aesthetics, restraint + polish as sub-principle. Apple's bar survives in polish, not in framing.
- **documents/internal/product/README.md + positioning.md (stale):** "The Apple of SaaS templates" → completeness + DX wedge, Stain Lu quote in hero, modular contract as differentiator from supastarter.

## The resolution (2026-06-26)

User picked **« Agentic gagne (réécrire la doc produit) »** in the AskUserQuestion prompt about positioning drift (asked during the spec 15 deep-dive).

**Decision:** the agentic pivot is canonical. `documents/internal/product/README.md` + `positioning.md` need to be rewritten to match `DESIGN.md`. Apple becomes the sub-principle of polish only, not the wedge.

## Why this matters (still)

Every copy decision, every feature priority, every UI choice can now resolve through the agentic frame. The wedge is: "your agents run on DeesseJS, call the tools directly, build your product while you sleep". Apple's bar survives in restraint + completeness + polish, not in framing.

The decisions that flowed from this resolution during the same session:
- **15.15 in-app release notifications REMOVED** — replaced with RSS-only (15.16). Justification cited the agentic frame: "agents that want release note updates can subscribe to an RSS feed via tool calls; no need for a DeesseJS-specific API". In-app fan-out would have required a custom notification system that's awkward for agents to consume.
- **15.13 release notes are fully manual MDX** (no auto git-tag generation) — aligns with "agents are the executors, not just the users". Buyers' agents can write release notes; the format is what an agent naturally produces.

## How to apply

- When asked "what's the wedge?" → agentic. Apple = polish sub-principle.
- When asked "rewrite product/README.md" → do it. Match DESIGN.md §0 tone. Drop Stain Lu quote if it doesn't survive the agentic frame.
- When asked "what does positioning X imply for feature Y?" → ask "would an AI agent benefit from this feature existing?" before recommending.
- New features should be evaluated through the lens: "do my agents need this surface, and can they call it natively?"

## Status of follow-up work

- [ ] Rewrite `documents/internal/product/README.md` to match agentic pivot
- [ ] Rewrite `documents/internal/product/positioning.md` to match agentic pivot
- [ ] Update landing page copy in `apps/web/src/app/page.tsx` to align (some already does, some doesn't)
- [ ] Update pricing tier descriptions in `apps/web/src/app/page.tsx` (some language still Apple-flavored)
- [ ] Update FAQ in landing page (some questions explicitly frame the Apple positioning)

Related: [[project-deessejs-overview]], [[project-build-state-2026-06-25]], [[project-blog-feature-spec-analysis]]