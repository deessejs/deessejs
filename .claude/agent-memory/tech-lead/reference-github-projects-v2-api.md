---
name: reference-github-projects-v2-api
description: GitHub Projects v2 + gh CLI (v2.85+) capabilities for agent-driven project/issue management. Auth scopes, mutations, auto-add limits, JSON output, built-in automations.
metadata:
  type: reference
---

# GitHub Projects v2 — Agent Reference

## Auth scopes (canonical, verified 2026-06-30)

- `read:project` — read-only (queries)
- `project` — read + write (queries + mutations)
- Default `gh` CLI scopes: `gist, read:org, repo, workflow` — **no `project` by default**
- To upgrade an existing token: `gh auth refresh -s project,read:project` (opens browser, ~5s)

## `gh project` CLI subcommands (v2.85+ covers everything common)

- `gh project create --owner X --title Y`
- `gh project list --owner X`
- `gh project view N --owner X`
- `gh project field-create N --owner X --name "..." --single-select-option "..." --single-select-option "..."`
- `gh project field-list N --owner X`
- `gh project item-add N --owner X --url <issue-url>`
- `gh project item-create N --owner X --title T --body B` — **draft issue** (only in project, not in repo)
- `gh project item-edit N --owner X --id <item-id> --field-id <f> --single-select-option-id <opt>`
- `gh project item-list N --owner X --format=json`
- `gh project link --owner X --repo Y`

All subcommands support `--format=json` for piping (jq, scripts).

## Full GraphQL mutations inventory (25 total)

Used by `gh project`:
- `createProjectV2` — create
- `createProjectV2Field` — create field
- `addProjectV2ItemById` — add issue/PR
- `updateProjectV2ItemFieldValue` — set field (text/number/date/singleSelectOptionId/iterationId)
- `updateProjectV2Field` — edit field options/colors
- `createIssue` / `updateIssue` / `addComment` (from issues API)

Reachable only via `gh api graphql`:
- `addProjectV2DraftIssue` / `updateProjectV2DraftIssue`
- `clearProjectV2ItemFieldValue`
- `archiveProjectV2Item` / `unarchiveProjectV2Item`
- `deleteProjectV2Item`
- `updateProjectV2ItemPosition`
- `linkProjectV2ToRepository` / `linkProjectV2ToTeam`
- `updateProjectV2` — edit title/desc/visibility
- `updateProjectV2Collaborators`
- `copyProjectV2` / `markProjectV2AsTemplate` / `unmarkProjectV2AsTemplate`
- `createProjectV2StatusUpdate` / `updateProjectV2StatusUpdate` / `deleteProjectV2StatusUpdate`
- `deleteProjectV2Field` / `deleteProjectV2` / `deleteProjectV2Workflow`

## Field types

- `ProjectV2FieldCommon` — generic (text/number/date)
- `ProjectV2SingleSelectField` — with options[] each { id, name, color, description }
- `ProjectV2IterationField` — with configuration.iterations[] each { id, startDate, duration }

Default fields on new projects: Title, Assignees, Status, Labels, Repository, Milestone, Linked PRs, Reviewers, Tracks, Tracked by.

## Built-in automations (UI-configured, NOT API)

1. Auto-add items matching filter from linked repos
2. Item closed → Status=Done (default enabled)
3. PR merged → Status=Done (default enabled)
4. Item added → Status=Todo (default)
5. Auto-archive (criterion-based)

**Critical: built-ins target the default Status field**, NOT custom single-select fields.

Auto-add limits:
| Plan | Max auto-add workflows |
|---|---|
| GitHub Free | **1** |
| Pro | 5 |
| Team | 5 |
| Enterprise Cloud / Server | 20 |

Auto-add filters: `is`, `label`, `assignee`, `reason`, `no`. All (except `no`) support negation.

## Important caveats

- **Assignees, Labels, Milestone, Repository** are issue/PR properties, NOT project fields. Use `updateIssue` / `addLabelsToLabelable`, not `updateProjectV2ItemFieldValue`.
- **Cannot add + update item in same mutation** — must `addProjectV2ItemById` then `updateProjectV2ItemFieldValue` separately.
- **Cannot create or update views programmatically** (board/table/roadmap). UI only.
- **Webhook `projects_v2_item`** fires at **org-level**, not project-level. Receiver must filter.
- **Custom-field indexing**: when scripting `item-edit`, you must first `field-list` to get the field ID + option IDs.
- **CLI scope check is gated**: gh project subcommands fail with a scopes error (not a clear "refresh token") if scope missing — confusing for users. Document: run `gh auth refresh -s project` first.

## Verification state

- `gh --version`: 2.85.0 (verified 2026-06-30 on DeesseJS tech-lead env)
- `gh auth status`: scopes `gist, read:org, repo, workflow` — **`project` MISSING** as of 2026-06-30. Refresh required before any `gh project ...` command.
- `gh project --help` lists all subcommands above; minimum required scope annotation present.

## Refs

- [Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [Adding items automatically](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)
- [REST API for projects](https://docs.github.com/en/rest/projects/projects)
- [gh CLI project GA blog](https://github.blog/developer-skills/github/github-cli-project-command-is-now-generally-available/)
- Real-world usage pattern: [ralph-hero MCP server](https://github.com/cdubiel08/ralph-hero) — 24 tools across 6 modules demonstrating agent-friendly abstractions over GH Projects V2.

Related memories: [[project-build-roadmap-status]], [[feedback-build-roadmap-md-stale]]
