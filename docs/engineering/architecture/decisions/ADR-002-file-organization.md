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
is `template-parser.ts` under `packages/api/src/core/templates/`.
"Generic string helpers" don't exist in this repo. If you find a
generic helper, it's because you didn't decompose enough.

The rule is recursive. `packages/api/src/utils/` is also wrong. If
`packages/api/src/core/templates/parser.ts` needs a
slug-normalizer, the slug-normalizer goes in
`packages/api/src/core/templates/slug.ts` or
`packages/api/src/core/templates/parser/slug.ts`. Not in
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
`packages/api/src/core/auth/` is correct. `packages/api/src/types/`
is wrong. `packages/auth/src/session/` is correct.
`packages/auth/src/utils/` is wrong.

The test for a correctly-organized package: opening the package's root
shows a small number of high-level entry points (e.g. `index.ts`,
`router.ts`, `service.ts`). Opening any sub-directory shows a single
sub-domain. Reading the package is a tree traversal, not a flat scan.

### Rule 5: no navigation noise in names

The reader knows where they are. The reader knows what they are
importing. The reader does not need a name to repeat information
that is already on the screen.

A name that mirrors the file path or the directory above it adds
characters without adding information. Every call site has to
re-parse the redundant half. Every grep result duplicates context.
A reader scanning the file tree is reading the same word three
times before they get to the verb that distinguishes one function
from another.

The test: a reader who is already in the file (or one tab away)
must be able to answer "what does this thing do?" from the name
alone, without the file or directory name. The name describes the
**action**, not the **path**.

This applies to:

- **function names**. A function defined in a file whose path
  already names the noun does not repeat the noun. The verb is
  enough. `load`, `parse`, `toDto` are sufficient when the caller
  is in `templates.ts` or one import line away.
- **file names that repeat the parent directory name verbatim**.
  `registry/registry.ts` is a tautology. The file is not about
  "the registry concept" — it is about a specific registry for a
  specific type.
- **type names that repeat the file name**. A file exporting a
  type whose name is the file's stem adds nothing; the import
  path already carries that information.
- **prefixes that mirror the package or app**. A function or
  constant in a sub-domain file does not need a prefix that
  names the surrounding app, package, or feature. The prefix
  is for disambiguation; disambiguation is already provided by
  the file path.

The rule is asymmetric. Repeating the noun is noise. Repeating
the verb is not — the verb is what tells the reader what the
function does. `parse` and `toDto` are different verbs; they
are not redundant even when the noun is identical.

## What this means in practice

- `packages/api/src/index.ts` is the only file at the package root
  besides `router/`, `core/`, `middleware/`, `templates.ts`
  (the registry). No `utils.ts`, no `types.ts`, no `errors.ts` at the
  root.
- `packages/contracts/src/v1/index.ts` is the only file at the version
  root besides sub-domain files (`templates.ts`, `cli.ts`, etc.).
- `apps/cli/src/api/index.ts` is the public surface. `api/client.ts`
  is the internal construction. No `api/utils.ts`.
- If a file would be called `utils.ts` or `types.ts`, the names
  involved in the file are wrong. Rename. Move.

## Common patterns live in their own file

When you implement a pattern (jitter, sleep, retry, debounce, a
data structure, a parser), it does not go in `utils/`, in the file
of a sub-domain that happens to use it, or in a "common" catch-all.
The pattern lives in its own file dedicated to that pattern. The
file's purpose is the pattern itself, nothing else.

`jitter` is a mathematical operation. It does not belong to "retry"
just because the first caller uses it for retry backoff. A future
caller might use jitter to add randomness to a UI animation. The
file is `jitter.ts`, and it implements the jitter pattern. Nothing
else.

```
- jitter.ts          implements jitter(base, range). No context.
- sleep.ts           implements sleep(ms). No context.
- retry.ts           implements retry(fn, options). No context.
- debounce.ts        implements debounce(fn, ms). No context.
```

Each of these files answers one question: "what does this pattern
do?" They do not answer "what is this pattern used for?" — that
is the caller's concern. The caller imports the pattern. The pattern
does not know about the caller.

`utils.ts` is wrong because it lumps multiple patterns together
under a name that means nothing. `jitter.ts` is right because the
file's name is the pattern's name. The file's purpose is the
pattern. The file's name is the pattern. One file, one pattern.

Data structures follow the same rule. `TemplateRegistry` is a
specific registry for a specific type. It belongs with `Template`.
A `registry.ts` that contains `TemplateRegistry`, `UserRegistry`,
`BillingPlanRegistry` is wrong — it couples three sub-domains
through a shared abstraction. Each registry belongs in its own file,
with its own data type, in its own sub-domain.

```
- packages/api/src/core/templates/registry.ts
- packages/auth/src/users/registry.ts
- packages/billing/src/plans/registry.ts
```

When two sub-domains want to share a pattern, that is a real
extract. It does not go in `utils/`. It goes in a package that
exists for that pattern:

```
- packages/retry/src/retry.ts      implements retry(fn, options)
- packages/async/src/jitter.ts     implements jitter(base, range)
- packages/async/src/sleep.ts     implements sleep(ms)
```

The package's name is the concept, not "common" or "shared" or
"utils". A package named `packages/common/` is the same anti-pattern
as `utils.ts`. The concept must have a name that describes what it
is, not where it lives.

The test: when you read the filename without the rest of the
project, do you know what the file does? `jitter.ts` says "this
implements jitter". `retry.ts` says "this implements retry". `utils.ts`
says "this is where things go when you don't know where they go". The
third is not a name. The first two are.

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
- "The function is called `fetchX` because it fetches X." If the
  reader is already in `x.ts`, the function is just `load`. The
  verb is for the action, not the noun. The noun belongs in the
  file path, not in the function name.

## What this rule allows

- Helper functions in a sub-domain directory. `template-parser.ts`
  in `packages/api/src/core/templates/` can have helper functions
  for parsing templates. They're scoped to the templates sub-domain.
- **Barrel `index.ts` per directory.** A directory's `index.ts` is
  the public surface of that directory. It re-exports declarations
  from sibling files so consumers can write
  `import { foo } from "./barrel.js"` instead of
  `import { foo } from "./barrel/foo.js"`. The barrel is required
  to be **superficial** — re-exports only, no logic, no side
  effects, no re-implementation. Adding code to a barrel turns it
  into a `utils.ts` by another name and is rejected.
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
- A PR that names a function or file by repeating the surrounding
  path is rejected. The author renames so the name carries the
  action, not the location.
- A file over ~200 lines without a clear single responsibility is a
  signal to split. The reviewer flags it, the author splits.

## How to know where a file goes

Ask three questions:

1. **What does it do?** A single noun + verb. "Parse templates" not
   "do template things".
2. **What sub-domain does it belong to?** Templates, auth, billing,
   registry. If you don't know, the file probably doesn't exist yet.
3. **Is it data, logic, or transport?** Data lives in the domain.
   Logic lives in `core/`. Transport lives in `router/` or `middleware/`.
   Types live next to the thing they describe.

## Where this rule came from

The PR #45 implementation of the templates registry started with
everything in `packages/api/src/index.ts`. As features were added,
the file grew. Imports got tangled. A grep for `template` returned
the procedure, the fetcher, the GitHub adapter, the error handler,
and the logger — all in one file. Splitting that file into
`router/`, `core/`, and `middleware/` took three PRs and three
rebase cycles.

This ADR exists so the next contributor doesn't have to do that.

### 2026-08 — exception for `core/<sub>/types.ts`

The maintainer directed the creation of `packages/api/src/core/github/types.ts`
to hold `GitHubRepo` and `GitHubReadme`, even though the exception
in "What this rule allows" requires types to be strictly internal to
the sub-domain. `GitHubRepo` is consumed by `core/templates/enrich.ts`,
which technically violates the exception's preconditions.

The maintainer's reasoning: discoverability of types independently
of the client functions, in anticipation of more GitHub-related
types landing in this sub-domain. This is a deliberate exception,
not an application of the rule. Future contributors who want a
`types.ts` in another sub-domain should follow this precedent only
with the maintainer's explicit go-ahead, not by analogy.

This entry exists so the next person reading the rule does not
mistake the precedent for general permission.

## Related

- [README.md](../README.md) — the engineering culture this ADR
  enforces.
- [rules/architecture-changes.md](../rules/architecture-changes.md) —
  every abstraction needs an ADR.
- [ADR-001: oRPC is load-bearing](./ADR-001-orpc-is-load-bearing.md) —
  the non-negotiable invariant.
