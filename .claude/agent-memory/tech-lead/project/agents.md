---
name: agents-conventions
description: AGENTS.md markers + commit conventions (conventional commits) + CODEOWNERS model for this repo
metadata:
  type: project
---

# AGENTS.md + Commit + Ownership conventions

## AGENTS.md markers

`AGENTS.md` files (root, `apps/app/AGENTS.md`) contain a marker-wrapped block at the top:

```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

This block appears to be auto-injected by some tooling — DO NOT edit it manually. The body outside the markers is hand-maintained (e.g. the Fresh CLI section in root `AGENTS.md`).

## Commit conventions — Conventional Commits (informal)

**Format**: `type(scope): subject`

**Types observed**: `feat`, `fix`, `chore`, `refactor`, `docs`. Use these five. No `BREAKING CHANGE` markers seen in recent history but the footer convention (`<token>: <description>`) is supported.

**Scopes observed**: `agent`, `agent/web`, `web`, `vercel`, `agents`, `tech-lead`. Use the most specific scope that matches the directory affected (e.g. `apps/web/components/...` → `web`, `agent/web/` → `agent/web`, `packages/auth/...` → would be `auth`).

**Subject style**:
- Imperative present ("add", "fix", "remove", "chain", "point"), not past tense
- Lowercase
- No period at end
- Max ~70 chars

**Examples** (from `git log`):
- `fix(vercel): create .vercel/output dir before copying Next.js build`
- `feat(web): add blog, changelog, cookie consent, and shared components to apps/web`
- `docs(tech-lead): add Vercel deployment pattern memory`
- `refactor(agents): flatten agent directory to fix Vercel deployment`

**NOT enforced by tooling** — no `commitlint.config.*`, no husky/lint-staged found. Convention is informal; reviewers enforce.

## Co-authored-by footer (Claude Code convention)

When Claude Code commits, append:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

PR bodies end with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

These are project defaults set by Claude Code itself, not local customization.

## CODEOWNERS

`.github/CODEOWNERS` — default owner `@codewizdave`, with explicit per-directory entries. All current entries point to the same owner; the per-directory structure is a scaffold for future multi-owner expansion.

```
/apps/web/           @codewizdave
/apps/app/           @codewizdave
/packages/auth/      @codewizdave
/packages/database/  @codewizdave
...
```

## Branch + PR workflow (observed)

- Default branch: `main` — promoted to via merge from `staging` (human-only, never direct)
- Integration branch: `staging` — set up 2026-07-16, all PRs land here first
- Feature work happens on topic branches (e.g. `agent/web`, `vercel-fix`, `impl/18-fix-ready-endpoint-db-ping`, `chore/setup-staging-workflow`), PR target is `staging`, then `staging → main` is the release path
- PR title typically follows the same conventional-commits format as the squash commit
- See [[git-workflow-staging]] for the full staging-first rules

## What is NOT in the repo (worth checking before claiming it exists)

- ❌ No `commitlint.config.*` or equivalent
- ❌ No `.husky/` directory, no `lefthook.yml`, no `.lintstagedrc*`
- ❌ No `CONTRIBUTING.md`
- ❌ No `.gitattributes` beyond defaults
- ❌ No branch protection rules visible from disk (dashboard-controlled)

If you need any of these, the user would need to set them up — convention enforcement is currently reviewer-driven.

Related: [[stack]] (CI GitHub Actions structure).