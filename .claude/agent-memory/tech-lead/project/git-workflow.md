---
name: git-workflow-staging
description: Repo uses staging-first Git flow (setup 2026-07-16) — PRs always target staging, main is human-promoted only
metadata:
  type: project
---

# Git workflow — staging-first

Set up 2026-07-16. Replaces the prior implicit "feature branch → PR to main" pattern.

## The flow

```
feature/fix branch  ─PR─▶  staging  ─merge (human, manual)─▶  main  ─▶  release
```

## Rules (load-bearing)

- **Base new work on `staging`**: `git checkout staging && git pull && git checkout -b {slug}`
- **PRs always target `staging`**: `gh pr create --base staging`
- **`staging → main` is the release path** — done manually by a human after CI green + review approval
- **Never push directly to `main`** — even hotfixes branch from `staging` first
- **Never merge a PR into `main` from the agent** — `main` is owned by the human release process

## Why

- `staging` is the integration branch — multiple PRs land there, get tested together, surface interaction bugs
- `main` reflects release-ready state — only updated via deliberate human promotion
- The release workflow (changesets → version bump → publish) triggers on push to `main`
- Decoupling "incoming work" from "release surface" prevents a broken `main` blocking all deploys

## How to apply

- `/spec`, `/implement`, `/create-pr`, `/review-pr` all reset to `staging` and open PRs against `staging` — these skills are the source of truth
- `AGENTS.md` has a "Git workflow — staging-first" section that summarises this
- If a PR was opened against `main` by mistake → close it, recreate targeting `staging`
- If you find a skill referencing `main` as base or target → that's a bug, fix it

## Branch naming

- `impl/{n}-{slug}` for issue-driven work (`/spec`, `/implement`)
- `chore/{slug}` for chores, refactors, infra
- `fix/{slug}` for unsolicited bug fixes

## Related

- [[agents-conventions]] — commit conventions, CODEOWNERS (also lives in `AGENTS.md` markers)
- AGENTS.md "Git workflow — staging-first" section