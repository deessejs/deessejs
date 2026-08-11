# Architecture Rules

This folder collects the standing **architecture rules** for the
DeesseJS Errors repository. Unlike ADRs (which capture one decision at
a time), rules are durable, always-on constraints that every PR must
respect.

## Format

Each rule is stored as a Markdown file with the naming convention
`NNNN-short-slug.md`, where `NNNN` is a monotonically increasing
4-digit sequence. For example:

- `0001-project-mindset.md`
- `0002-file-separation.md`

The sequence numbers are **never reused**. When a rule is rescinded,
the file is moved to `_superseded/` with a `Superseded by NNNN`
header at the top.

## Status lifecycle

Rules carry one of the following states:

- **Active** — currently enforced by CI or code review.
- **Enforced via CI** — the rule is checked automatically on every PR.
- **Superseded** — replaced by a later rule (cross-link required).
- **Deprecated** — kept on disk for context but no longer required.

## When to add a rule

Add a rule when:

- A constraint has come up three or more times in PR review.
- A constraint cannot be expressed in the type system alone.
- A constraint is not obvious from reading the code (e.g. it spans
  multiple files or workflows).

Do **not** add a rule for things that TypeScript or ESLint already
enforce — point to those tools instead.

## Authoring

Each rule should have:

1. **Rule** — one sentence that says what is required.
2. **Why** — the architectural reason, in 2-3 sentences.
3. **Enforcement** — CI check, lint rule, or review-only.
4. **Exceptions** — if any, with the rationale for each.

Rules are focused, but their length follows the doctrine they
encode, not the other way around. A rule that names a heuristic,
cites its sources, and walks through the violation it catches may
be long; the length is the cost of being unambiguous. A rule that
has grown past what the doctrine needs is a refactor candidate.
Process documents (release runbook, PR authoring guide) live under
`docs/internal/engineering/process/`; the boundary is the **purpose**
of the document, not its length.

## Active rules

- See the files in this directory for the current rule set.

## See also

- [`../decisions/`](./decisions/) — Architecture Decision Records.
- [`../../internal/engineering/process/`](../../internal/engineering/process/) — process documents
  (release runbook, PR authoring guide, etc.).
