---
name: project-12-apps-cli-section
description: New docs section at documents/internal/architecture/12-apps/cli/ for the proposed deesse init external scaffolder; agent-first; 4 topic docs + 3 local ADRs; 7 founder questions pending
metadata:
  type: project
---

Created 2026-07-02 in response to founder's request: "On doit avoir un système où les templates sont sur des repos. On aurait `deesse init --template https://github.com/...`".

**2026-07-02 update**: founder confirmed the CLI's primary audience is **AI coding agents** (Claude Code, Cursor, Codex). This is an agent-first design — see [[reference-agent-first-cli-principles]] for the 8 principles. Q2 (MVP scope: picker vs no picker) is RESOLVED: no interactive picker at MVP, ever. A new Q7 was added about the agent-detection contract.

## Folder contents

`documents/internal/architecture/12-apps/cli/` (5 topic docs + 3 local ADRs):

- `README.md` — index, agent-first TL;DR, audience, surface, 7 open questions
- `research.md` — synthesis of 6 senior CLI patterns (create-next-app, create-vite, create-t3-app, shadcn, nuxi, create-astro) + giget internals
- `architecture.md` — concrete spec: file layout, command flow, 8 runtime deps, error table, **agent-first contract section** (8 principles), testing strategy
- `template-conventions.md` — `manifest.json` schema (name/deesse/version/requires/tokens/remove), token replacement bounds, file removal, AGENTS.md generation
- `roadmap.md` — M0→M10 build sequence (~23 days), restructured around agent-first (M0 = skeleton + agent detection, M6 = agent-first contract, M7 = agent E2E + v0.1 release)
- `decisions/0001-giget-as-fetch-primitive.md` — Proposed: giget
- `decisions/0002-cli-as-external-published-package.md` — Proposed: standalone repo `deessejs/deesse`
- `decisions/0003-cli-stack.md` — Proposed: mri + clack + giget + nypm + cross-spawn + picocolors + **detect-agent (CORE, not nice-to-have)** + validate-npm-package-name

## Critical context

**Two different CLIs** — the founder's request creates a NEW one, not a change to the existing buyer-facing CLI in `apps/template/apps/cli/` (system ADR 0002, Bun single-binary). See [[project-12-apps-cli-vs-buyer-cli]] for the distinction. Easy confusion point.

**Stack differs from the buyer CLI on purpose**: init CLI is npm-published for **agents and developers** (`npx`); buyer CLI is Bun-compiled single-binary for the buyer's non-developer end users.

**Templates = external repos** is the load-bearing decision. The CLI never contains the templates — it fetches them via `giget` (Nuxt/Astro pattern). Templates are versioned semver, declared via `manifest.json` at the repo root.

**Agent-first thesis** (per [[reference-agent-first-cli-principles]]): every option is a flag, no interactive prompts, `--json` output, semantic exit codes, stdout/stderr discipline, env-based defaults, Claude Code E2E in CI.

## Conventions followed

- English only (per `documents/internal/architecture/README.md` convention #1)
- Local ADRs restart at 0001 (per `11-packages/auth/decisions/0001-*` precedent, NOT system ADR numbering)
- Cross-refs to system ADRs use `../../10-decisions/NNNN-name.md`
- Each doc has the 5-section `12-apps/<app>/` shape (Purpose / Audience / Surface / Deploy / Cross-refs)
