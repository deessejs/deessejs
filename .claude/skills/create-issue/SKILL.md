---
name: create-issue
description: Create GitHub issues with labels, priority, and structured fields for the saas-template project. Use when asked to "create an issue", "file an issue", or "open an issue" for the project.
---

# `create-issue` Skill

Create GitHub issues with descriptive labels and structured fields via `gh issue create`. Falls back to plain invocation for simple cases.

## When to use

Use this skill whenever the user asks to create an issue, file an issue, or open an issue.

**Trigger phrases:** "create an issue", "file an issue", "open an issue", "add an issue", "create a ticket".

## How it works

1. **Prompt for fields** — title, body, labels, priority (see below).
2. **Create the issue** — `gh issue create` handles Markdown rendering, @mention parsing, and label validation.
3. **Confirm** — return issue number, title, URL.

## Prompt the user for

Before creating, confirm:

1. **Title** — short, imperative, optionally prefixed with conventional type (`feat:`, `fix:`, `chore:`, `ci:`, `refactor:`, `docs:`).
2. **Body** — structured with at minimum: Description, Why, Acceptance criteria (checkboxes), Risks (if any).
3. **Labels** — from the existing set only (see below). Do NOT create new labels unless asked.
4. **Priority** — `priority:high`, `priority:medium`, or `priority:low`. Defaults to `priority:medium` if unspecified.

If the user only provides a title, use reasonable defaults: no priority label / `priority:medium`.

## Repo context — `deessejs/saas-template`

### Org — `deessejs`

Repo: `github.com/deessejs/saas-template`

### Labels available in this repo

Labels are **repo-level** (set via `--label` in `gh issue create`). Do NOT create new labels unless the user explicitly asks.

**area:\***
- `area:auth` — Authentication, sessions, Better Auth setup
- `area:ui` — UI components, design system (packages/ui)
- `area:web` — Public marketing site (apps/web)
- `area:app` — Authenticated app (apps/app)
- `area:docs` — Documentation site (apps/docs)
- `area:database` — Database schema, Drizzle ORM
- `area:email` — Email handling, Resend, react-email
- `area:ci` — GitHub Actions, CI/CD workflows
- `area:build` — Monorepo setup, pnpm, turbo, packages
- `area:deploy` — Vercel deployment, environment config

**status:\***
- `status:needs-triage` — Not yet triaged by a maintainer
- `status:ready` — Triaged and accepted — ready to be picked up
- `status:in-progress` — Someone is actively working on this
- `status:blocked` — Blocked by an external dependency

**priority:\***
- `priority:high` — High priority — should be addressed soon
- `priority:medium` — Medium priority
- `priority:low` — Low priority — nice to have

**Cross-cutting**
- `breaking-change` — Changes the public API surface
- `dependencies` — Dependency updates (used by Dependabot)
- `github_actions` — Related to GitHub Actions

**GitHub defaults (keep)**
`bug`, `enhancement`, `documentation`, `duplicate`, `invalid`, `question`, `wontfix`, `good first issue`, `help wanted`

### Issue templates

Issue templates live in `.github/ISSUE_TEMPLATE/`:

- `bug_report.yml` — preflight checklist, area dropdown, labels: `bug`
- `feature_request.yml` — problem/solution/alternatives, labels: `enhancement`
- `security.yml` — Security vulnerabilities (private, not a public issue)
- `blank.yml` — Blank issue (disabled via config.yml, redirects to Discussions)

### Templates preferred for this repo

When a user asks to create an issue, use this **structured format** (not a blank issue):

- **Bug** → `bug_report.yml` (add `bug` + area label)
- **Feature request** → `feature_request.yml` (add `enhancement` + area label)
- **Anything else** → `gh issue create` with appropriate labels

### Security / contact

Security vulnerabilities → `security.yml` (private advisory, not a public issue).
Questions → GitHub Discussions.

## Output

After creation, confirm with a one-liner: issue number, title, labels, priority, and the URL.

## Constraints

- Do NOT use label names that don't exist — use only the labels listed above.
- Do NOT open blank issues — always use the template picker or `gh issue create`.
- Security vulnerabilities must use the security template, not a public issue.
