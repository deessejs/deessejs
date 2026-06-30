---
name: project-deessejs-repo-remote
description: DeesseJS repo's actual GH location, redirect chain, and ownership. Verified 2026-06-30 — local git remote URL is a legacy redirect.
metadata:
  type: project
---

# DeesseJS repo — remote & ownership

**Verified 2026-06-30.**

## Canonical GH location
- **Repo:** `deessejs/deessejs`
- **URL:** `https://github.com/deessejs/deessejs`
- **Owner:** `deessejs` (org, id `O_kgDOEcX79w`)
- **Visibility:** public
- **Default branch:** `main`
- **Last push:** `2026-06-29T15:54:07Z`
- **Has issues:** true / **Has projects:** true
- **Repo ID (numeric):** `1273180042`

## Redirect chain
Both of these URLs **301 → `https://api.github.com/repositories/1273180042`** (i.e. the canonical `deessejs/deessejs`):

| URL | Status |
|---|---|
| `https://github.com/deessejs/complete-template` | 301 → ID 1273180042 |
| `https://github.com/nesalia-labs/complete-template` | 301 → ID 1273180042 |

The repo was renamed at some point (or owned under different namespace first). All operations (clone/push/pull/fetch/API) resolve to the same target. The local directory is still named `complete-template/` and the git remote still references the legacy `nesalia-labs/complete-template.git` URL — both work via redirect but should be cleaned up.

## Local git state
- `git remote -v` shows: `https://github.com/nesalia-labs/complete-template.git`
- Active branch: `main` (default)
- Working tree: clean (only M and ?? files in the snapshot, no uncommitted changes tracked at this level)

## Implication for GH Projects setup
- **Project owner MUST be `deessejs` (org)**, NOT `martyy-code` (personal account). User-level projects are owned by martyy-code, but DeesseJS work should live on the org's board.
- `martyy-code` token still needs `project` scope AND project-write access on the `deessejs` org (verify after `gh auth refresh -s project`).
- Suggested commands (after scope refresh):
  ```bash
  gh project create --owner deessejs --title "DeesseJS Roadmap"
  gh project link <N> --owner deessejs --repo deessejs/deessejs
  ```
- For labels/milestones on the repo itself:
  ```bash
  gh label create area:web --repo deessejs/deessejs --color ...
  gh api -X POST repos/deessejs/deessejs/milestones -f title=M0 -f description=...
  ```
  Note: `gh api` automatically uses the active auth (`martyy-code`); org-level operations on `deessejs` org require write access there.

## What to confirm with Diego before proceeding
1. Is `deessejs` the correct owner org for project boards? Or should it be user-level under `martyy-code`?
2. Should the local git remote URL be updated from `nesalia-labs/complete-template` to `deessejs/deessejs`? (cosmetic but avoids future confusion)

Related: [[project-gh-cli-state]] — current gh CLI state + missing scopes.