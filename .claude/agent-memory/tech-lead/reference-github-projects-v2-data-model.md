---
name: reference-github-projects-v2-data-model
description: GitHub Projects v2 conceptual data model — items (not issues) are the primitive; field storage asymmetry between project fields vs issue properties; multi-project items; what is and isn't programmable.
metadata:
  type: reference
---

# GitHub Projects v2 — Data model

Companion to [[reference-github-projects-v2-api]]. That file covers **how to call the API**. This one covers **what the model actually is**.

## Hierarchy

```
Project
├── Fields (status, priority, custom single-select/text/number/date/iteration)
└── Items (= union of:)
    ├── Issue          — lives in a repo; has URL, comments, labels, milestone, assignees
    ├── Pull Request   — lives in a repo; same as issue + commits + review
    └── Draft issue    — lives ONLY in the project; no repo URL, no comments, not findable in GH search
```

**Items, not issues, are the primitive.** This is the single most important architectural point. A project item that is an issue has its repo URL + comments + repo-level metadata. A draft item is project-local only.

## Multi-project rule

- An **issue** or **PR** can be in **N projects simultaneously** (the same issue, same number, different boards).
- A **draft** is bound to **one project** (created via `addProjectV2DraftIssue`, lives only there).

→ Useful pattern: an org-level "Roadmap" project + a user-level "Personal scratchpad" project can share the same issue items if both projects include them, but drafts stay isolated.

## Field storage asymmetry

| Where the data lives | Fields | How to set |
|---|---|---|
| **Project item** (lives in project) | Status, Priority, Effort, custom text/number/date/single-select/iteration fields | `updateProjectV2ItemFieldValue` (GraphQL) |
| **Issue / PR** (lives in repo) | Assignees, Labels, Milestone, Repository, Title, Body, State | `updateIssue` / `addLabelsToLabelable` / `addAssigneesToAssignable` (REST/GraphQL on the issue API) |

**Consequence:** if you move an issue from one project to another, the project-field values (Status, Priority) travel **with** the item. Issue properties (labels, milestone, assignees) stay on the issue regardless of which project(s) it's in.

**Gotcha:** many newcomers try to set Status via `updateIssue` — it doesn't work because Status is a project field, not an issue property. Use `updateProjectV2ItemFieldValue`.

## Write path taxonomy

| Want | Command | Result |
|---|---|---|
| Create public task in repo | `gh issue create --repo X --title T --body B --label L --milestone M` | Issue N in `X`, addable to project |
| Add existing issue/PR to project | `gh project item-add <N> --owner O --url https://github.com/X/issues/I` | Issue appears in project, no project-field values yet |
| Create project-only scratch item | `gh project item-create <N> --owner O --title T --body B` | Draft item, project-only, no repo URL |
| Set project field on item | `gh project item-edit <N> --owner O --id <item-id> --field-id <F> --single-select-option-id <O>` | Field value applied |
| Promote draft → issue | (No native mutation. Workaround: create new issue with same title/body, add to project, archive the draft.) | Manual process |

## The asymmetry that bites first

**Built-in automations (auto-add, closed→Done, PR merged→Done, item added→Todo, auto-archive) target the *default* Status field** — not custom single-select fields. If you create a custom "Workflow State" field with values like Backlog/Discovery/Build/Review/Done, the built-ins WON'T touch it.

Either:
- Use the default Status field with the default Todo/In Progress/Done options → automations work for free.
- Use a custom Workflow State field and accept that you'll script status transitions yourself.

→ Recommendation: **use the default Status field, extend it with custom options if needed.** Get the free automations.

## What's programmable vs what's UI-only

Programmable via GraphQL/CLI:
- Projects (create/edit/list/view)
- Fields (create/edit/delete, options + colors + descriptions)
- Items (add draft, add issue/PR, set field values, archive/unarchive, delete, reorder)
- Project settings (title, README, description, visibility)
- Project → repo linking

UI-only:
- **Views** (board, table, timeline, roadmap layout) — must be configured via the UI
- **Built-in workflows** (auto-add filters, default Status transitions)
- **Insights** (charts, burndown)

→ Views are the gap. If the agent wants to create a polished multi-view board, the views still need a human click in the web UI. Agent can do everything else.

## Decision framework for the agent (when to use which item type)

For Diego's 2-lane system, the agent applies this rule when receiving a context-drop:

> **"Does this task warrant the repo knowing it exists?"**
> - Yes → **Issue** in repo (public, milestone, labels)
> - No / not yet / internal thought → **Draft** in project (private scratchpad)
> - Trivial fix I should do now → no item at all (Lane A)

This rule was proposed 2026-06-30 and **awaits Diego's explicit confirmation** before becoming the canonical decision tree. See [[project-deessejs-lane-system-proposal]].

Related: [[reference-github-projects-v2-api]], [[project-gh-cli-state]], [[project-deessejs-lane-system-proposal]].