---
name: project-deessejs-lane-system-proposal
description: Proposed 3-lane task workflow for DeesseJS (Lane A quick fix / Lane B public issue / Lane C draft scratchpad), with the decision rule and label schema. Proposed 2026-06-30, awaiting Diego's explicit confirmation.
metadata:
  type: project
---

# Lane system proposal — task workflow for DeesseJS

**Status:** 🟡 PROPOSED 2026-06-30. Not yet explicitly approved by Diego. Pending go/no-go decision.

## Why

Diego's working pattern (multiple context-drops in conversation, mixing "fix this typo" with "create the OSS program"): the agent needs a routing rule so each message lands in the right place without him having to specify. Currently proposed 3-lane system.

## The 3 lanes

### 🚀 Lane A — Quick fix (no item)

**Trigger:** correction ciblée, single file, <30min, no dependencies.

**Agent action:** fix directly, confirm done in the response, optionally mention in daily note.

**Examples Diego gave:**
- "modifier le lien de la dc qui est faux"
- "le H1 de la home est double"
- "le spacing du footer est cassé sur Safari"

**Outcome:** no GitHub artifact. No tracker noise. Just done.

### 📋 Lane B — Public issue

**Trigger:** multi-step, multi-day, deserves visibility, has acceptance criteria, wants PR link.

**Write path:**
```bash
gh issue create --repo deessejs/deessejs \
  --title "[M2] Implement RBAC role editor UI" \
  --body "..." \
  --label "area:web,priority:P1,type:build" \
  --milestone "M2-RBAC"
gh project item-add <PROJECT> --owner deessejs --url <issue-url>
```

**Examples Diego gave:**
- "créer le programme oss"
- "créer le programme students"
- "faire l'app de démo"
- "terminer la privacy policy"

**Outcome:** public issue, milestone-tagged, labeled, in the project board. Buyer/contributor can see + discuss.

### 🔒 Lane C — Private draft

**Trigger:** agent needs to remember something Diego said, OR Diego's note is internal/personal/not ready for public consumption.

**Write path:**
```bash
gh project item-create <PROJECT> --owner deessejs \
  --title "..." \
  --body "..."
```

**Examples:**
- "fix internal typo in M3 spec"
- "review competitor pricing" (until I'm ready to share the analysis publicly)
- "ask lawyer about X" (legal stuff stays internal until sanitized)
- "todo for tomorrow" (personal scratchpad)

**Outcome:** draft item in the project board. No repo URL, no search visibility, can only be seen in the project itself.

## Decision rule (the agent's classifier)

When Diego drops context, apply this single question:

> **"Does this task warrant the repo knowing it exists?"**

- **Yes → Lane B (issue)**
- **No / not yet → Lane C (draft)**
- **Trivial fix → Lane A (no item)**

Edge cases:
- "I'm not sure" → ask one quick clarifying question, or default to Lane C (safer to start private, promote later).
- "Both" (e.g. multi-step but with private sub-tasks) → Lane B for the parent, Lane C drafts for sub-steps.

## Proposed label schema

`area:*` — scope of the change:
- `area:web`, `area:marketing`, `area:legal`, `area:infra`, `area:auth`, `area:docs`, `area:product`, `area:design`, `area:cloud`

`priority:*` — ship-blocking weight:
- `priority:P0` (bloqueur ship, à fix immédiatement)
- `priority:P1` (important pour la release en cours)
- `priority:P2` (nice-to-have cette release)
- `priority:P3` (backlog)

`type:*` — nature du travail:
- `type:build` (feature work)
- `type:copy` (writing / copyediting)
- `type:infra` (tooling, CI, deploy)
- `type:research` (investigation, exploration)
- `type:bug` (regression fix)

`lane:*` — routing marker:
- `lane:backlog` (the only label the auto-add workflow will match — feeds items into the project board)
- (Lane A items have no label. Lane C drafts have no label by default but can be tagged `lane:private` if needed for filtering.)

## Milestones (aligned to build-roadmap.md M0–M8)

- `M0-scaffold` through `M8-qa` (mirrors the existing build-roadmap.md)
- `LAUNCH-PREP` (cross-cutting release-prep work not tied to one M)
- `OUT-OF-SCOPE` (v2 / parked work — clear status signal)

## Project board schema (proposed)

- **Project name:** "DeesseJS Roadmap"
- **Owner:** `deessejs` org (NOT martyy-code user)
- **Single-select field:** `Status` with options `Todo / In Progress / In Review / Blocked / Done` (use the **default** field so built-in automations apply for free)
- **Single-select field:** `Priority` with options `P0 / P1 / P2 / P3`
- **Single-select field:** `Effort` with options `XS / S / M / L / XL` (for sizing)
- **Auto-add workflow:** match `label:lane:backlog` (this consumes the **single** auto-add workflow allowed on free plan)

## Open questions (to resolve before activating)

1. ✅ or ❌ for the 3-lane architecture as defined?
2. Org-level (`deessejs`) vs user-level (`martyy-code`) project owner?
3. Add the `lane:backlog` label and configure auto-add, or stay manual?
4. Naming: "DeesseJS Roadmap" vs "DeesseJS v1 Launch" vs "Q3 2026 Launch"?
5. Should Lane C drafts be in the same project as Lane B issues (with view filtering) or in a separate "scratch" project?

## What stays in existing docs (don't reinvent)

This proposal **layers on top of** the existing canonical docs:
- [[project-deessejs-process-docs]] — `role-definitions.md` (founder/PM + tech lead + release manager), `build-roadmap.md` (M0–M8 milestones), `release-process.md` (3 release types + semver gate)
- The lane system does NOT replace milestones — milestones are the M0..M8 mapping; lanes are the agent's routing layer.

Related: [[reference-github-projects-v2-data-model]], [[project-gh-cli-state]], [[project-deessejs-repo-remote]].