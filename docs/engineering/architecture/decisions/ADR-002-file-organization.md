# ADR-002: File organization by sub-domain

## Status

Accepted (2026-08). Non-negotiable.

## Context

A codebase that targets tens of millions of deployments cannot afford
arbitrary file organization. When types, constants, and functions are
mixed across files, three things go wrong:

1. **Cognitive overhead.** A reader opens `foo.ts` to understand a
   feature and finds unrelated types pulled in from `bar.ts`. They
   scroll between tabs to follow imports. Reading time grows linearly
   with project size, not logarithmically.
2. **Coupling by import.** Two files that share a type know about each
   other. When the shared type changes, both files must move in lock
   step. The codebase becomes brittle.
3. **Discovery cost.** A new contributor doesn't know where `Template`
   lives. They grep. Grep returns 10 hits. They read each one.

The default failure mode is "I'll just put this in `utils.ts` and
move it later". There is no later. The next person adds to the same
file. The file becomes 500 lines. It depends on everything.

## Decision

Three rules apply to every file in this repo. They are enforced by
review, not by tooling, because tooling can verify file shape but
cannot verify intent.

### Rule 1: types, constants, and functions live in their own files

A type lives in a file named after the type. A constant lives in a
file named after the constant. A function lives in a file named after
the function.

`type Template = ...` → `template.ts`.
`const TEMPLATES_RPC_PATH = ...` → `templates-rpc-path.ts` (or
`base-path.ts` in the right scope).
`function unwrapOrpc(...)` → `unwrap-orpc.ts`.

Files do not "share" types, constants, or functions. Two adjacent
files in the same directory each own their declarations. The
relationships between them live in the imports at the top of the
consumer, not in a shared header.

**Exception**: a module-level declaration that exists only to group
logically related values, with no other code in the file, is a
namespace disguised as a module. The exception is rare. When in
doubt, extract.

### Rule 2: no domain-agnostic catch-all files

There is no `utils.ts`, `helpers.ts`, `misc.ts`, or `common.ts` at
the root of any package. There is no `types.ts` at the root of any
package. These names signal "I didn't know where this should go".

When you find yourself reaching for `utils.ts`, ask: what sub-domain
is this? "Template parsing" is not `utils/template-parsing.ts` — it
is `template-parser.ts` under `packages/api/src/services/template/`.
"Generic string helpers" don't exist in this repo. If you find a
generic helper, it's because you didn't decompose enough.

The rule is recursive. `packages/api/src/utils/` is also wrong. If
`packages/api/src/services/templates/parser.ts` needs a
slug-normalizer, the slug-normalizer goes in
`packages/api/src/services/templates/slug.ts` or
`packages/api/src/services/templates/parser/slug.ts`. Not in
`packages/api/src/utils/`.

### Rule 3: if a function might be reused, extract it now

When you write a function, ask: "would another module in this repo
benefit from this?" If yes — or if the answer is "I'm not sure but
the logic is generic enough" — extract it now.

"Later" is not a valid answer. The next caller will write the same
function inline. Two callers will diverge. The next refactor will
have to merge them, and the diff will be confusing because the two
versions will have small differences.

The cost of extracting too early is one import line. The cost of
extracting too late is two functions, two test files, and a
backwards-compatibility shim. Always extract.

The heuristic: if the function is more than ~10 lines, or if its name
is a verb rather than a noun ("parse" vs "parser"), or if the body
manipulates primitives rather than domain objects, extract.

### Rule 4: directories reflect sub-domains, not file types

A package's root directory should not contain loose files. If a
package has `auth.ts`, `auth-types.ts`, `auth-utils.ts`, and
`auth-context.ts` at its root, the package is mis-organized. Each of
these is a separate concern and should live in a sub-directory.

Sub-directories are named after sub-domains, not after file types.
`packages/api/src/services/auth/` is correct. `packages/api/src/types/`
is wrong. `packages/auth/src/session/` is correct.
`packages/auth/src/utils/` is wrong.

The test for a correctly-organized package: opening the package's root
shows a small number of high-level entry points (e.g. `index.ts`,
`router.ts`, `service.ts`). Opening any sub-directory shows a single
sub-domain. Reading the package is a tree traversal, not a flat scan.

## What this means in practice

- `packages/api/src/index.ts` is the only file at the package root
  besides `router/`, `services/`, `middleware/`, `templates.ts`
  (the registry). No `utils.ts`, no `types.ts`, no `errors.ts` at the
  root.
- `packages/contracts/src/v1/index.ts` is the only file at the version
  root besides sub-domain files (`templates.ts`, `cli.ts`, etc.).
- `apps/cli/src/api/index.ts` is the public surface. `api/client.ts`
  is the internal construction. No `api/utils.ts`.
- If a file would be called `utils.ts` or `types.ts`, the names
  involved in the file are wrong. Rename. Move.

## Anti-patterns

- "I'll just put this in `utils.ts` for now, I'll move it later."
  There is no later.
- "This is a generic helper, it doesn't belong to any sub-domain." If
  it doesn't belong to any sub-domain, it doesn't belong in this repo.
- "The function is only used once, but it might be useful later." If
  it might be useful later, extract it now. The cost of "later" is
  higher than the cost of "now".
- "I'll create `types.ts` to share types between files." No. Each
  type lives in its own file or with the feature it belongs to.

## What this rule allows

- Helper functions in a sub-domain directory. `template-parser.ts`
  in `packages/api/src/services/templates/` can have helper functions
  for parsing templates. They're scoped to the templates sub-domain.
- Re-exports in `index.ts`. A sub-domain's `index.ts` can re-export
  declarations from other files in the same sub-domain. This is
  allowed because it's a public surface, not a dump.
- A single small `types.ts` for a sub-domain when the types are
  strictly internal to that sub-domain. The exception applies per
  sub-domain, not per package.

## Consequences

- A PR that introduces a `utils.ts`, `helpers.ts`, or `types.ts` at a
  package root is rejected. The reviewer flags it, the author renames
  or splits.
- A PR that inlines a function that's used (or could be used) in two
  places is rejected. The author extracts.
- A PR that puts a function in the wrong sub-domain is rejected. The
  author moves it.
- A file over ~200 lines without a clear single responsibility is a
  signal to split. The reviewer flags it, the author splits.

## How to know where a file goes

Ask three questions:

1. **What does it do?** A single noun + verb. "Parse templates" not
   "do template things".
2. **What sub-domain does it belong to?** Templates, auth, billing,
   registry. If you don't know, the file probably doesn't exist yet.
3. **Is it data, logic, or transport?** Data lives in the domain.
   Logic lives in services. Transport lives in router or middleware.
   Types live next to the thing they describe.

## Where this rule came from

The PR #45 implementation of the templates registry started with
everything in `packages/api/src/index.ts`. As features were added,
the file grew. Imports got tangled. A grep for `template` returned
the procedure, the fetcher, the GitHub adapter, the error handler,
and the logger — all in one file. Splitting that file into
`router/`, `services/`, and `middleware/` took three PRs and three
rebase cycles.

This ADR exists so the next contributor doesn't have to do that.

## Related

- [README.md](../README.md) — the engineering culture this ADR
  enforces.
- [rules/architecture-changes.md](../rules/architecture-changes.md) —
  every abstraction needs an ADR.
- [ADR-001: oRPC is load-bearing](./ADR-001-orpc-is-load-bearing.md) —
  the non-negotiable invariant.
