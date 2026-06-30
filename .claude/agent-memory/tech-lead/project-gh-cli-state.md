---
name: project-gh-cli-state
description: Current state of GitHub CLI on tech-lead agent env (auth account + token scopes + blocking gaps), refreshed 2026-06-30.
metadata:
  type: project
---

# GH CLI state on tech-lead env

**Verified 2026-06-30.**

## Binary
- `gh` v2.85.0 (released 2026-01-14) — installed under `C:/Users/dpereira/tools/gh/bin/gh`
- On Windows Git Bash env

## Auth
- Active account: `martyy-code` (personal GH account)
- Inactive account also stored: `AliiiBenn`
- Protocol: HTTPS
- Token: `gho_...` (stored in keyring)

## Token scopes (CURRENT, before refresh)
- `gist`
- `read:org`
- `repo`
- `workflow`

## ⚠️ MISSING scopes that matter for agent work
- **`project`** — required for any `gh project ...` command (creating/listing/editing GH Projects)
- **`read:project`** — read-only project query

Without these, GH Projects v2 (the new board-style) cannot be touched from agent context.

## Command to upgrade (run by Diego himself — needs browser)
```bash
gh auth refresh -h github.com -s project,read:project
```
Interactive OAuth flow in browser, ~5 seconds. Token scopes preserved + new ones added.

## Implication for the 2-lane system
- Lane A (quick fix direct) — works today, no scope required
- Lane B (backlog → GH Issue + Project board) — works today for `gh issue create`, but **cannot** add the resulting issue to a Project board or set Status fields until Diego refreshes scopes
- Workaround during gap: create issues with labels only (auto-add is impossible without `project` scope). Set Status manually in web UI or via `gh project` after scope refresh.

Related: [[reference-github-projects-v2-api]] — full commands + caveats.
