---
title: Process documentation
last_updated: 2026-06-17
---

# `internal/process/` — How we work

## Purpose

The cross-cutting documentation of **how we work** — release process, role definitions, code review, conventions — separate from **what we build** (which lives in `architecture/`, `product/`, `marketing/`).

ADRs lock **decisions**. Process docs describe **workflows**. They are different artifacts and live in different folders.

## What's in here

- `README.md` (this file) — the convention for process docs.
- `release-process.md` — what a release looks like, from tech-lead-declares-done to tag published.
- `role-definitions.md` — who does what (founder/PM, tech lead, release manager).
- More to come as the team grows: `code-review.md`, `branching-and-commits.md`, `onboarding.md`, etc.

## Conventions

Process docs are **living documents**, not historical records.

- **Dated.** Every file has a `last_updated` frontmatter field. Update it on every change.
- **Versioned in-place.** No ADR-style status, no supersession. If a process changes, edit the doc and add a changelog entry at the bottom.
- **No strict template.** Each doc has the structure that fits its topic. Don't force a uniform shape.
- **Cross-referenced.** When a process decision is locked elsewhere (e.g. in an ADR), link to it. When a process needs an architectural commitment, link to the arch doc.
- **English.** Same as the rest of `internal/`.

## Frontmatter

Every process doc starts with:

```yaml
---
title: <short title>
last_updated: YYYY-MM-DD
owner: <role or name>
status: active | draft | deprecated
---
```

`status: deprecated` is the only state change. It means "we don't follow this anymore, but we're keeping it for history."

## When to add a process doc

- A workflow is repeated 3+ times and people start doing it differently.
- A new role joins (release manager is the first example) and needs to know what they own.
- A decision keeps getting re-debated because it's not written down.
- An incident happens and the postmortem says "we should have had a process for X".

## When NOT to add a process doc

- The topic is a one-off (a launch plan, a specific marketing campaign) — use a different artifact.
- The topic is technical and lockable — write an ADR instead.
- The topic is product/strategy — write a product doc instead.
- The topic is operational (what to do when X breaks) — write a runbook in `architecture/09-operations/runbooks/`.

## Relationship to other folders

- **`architecture/`** — what the system is, how it's built. Process docs reference these but don't duplicate them.
- **`product/`** — what we ship, what we don't. Process docs may describe how product decisions flow into architecture (the product → arch handoff).
- **`marketing/`** — how we sell. Process docs may include marketing workflows (release notes, launch comms).
- **`architecture/10-decisions/`** — the historical record of locked decisions. Process docs reference ADRs but don't compete with them.

## Changelog

- 2026-06-17: Initial version (README + release-process + role-definitions; v0.0.1 ADR added in `architecture/10-decisions/0010`).
