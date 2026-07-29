---
name: review-pr
description: Review an open PR — check CI, validate against the spec, post a GitHub review (approve / request changes / comment).
---

# `review-pr` Skill

Review an open pull request: check CI status, compare against the spec, and post a GitHub review.

## When to use

**Trigger phrases:** "review #N", "/review #N", "review pr #N", "check pr #N".

Can run at any point:
- Right after `/create-pr` — pre-merge review
- Before merging — final check
- After requested changes — re-review

## Workflow overview

```
0. Reset  — return to staging and pull latest
1. Fetch  — PR details, CI status, diff, spec (if exists)
2. Check  — PR state, CI, blocking comments
3. Review — analyze diff, compare to spec
4. Post   — post GitHub review + optional comment
5. Update — label if approved (status:ready → merged-ready)
```

## §0 — Reset (always)

```bash
git checkout staging && git pull origin staging
```

## §1 — Fetch

Fetch all in parallel:

```bash
# PR details
gh api "https://api.github.com/repos/deessejs/saas-template/pulls/{n}"

# CI / checks status
gh api "https://api.github.com/repos/deessejs/saas-template/commits/{sha}/statuses"
gh api "https://api.github.com/repos/deessejs/saas-template/check-runs?per_page=100"

# Issue linked to this PR (parse from body)
gh api "https://api.github.com/repos/deessejs/saas-template/issues/{n}"

# Spec if it exists (try to extract issue number from PR body)
# e.g. "Closes #2" → fetch .claude/plans/2/plan.md from impl/2-{slug}

# Diff
gh pr view {n} --json diff
```

## §2 — Check

**Gate A — PR must be open**

Refuse if `state != open`:

> "PR #{n} is not open ({state}). Nothing to review."

**Gate B — CI must be green**

Check all check-runs and statuses:
- All must be `success` or `neutral`
- Any `failure` or `action_required` → block with details

Report CI status to the user:

> "CI: {passed}/{total} checks passing. {details}"

**Gate C — no unresolved blocking comments**

```bash
gh api "https://api.github.com/repos/deessejs/saas-template/pulls/{n}/comments?status=open"
```

If unresolved review comments exist → note them, include in review decision.

## §3 — Review

### 3.1 — Read the diff

```bash
gh pr view {n} --json diff
```

Analyze:

- **Does the diff match the spec?** — compare files touched against `Files to touch` table
- **Any unexpected files changed?** — flag them
- **Any file in the spec not touched?** — flag them
- **Breaking changes?** — check `breaking-change` label + Risks in spec

### 3.2 — Read the spec (if exists)

Look for `Closes #{issue}` in the PR body, then try to fetch the spec:

```bash
ISSUE_N=$(echo "$PR_BODY" | grep -oP 'Closes #\K\d+')
if [ -n "$ISSUE_N" ]; then
  # Try to find the branch: list branches matching impl/{ISSUE_N}
  gh api "https://api.github.com/repos/deessejs/saas-template/pulls/{n}" --jq '.head.ref'
  SPEC_BRANCH=$(gh api "..." --jq '.head.ref')
  gh api "https://api.github.com/repos/deessejs/saas-template/contents/.claude/plans/${ISSUE_N}/plan.md?ref=${SPEC_BRANCH}" \
    --jq '.content' 2>/dev/null | base64 -d -
fi
```

Validate:
- [ ] All files in `Files to touch` are in the diff
- [ ] No unexpected files added
- [ ] Risks from spec were addressed
- [ ] Verification checklist items were completed

### 3.3 — Decision

Three outcomes:

| Situation | Decision |
|---|---|
| CI green + diff matches spec + no blocking comments | **Approve** |
| CI green + minor nits (typos, formatting) | **Comment** (with nitpicks) |
| CI red OR spec mismatch OR blocking issues | **Request changes** |

Present the decision to the user before posting:

> **CI:** {passed}/{total} ✅
> **Spec match:** ✅/⚠️/❌
> **Recommendation:** Approve / Request changes / Comment
>
> {details if not approve}

Ask for confirmation before posting (unless the user explicitly said "review and approve").

## §4 — Post the review

### Approve

```bash
gh pr review {n} --approve --body "## Review

**Spec:** `.claude/plans/{issue}/plan.md`
**Files:** {count}
**CI:** {passed}/{total} ✅

Reviewed against the implementation spec. Changes look good.

---
🤖 Reviewed with [Claude Code](https://claude.com/claude-code)"
```

### Request changes

```bash
gh pr review {n} --request-changes --body "## Review

**Spec:** `.claude/plans/{issue}/plan.md`
**Files:** {count}
**CI:** {passed}/{total} {⚠️/❌}

**Blocking issues:**
- {issue 1}
- {issue 2}

---
🤖 Reviewed with [Claude Code](https://claude.com/claude-code)"
```

### Comment (nits only)

```bash
gh pr review {n} --comment --body "## Review

**CI:** {passed}/{total} ✅
**Spec:** match ✅

Minor observations (non-blocking):
- {nit 1}
- {nit 2}

---
🤖 Reviewed with [Claude Code](https://claude.com/claude-code)"
```

## §5 — Update labels (if approved)

If the decision is **Approve**, offer to update the linked issue:

```bash
gh issue edit {issue_n} --remove-label "status:in-progress" --add-label "status:staging-approved"
```

Tell the user:

> "PR approved and reviewed. After CI green, merge `staging → main` manually."

## Output

One-liner: PR number, decision, CI status, next step.

> "PR #{n}: **Approved** ✅ CI green. Merge `staging → main` when ready."

## Error handling

| Situation | Action |
|---|---|
| PR not open | Refuse — Gate A |
| CI failing | Block — include failure details in review body |
| Spec not found | Review diff only, note "no spec found" |
| Review already posted | Tell user, offer to update instead |

## Constraints

- **Always return to `staging` first.**
- **CI must be green before approving.**
- **Never merge** — merge to `staging` is manual, `staging → main` is also manual.
- Do not approve if the diff doesn't match the spec (unless explicitly overridden by the user).
