---
name: spec
description: Explore a status:ready GitHub issue, write an implementation spec for human review, and push it to the branch. Never writes implementation code.
---

# `spec` Skill

Read a `status:ready` GitHub issue, explore the codebase, write a spec, and ask for human approval before implementation begins.

## When to use

**Trigger phrases:** "spec #N", "/spec #N", "write the spec for #N", "plan #N", "/plan #N".

## Workflow overview

```
0. Reset    — return to staging and pull latest
1. Fetch    — read the issue, check status:ready
2. Branch   — create impl/{n}-{slug} from staging
3. Explore  — read the codebase, related files, learnings
4. Write    — build docs/plans/{n}.md from PLAN_TEMPLATE.md
5. Review   — present to human for approval
6. Push     — push branch so the plan persists on origin
```

## §0 — Reset (always)

```bash
git checkout staging && git pull origin staging
```

## §1 — Fetch

```bash
gh api "https://api.github.com/repos/deessejs/saas-template/issues/{n}"
```

Extract: title, body, labels, comments.

**Gate: refuse if not `status:ready`**:

> "Issue #{n} does not have the `status:ready` label. Run `/triage #{n}` first, or use `--force` to proceed anyway."

Pass `--force` to skip this gate if you want to spec a draft issue.

## §2 — Branch

Generate slug from title (kebab-case, max 50 chars):

```bash
SLUG=$(echo "impl/{n}-$(echo '{issue_title}' | sed 's/[^a-z0-9]+/-/gi' | tr '[:upper:]' '[:lower:]' | sed 's/^-//;s/-$//' | cut -c1-50)")
echo "$SLUG"
```

Delete if exists, then create from staging:

```bash
git branch -D "$SLUG" 2>/dev/null
git push origin --delete "$SLUG" 2>/dev/null
git checkout -b "$SLUG"
```

## §3 — Explore

Read:
- Files mentioned in the issue's acceptance criteria or description
- Relevant config (turbo.json, tsconfig.json, eslint.config.mjs, etc.)
- Existing patterns in the target packages (`apps/`, `packages/`)
- Learning docs in `docs/internal/learnings/` if referenced
- Related issues with `gh search issues`

Keep notes — they feed the spec.

**Do not write any implementation code during exploration.**

## §4 — Write the spec

Create the plan directory and copy the template:

```bash
mkdir -p "docs/plans"
cp .claude/skills/spec/PLAN_TEMPLATE.md "docs/plans/{n}.md"
```

Fill in every section. Key points:

- **Outline**: list every step and sub-step with anchor-friendly slugs
- **TL;DR**: one sentence — the end state after this PR merges
- **Files to touch**: exact paths, not directories
- **Step-by-step**: explain *what* to do and *why* this order
- **Risks**: flag breaking-changes, side-effects, migration needs
- **YAML metadata**: set `status: draft`

If the issue is significantly more complex than described, flag it in TL;DR or Risks — do not surprise the reviewer mid-implementation.

## §5 — Review (blocking)

Present the spec to the user. **Do not proceed without approval.**

Use `AskUserQuestion` with a single approve/reject option. Include:

- TL;DR
- Files count + step count
- Key risk (especially if `breaking-change` label present)
- Branch + docs/plans/{n}.md path

**If approved:**
1. Update YAML: `status: approved`, `reviewer: martyy-code`, `reviewed: {date}`
2. Push branch

**If rejected:**
> "Spec rejected. Branch `{slug}` still exists with the spec at `docs/plans/{n}.md`. Say the word and I'll delete it, or keep it open for later."

## §6 — Push

```bash
git add docs/plans/{n}.md
git commit -m "docs: write spec for issue #{n}

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin "{slug}"
```

## Idempotency

- **Spec already approved** → "A spec already exists and is approved. Run `/implement #{n}` to start."
- **Spec is draft** → "A draft spec exists. Review it at `docs/plans/{n}.md` on `{slug}`, or run `/spec #{n}` again to overwrite it."

## Error handling

| Situation | Action |
|---|---|
| Already on a branch | §0 resets to staging automatically |
| Issue not `status:ready` (no --force) | Refuse — see §1 |
| Branch already exists | Delete and recreate (see §2) |
| No files to explore | Write spec from issue text alone |

## Constraints

- **Always return to `staging` first.**
- **Refuse if not `status:ready` (unless --force).**
- **Exploration only — no implementation code.**
- **Push the branch.** The spec must persist on origin so `/implement` can find it.
- Never write to `main` or merge directly to `main`.
