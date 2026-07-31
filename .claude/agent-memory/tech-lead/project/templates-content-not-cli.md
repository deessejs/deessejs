---
name: templates-content-not-cli
description: Templates are content served by an API, not features of @deessejs/cli. Adding a template never triggers a CLI version bump. Only schema-level template changes can.
metadata:
  type: project
---

`@deessejs/cli` is a client of the templates endpoint at `https://deessejs.com/api/templates` (served by `packages/api/src/index.ts:73`, data from `packages/api/src/templates.ts`). The CLI's contract is: list templates, show one template, clone it. **What the templates ARE is not the CLI's concern.**

**Therefore: adding/updating/removing a template entry is NEVER a CLI change and NEVER requires a changeset or CLI version bump.** This holds whether templates are hand-curated (today), database-backed (planned per inline comment in `packages/api/src/templates.ts`), or externally submitted (planned).

**Why:** The user's architectural decision (logged 2026-07-31 during the versioning audit). If template additions ever triggered CLI versions, three things break: (1) external submissions become impossible (third party can't trigger a release), (2) operational overhead explodes (every addition = release PR + tag + npm publish), (3) SemVer loses meaning (CLI version tracks registry size, not CLI behavior). Full rationale: `docs/engineering/reports/versioning/11-templates-not-cli.md`.

**How to apply:** Whenever anyone proposes adding a changeset for a template addition, push back. The rule of thumb: "the registry now has one more template" = content change (no CLI version). "the CLI now does X" = CLI change (version bump).

**Edge cases that DO require a CLI changeset:**

- New required field added to `Template` type → CLI validator changes (`minor` or `major`).
- New optional field that the CLI renders → `minor`.
- New optional field the CLI ignores (forward-compatible parser) → no changeset.
- Templates endpoint URL change → `major`.

**Today:** `packages/api/src/templates.ts` exports a `TEMPLATES: Template[]` array with 3 hand-curated entries (`saas-starter`, `ai-chatbot`, `landing-page`). Inline comment explicitly says "V1 is hand-curated. V1.1+ could swap this for a DB-backed source." When that migration happens, schema migrations live in `packages/database/` — the CLI stays decoupled.

**Related docs that encode this rule:**

- `.changeset/README.md` — "Skip the changeset when your PR: Adds, updates, or removes a template entry..."
- `CONTRIBUTING.md` — same note in the changeset section.
- `docs/engineering/processes/versioning.md` — same note in the maintainer playbook.

See also [[release-pipeline]] (the dual flow that makes this decoupling possible).