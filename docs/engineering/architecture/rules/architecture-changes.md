# Architecture changes policy

## Question this doc answers

*When I introduce a new abstraction or change where code lives, what
documentation do I need to produce?*

## Policy

**Every PR that introduces a new abstraction (a module, a pattern, a
file in a new location) must update or create an ADR. Every PR that
touches an invariant documented in `architecture/` must reference the
doc it touches.**

## What counts as a "new abstraction"

- A new module under `packages/`.
- A new pattern of import (e.g. `apps/<x>/src/lib/orpc.ts` is a
  pattern; copying it to a new file is following a pattern, not
  introducing one).
- A new directory in `apps/`, `packages/`, or `src/lib/`.
- A new shared utility function exported from a package.
- A new wire format, error code, or response shape.

What does NOT count:

- Adding a new page under `apps/web/src/app/`.
- Adding a new CLI command under `apps/cli/src/commands/`.
- Adding a new test file.
- Adding a new fixture or mock.

For these, a regular PR description is sufficient.

## What the PR description must contain

```md
## What
[What does this PR change?]

## Why
[Why is this implementation necessary?]

## Architecture
[Which existing boundaries does this touch? Cite ADR/RFC numbers.]

## Decisions
[Did you introduce a new abstraction? If yes, why?]

## External documentation
[Were external libraries/frameworks involved? Which official docs
did you consult? Cite URLs.]

## Testing
[What behavior is actually tested? What pattern (Server-Side Client,
http.createServer, MSW)?]
```

The PR template lives at `docs/engineering/architecture/rules/pr-template.md`.

## When you introduce a new abstraction

1. Create an ADR in `docs/engineering/architecture/decisions/`. Use the next
   available number (e.g. `ADR-002-...`). Reference the previous
   decision that this builds on or supersedes.
2. Update the relevant `architecture/` doc. If no `architecture/` doc
   covers the abstraction, add one.
3. Add an entry to the ADR's "Consequences" section listing what
   future PRs must respect.

When you remove an abstraction:

1. Mark the ADR as **Superseded by ADR-NNN** (do not delete; the
   history is informative).
2. If the abstraction was load-bearing for an `architecture/` doc,
   update the doc.
3. If a `rule/` doc referenced it, update the rule.

## When you change an invariant

If you change how the RPC wire format works, or how errors propagate,
or where the typed client lives — you are touching an invariant.

1. Find the doc in `../decisions/` that documents the
   current behavior.
2. Update the doc in the same commit as the code change. Reviewers
   will check both.
3. If the change is breaking (e.g. a new mandatory field on the
   contract), update the version path (`packages/contracts/src/v2/`)
   and keep `v1/` for back-compat.

## Anti-patterns

- Drive-by refactor that moves code without updating the doc.
- PR that says "I followed the existing pattern" when the existing
  pattern is the bug being fixed.
- Updating the code without updating the doc. The doc becomes wrong;
  the next agent trusts the wrong doc.
- Adding a new abstraction "because it's cleaner" without explaining
  the problem the abstraction solves.

## What the AI reviewer checks

When the AI reviewer runs on a PR (see
`docs/engineering/architecture/decisions/` and the future
reviewer spec), it should:

- Detect new files in `packages/` or `apps/<x>/src/lib/` and require an
  ADR reference.
- Detect changes to files documented in `architecture/` and require
  a doc update in the same PR.
- Detect `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`,
  `types.ts` at any package root. Reject the PR. See
  [ADR-002](./decisions/ADR-002-file-organization.md).
- Detect files >200 lines without a single responsibility. Flag for
  split.
- Detect import patterns that bypass documented boundaries (e.g.
  `import { fetch } from "..."` in a server procedure).
- Flag missing "External documentation" section when an external lib
  was touched.
