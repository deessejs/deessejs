---
name: triage
description: Triage a GitHub issue — apply labels, post a structured review comment. Use when asked to triage, review, or label an issue.
---

# `triage` Skill

Triage a GitHub issue: analyze content, apply missing labels, post a structured review comment.

## When to use

Use this skill when the user asks to triage, review, or label an issue. Usually runs on newly opened issues.

**Trigger phrases:** "triage #N", "review this issue", "label this", "triager".

## Prerequisites

The `gh` CLI must be authenticated and the repo must be set correctly:
```bash
gh auth status
gh repo view --json name
```

## Step-by-step workflow

### Step 1 — Fetch issue details

```bash
gh issue view <issueNumber> --json title,body,labels,state,author
```

Read: `title`, `body`, `labels[]`, `state`, `author.login`.

### Step 2 — Identify what's already present

From the `labels` array, note:
- Does it have an `area:*` label? → required
- Does it have a `status:*` label? (template already sets `status:needs-triage`)
- Does it have a `priority:*` label?
- What type label does it have? (`bug`, `enhancement`, `documentation`, …)

### Step 3 — Assess completeness

Based on the template type, check for required fields:

**Bug report** (`bug` label present):
- ✅ **Required:** `📝 Bug Description` filled?
- ✅ **Required:** `📋 Steps to Reproduce` filled?
- ✅ **Required:** `🎯 Area` selected?
- ℹ️ `❌ Actual Behavior` and `✅ Expected Behavior` — strongly recommended but not hard-required

**Feature request** (`enhancement` label present):
- ✅ **Required:** `📝 Feature Summary` filled?
- ✅ **Required:** `📖 Detailed Description` filled?
- ✅ **Required:** `🎯 Area` selected?

**Any other issue** (no template used):
- ✅ Is the body substantive (not just a title)?
- ✅ Is the intent clear enough to act on?

### Step 4 — Triage decision

Apply the decision tree:

```
1. Is it complete?
   NO  → label: needs-info
   YES → continue

2. Is it a valid task? (not dup/question/invalid/wontfix)
   duplicate  → label: duplicate
   wontfix    → label: wontfix
   question   → label: question
   invalid    → label: invalid
   YES        → continue

3. Is it blocked by another issue? (mentioned in body or comments)
   YES → label: status:blocked + link blocking issue

4. Otherwise → label: status:ready
```

### Step 5 — Add missing labels

```bash
gh issue edit <issueNumber> --add-label "label1,label2"
```

Labels to add if missing (do NOT remove existing labels):

**area:** (required — always add if absent)
- `area:auth`, `area:ui`, `area:web`, `area:app`, `area:docs`, `area:database`, `area:email`, `area:ci`, `area:build`, `area:deploy`
- Infer from body content if the dropdown was not used

**status:** (override template default only when justified)
- `status:ready` — complete + valid + unblocked
- `status:needs-triage` — keep as-is, already set by template
- `needs-info` — incomplete, ask for more
- `status:in-progress` — someone is already working it
- `status:blocked` — depends on another issue

**priority:** (optional — infer from severity if not stated)
- `priority:high` — security, data loss, blocks core flows
- `priority:medium` — default for most issues
- `priority:low` — nice-to-have, deferred

**Cross-cutting** (add when applicable)
- `breaking-change` — affects public API surface
- `github_actions` — related to CI/CD
- `dependencies` — dependency update request

### Step 6 — Post triage comment

```bash
gh issue comment create <issueNumber> --body "..."
```

Use the template below that matches your decision.

---

## Comment Templates

### `status: ready`

```
## Triage Review

**Type:** `bug` / `enhancement` / `documentation` / …
**Status:** `status:ready`
**Area:** `area:<auth | ui | web | app | docs | database | email | ci | build | deploy>`
**Priority:** `priority:<high | medium | low>` (if determinable)

**Decision:** All required information provided. This issue is ready to be picked up.

---
*Triage by Tech Lead Agent*
```

### `needs-info`

```
## Triage Review

**Status:** `needs-info` — Additional information required

**Decision:** This issue is missing required information and cannot be triaged yet.

**Missing fields:**
- <list each missing required field>

Please update the issue with the missing information so it can be properly triaged.

---
*Triage by Tech Lead Agent*
```

### `status: blocked`

```
## Triage Review

**Type:** `bug` / `enhancement` / …
**Status:** `status:blocked`

**Decision:** This issue cannot be acted on until the blocking issue is resolved.

**Blocking:** #<issue number> — <brief description>

Once the blocking issue is resolved, this can be moved to `status:ready`.

---
*Triage by Tech Lead Agent*
```

### Closure labels (`duplicate`, `wontfix`, `question`, `invalid`)

```
## Triage Review

**Status:** `<duplicate | wontfix | question | invalid>`

**Decision:** <Brief explanation>

<If a related issue exists, link it here.>

For questions, consider using GitHub Discussions instead of issues.

---
*Triage by Tech Lead Agent*
```

## Label Handling Rules

- **Always check existing labels** before adding — don't double-apply
- **Add missing labels only** — never remove user-added labels
- **Preserve user intent** — keep labels even if they seem slightly off
- **Keep `status:needs-triage`** — it's the template default; only change if justified
- **Infer `area:*` from body** when the template dropdown wasn't used
- **When in doubt, ask for more info** (`needs-info`) rather than guessing
- **Consistent naming:** use `needs-info` (no prefix), `status:ready`, `status:blocked`, `status:in-progress`

## Project Label Taxonomy (saas-template)

### area:* (required — infer from content)
`area:auth` · `area:ui` · `area:web` · `area:app` · `area:docs` · `area:database` · `area:email` · `area:ci` · `area:build` · `area:deploy`

### status:*
`status:needs-triage` · `status:ready` · `status:in-progress` · `status:blocked` · `needs-info`

### priority:* (optional)
`priority:high` · `priority:medium` · `priority:low`

### Cross-cutting
`breaking-change` · `github_actions` · `dependencies`

### Standard GitHub (closure)
`bug` · `enhancement` · `documentation` · `duplicate` · `invalid` · `question` · `wontfix`
