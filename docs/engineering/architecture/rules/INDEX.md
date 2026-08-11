# Rules — Index

This folder collects the project's standing **architecture rules**.
Every rule is a durable, always-on constraint that every contribution
must respect. Rules are enforced through code review; selected rules
are enforced through CI lint as the harness matures.

> "If the type says it's not null, trust the type. If the type is
> wrong, fix the type. Don't add runtime null checks for values that
> can't be null."
>
> — Miguel Pizza, _No Defensive Null Checks_, Maintainable
> TypeScript doctrine.

The slogan of the project. Rule 0001 elevates this as the
operating principle behind every invariant; rule 0004
operationalises it for runtime guards. The remaining rules
inherit from it.

## The sixteen rules at a glance

| #    | Rule                                             | One-sentence summary                                                                                                                                                                                                                                           |
| ---- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0001 | Project Mindset                                  | Every contribution must be made as if it were the last commit before the project reached its largest possible audience; ten absolute invariants, no exceptions.                                                                                                |
| 0002 | File Separation                                  | Within a concern, types/constants/functions split into their own files; across concerns, no shared barrel that re-exports types or helpers.                                                                                                                    |
| 0003 | File Placement                                   | Decide where a new file lives before creating it; a single-caller helper stays next to its caller, extraction requires a second real use site.                                                                                                                 |
| 0004 | No Speculative Defences                          | A runtime guard exists to handle a demonstrated scenario; "just in case" guards are a tax on every reader.                                                                                                                                                     |
| 0005 | Named Algorithms and Independent Data Structures | Algorithms live as named functions, not inline comments; no diminutives; data structures are independent of the algorithm that first used them.                                                                                                                |
| 0006 | Technology Choices                               | Every language mode, module system, validator, and dependency is a deliberate assumption; each must answer four questions (what, enables, rules out, revisits).                                                                                                |
| 0007 | Top-Down Composition                             | A function reads top-down; the first line tells the reader what it does, every subsequent step is a name the consumer follows; DX wins over internal cleverness.                                                                                               |
| 0008 | No Chained Type Assertions                       | `as X as Y` and `as unknown as Y` are forbidden; a single assertion crossing one boundary is allowed; the fix for a chain is a runtime guard or a better source type, not a longer cast.                                                                       |
| 0009 | Open Extension, Closed Modification              | A function that branches on an internally-defined enumeration dispatches through a Map or typed table; new values are added by extending the registry.                                                                                                         |
| 0010 | Typed Environment Access                         | `process.env` is read in exactly one file per workspace; the rest of the codebase imports a typed accessor.                                                                                                                                                    |
| 0011 | Filenames Are kebab-case                         | Every file in this repository is named in lowercase letters, digits, and hyphens; no camelCase, PascalCase, snake_case.                                                                                                                                        |
| 0012 | Prefer `type` Over `interface`                   | Shapes are declared with `type`; `interface` is reserved for declaration merging, class implementation of open shapes, and host type augmentation.                                                                                                             |
| 0013 | Entity-First Naming                              | Any name that ends in `-er` (`Manager`, `Service`, `Handler`, `CancelOrderHandler`) is refused; only entity names (`OrderCancellation`) are accepted.                                                                                                          |
| 0014 | Functions Over Classes for Public API            | Classes are internal implementation details; the public API exports factory functions (`group()`, `createGroup()`), never `new ClassName()`.                                                                                                                   |
| 0015 | Domain-Specific Types Over Primitives            | A `Message` is a `Message` (with `content`, `type`, …), not a bare `string`; a domain identifier is branded only when a second identifier of the same primitive would otherwise be confused with it. Primitives cross boundaries only at conversion functions. |
| 0016 | No Generic Verbs                                 | A function's verb must encode the transformation (`decode`, `parse`, `validate`) and the return type must encode the result; `process`, `convert`, `handle`, `do` are refused.                                                                                 |

## How to read this folder

If you are new to the project, read in this order:

1. **Rule 0001** — the mindset. Every other rule is a consequence of
   the ten invariants.
2. **Rule 0002** then **Rule 0003** — how files are split and
   placed. The structure every other rule assumes.
3. **Rule 0004** then **Rule 0005** — what code is honest about its
   runtime behaviour and its algorithms.
4. **Rule 0006** then **Rule 0007** — what assumptions the project
   commits to and how those assumptions read in code.
5. **Rules 0008, 0009, 0010, 0011** — the type and runtime
   discipline. These are mechanically checkable and become CI gates
   as the harness matures.

## Cross-references

Each rule has its own `## See also` section listing the rules it
depends on or complements. A rule that says "see rule 0009" means
"the discipline is fully stated in 0009; this rule is the upstream
constraint that 0009 then enforces".

The cross-reference graph is intentionally dense; the rules are
meant to be read together. A reader who finishes one rule should
have a clear next rule to consult.

## Adding a new rule

The format and lifecycle are documented in this folder's
[`README.md`](./README.md). The short version:

- One concept per rule. If a rule says "X and Y", it is two rules
  waiting to be split.
- A `NNNN-short-slug.md` filename, monotonic.
- The rule must answer four questions: what is it, what does it
  enable, what does it rule out, when would we revisit.
- The rule must include at least one bad/good code example unless
  the rule is purely structural (a casing rule, a placement rule).
- The rule must include a `## See also` section that links to
  neighbouring rules.
- The rule must declare its enforcement: review, CI lint, or both.

## Status lifecycle

| Status                 | Meaning                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Active**             | Currently enforced. Every PR must respect this rule.                                       |
| **Enforced via CI**    | The rule is checked mechanically on every PR. _(Target state — no rule has migrated yet.)_ |
| **Superseded by NNNN** | Replaced by a later rule; the old rule is kept for context and cross-references.           |
| **Deprecated**         | Kept on disk for context but no longer required.                                           |
