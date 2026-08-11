# 0007 — Top-Down Composition: the Consumer's Eye Wins

**Status**: Active (enforced through code review).
**Date**: 2026-08-11.

## Rule

A function reads **top-down**: the first lines tell the reader what
the function does, and every subsequent step is either a name they
already understand or a name this file introduces in service of the
story.

The story is the consumer's story. When the consumer reads the file,
they see the **outcome first** and the mechanism second. Mechanism
that does not advance the story is a candidate for extraction, not
for inlining.

The internal cleverness of an implementation — its micro-optimisations,
its compactness, its "I can fit this in three lines" feel — is
secondary to the consumer's experience of reading the function.
Cleverness that does not serve the reader is a wall.

## Why

A function written bottom-up reads like an archaeological dig: the
reader has to reconstruct the author's thinking to recover the
intent. A function written top-down reads like a sentence: the
subject is named in the first line, the verb in the second, the
modifiers after. The reader's mental model updates as they read,
not after.

The rule is not "top-down is good". The rule is "top-down serves the
reader". Bottom-up is sometimes appropriate when the function is
inherently low-level (a primitive that the top layers compose); in
that case the bottom-up style is honest because the function is a
building block, not a story. The rule picks the right style for the
right layer.

DX is the constraint that keeps top-down honest. A function that
reads beautifully at the top but hides its costs in the helpers it
calls has not earned its beauty; the reader has to climb into the
helpers to know what they actually do. The right shape is the one
where the **entire call chain** is honest at each layer.

## What this looks like in practice

A function written top-down looks like this in shape:

```ts
function walkInheritanceDepthFirst(
  start: ErrorFactory,
  predicate: (factory: ErrorFactory) => boolean
): boolean {
  return walkGraph(start, factoryChildren, depthFirstTraversal(), predicate);
}
```

The reader sees: walk the inheritance graph, depth-first, return
whether the predicate matched. They do not see: `Array.push`,
`Set.has`, `while (stack.length > 0)`, the cycle-detection set, the
pop order. Each of those belongs in a function whose name carries
the concept; the consumer's eye sees the concept, not the
mechanism.

A function written bottom-up looks like this in shape:

```ts
function walkInheritanceDepthFirst(
  start: ErrorFactory,
  predicate: (factory: ErrorFactory) => boolean
): boolean {
  // Inline depth-first with cycle detection
  const stack: ErrorFactory[] = [start];
  const seen = new Set<ErrorFactory>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    if (predicate(current)) return true;
    const inherits = current.inherits;
    if (inherits !== undefined) {
      if (Array.isArray(inherits)) {
        for (let i = 0; i < inherits.length; i++) {
          stack.push(inherits[i]);
        }
      } else {
        stack.push(inherits);
      }
    }
  }
  return false;
}
```

The reader has to parse the algorithm to recover the intent. The
algorithm is correct; the readability is not.

## How to write top-down

When you start a function, write the **first line** as if it were
the only line the consumer will see. Then ask: what would the
consumer need to know next? That is the second line. Then the
third. The function's body is a sequence of names the consumer
follows, not a sequence of operations the consumer has to evaluate.

Three operations help:

1. **Name the operation before implementing it.** If you cannot
   name it, you have not understood it yet (rule 0001 invariant
   3). Go back to the input contract.
2. **Extract before composing.** When the second step is more than
   a line, it is a candidate for extraction (rule 0003). The
   extraction makes the top layer honest.
3. **Read the function aloud.** If the names, in order, do not
   form a sentence the consumer would recognise, the order is
   wrong. Reorder, or extract, until they do.

## The DX constraint

"DX wins" is not a slogan. It is a decision rule that overrides
other considerations in a fixed order:

1. If a refactor makes the consumer's experience better, do it
   even if it costs an internal layer.
2. If a micro-optimisation makes the consumer's experience worse
   (more lines to read, more concepts to hold) and does not produce
   a measurable improvement at scale, do not do it.
3. If a clever abstraction makes the consumer's experience worse
   because it forces them to learn a new vocabulary, prefer the
   obvious spelling even if it is a few lines longer.

The rule is not "no cleverness". It is "cleverness must be earned by
serving the reader". A clever abstraction that the consumer
benefits from is welcome. A clever abstraction that only the author
benefits from is a wall.

## What this looks like in violation

Three shapes that this rule exists to catch:

- **Twenty-line algorithm in a one-line function's body.** The
  consumer sees `walkInheritanceDepthFirst(...)` and expects a
  one-line answer. Instead they get an inline traversal that they
  have to parse to know what the function does.
- **Helpers named after their implementation, not their
  intention.** `cycleDetectedSet()` is named after what it does in
  this file; `visitHistory()` is named after what it represents
  in the consumer's vocabulary. The first is bottom-up, the second
  is top-down.
- **Functions that do too much at the top.** A function whose
  first line says `processItem(item)` and whose body is fifty
  lines is honest about what it does, but dishonest about how
  readable it is. Either the function is doing too much (extract),
  or its name is too vague (rename to capture the actual
  outcome).

## When this rule does not apply

A primitive whose job is to be a primitive is not subject to the
rule. A `Stack<T>.pop()` method that returns the top element or
`undefined` is bottom-up by design: the primitive is the mechanism.
The top-down shape lives in the function that uses the primitive,
not in the primitive itself.

A function whose only reader is the author (a one-off test fixture,
a debug helper, a temporary script) is not subject to the rule.
Top-down is a discipline for code that ships.

## Enforcement

- **Code review**. A reviewer who reads a function top-down and
  cannot summarise what it does in one sentence by the third line
  blocks the PR. The fix is extraction or rename, not "add a
  comment".
- **Self-review**. Before opening a PR, the author reads each new
  function aloud. If the names, in order, do not form a sentence
  the consumer would recognise, the function is not ready.
- **Quarterly review**. A standing review of "which functions in
  this codebase have grown past their name?" surfaces candidates
  for extraction. A function whose name no longer summarises its
  body is a refactor candidate, not a backlog item.

## Exceptions

Generated code, vendor bindings, and the lowest-level helpers of a
shared primitive module are not subject to top-down reading. They
are read by the consumer's eye at the layer above; their own
internal style may be bottom-up because their job is to be
mechanism.

## See also

- **Rule 0005** — Named Algorithms and Independent Data Structures:
  this rule composes the named algorithms that 0005 extracts.
- **Rule 0009** — Open Extension, Closed Modification: the discipline
  that keeps the composed layers stable across changes to the
  enumeration.

## Sources

This rule is a synthesis of the project's own working
experience. The "DX wins" framing draws on common usage in the
JavaScript ecosystem (the term appears in many libraries'
contributing guides), but the operational form — the first line
must say what the function does, the consumer must not have to
climb into helpers — is not anchored to a single external
reference. The rule captures a discipline the project has paid
for in past reviews.
