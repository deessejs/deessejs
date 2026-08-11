# 0009 — Open Extension, Closed Modification

**Status**: Active (enforced through code review).
**Date**: 2026-08-11.

## Rule

A function that branches on a **known set of values** dispatches
through a registry (a `Map`, a `Record`, or a typed table), not
through a chain of `if`/`switch` statements. New values are added
by extending the registry; they are not added by editing the
branching function.

A function that branches on a value **not drawn from a known set**
(value the function does not own — user input, foreign values,
free-form strings) keeps its branching as the right shape, because
there is no registry to extend.

The distinction matters. A registry is the right shape when the
function itself enumerates the cases. Branching is the right shape
when the function validates an input it did not enumerate.

## Why

A chain of `if (kind === A) ... else if (kind === B) ... else if
(kind === C) ...` puts every case in the same place as the
dispatcher. Adding a case means editing the dispatcher. Removing a
case means searching the dispatcher for the string. Renaming a case
means changing it in the dispatcher and every call site. The
function is the **centre of gravity** for everything related to
the enumeration; everything else orbits it.

A registry inverts the shape. The function reads from a table;
adding a case means adding a row to the table, in the place that
already knows about cases (the table itself, or the module that
exports the table). The dispatcher does not change. The function
becomes **stable across changes to the enumeration** — which is
the property the rule is named after.

The registry also makes the set visible. A `Map<MessageModifier,
Formatter>` named `messageFormatters` reads as a table of contents;
a chain of `if (modifier === 'upper')` reads as implementation
detail. The first tells the reader what exists; the second forces
them to read every branch to know.

## What this looks like in practice

A chain of branches that should be a registry:

```ts
function formatTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)(?::(\w+))?\}/g, (_, fieldName, modifier) => {
    const value = data[fieldName];
    if (value === undefined) return _;
    if (modifier === 'upper') return String(value).toUpperCase();
    if (modifier === 'lower') return String(value).toLowerCase();
    if (modifier === 'json') return JSON.stringify(value);
    return String(value);
  });
}
```

Adding `:base64` means editing the function. The set of modifiers is
not visible at a glance.

The same logic as a registry:

```ts
// format/modifiers.ts
type MessageFormatter = (value: unknown) => string;
const messageFormatters = new Map<string, MessageFormatter>([
  ['upper', (value) => String(value).toUpperCase()],
  ['lower', (value) => String(value).toLowerCase()],
  ['json', (value) => JSON.stringify(value)],
]);

// format/template.ts
function formatTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)(?::(\w+))?\}/g, (_, fieldName, modifier) => {
    const value = data[fieldName];
    if (value === undefined) return _;
    const formatter = messageFormatters.get(modifier ?? '');
    return formatter ? formatter(value) : String(value);
  });
}
```

Adding `:base64` is one line in `modifiers.ts`. The dispatcher
does not change. The set of modifiers is visible in one file.

## When the rule does not apply

The rule is about **internal enumerations**: sets of values the
codebase itself defines and recognises. The rule does not apply to:

- **Validation of external input.** A function that validates
  user-supplied strings does not have a registry of valid inputs;
  it has a condition. Branching is correct.
- **Type narrowing of polymorphic values.** A function that
  dispatches on a discriminated union does not need a registry; the
  union is the registry, and an exhaustive `switch` is the right
  shape because the compiler can prove completeness.
- **Two or three cases that never change.** A binary toggle does
  not need a registry. The rule applies when the set is open or
  grows.

## How to refactor a chain into a registry

When you see a chain of branches that you suspect should be a
registry, ask three questions:

1. **Who owns the enumeration?** If the function itself defines
   the cases (a known set of message modifiers, a known set of
   MIME types, a known set of error codes), the cases belong in a
   table. If the function is just validating external input, the
   chain is fine.
2. **Where would a new case be added?** If the answer is "in this
   function", the function is the bottleneck. Move the table to a
   module that is the natural home for the enumeration.
3. **Is the set visible at a glance?** If a reader has to read
   every branch to know what exists, the table is hidden inside the
   dispatcher. The fix is to surface it.

## Enforcement

- **Code review**. A reviewer who sees a chain of `if (kind === X)
... else if ... else if ...` on an internally-defined enumeration
  asks for the table form.
- **Quarterly review**. A standing review of "which dispatchers
  have grown past three branches?" surfaces the candidates before
  the chain becomes impossible to read.
- **Lint rule** (future). A custom ESLint rule can detect chains
  longer than a threshold on a single parameter and suggest the
  registry form. The rule's existence is the enforcement signal
  even before it is automated.

## Exceptions

A binary or ternary branch over values that are not an
enumeration (`if (isDryRun) ... else ...`) does not benefit from a
registry. The registry would be larger than the chain.

A `switch` over a discriminated union, where the compiler can
prove exhaustiveness, is a better shape than a registry because the
compiler can warn if a case is added to the union but not the
switch. Keep the `switch`; do not turn it into a registry.

## Sources

This rule operationalises the **Open/Closed Principle** as
articulated in Robert C. Martin's _Designing Object-Oriented
C++ Applications_ (Prentice Hall, 1995) and later popularised
through his writings on agile software development. The OCP
states that software entities should be open for extension but
closed for modification; in this codebase the rule extends OCP
to the function level: a function that branches on an
internally-defined enumeration is closed for modification
(the dispatcher does not change) and open for extension (a new
case is a new row in the registry).

The rule is consistent with how framework code in mature
JavaScript projects handles dispatch tables (e.g. Redux reducers
shaped as `Record<ActionType, Reducer>`, Vite plugin hooks
shaped as a registry). The registry pattern is the TypeScript-
native expression of OCP at the function level.
