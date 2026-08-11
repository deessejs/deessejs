# 0001 — Project Mindset: Excellence by Default

**Status**: Active (enforced through code review and contributor onboarding).
**Date**: 2026-08-11.

## Rule

Every contribution to this repository must be made **as if it were the
last commit before the project reached its largest possible audience**.
The standard is "would I be comfortable explaining this line to a
contributor joining in two years, in front of a million users, with no
opportunity to revise it first?"

There is no "good enough for now". There is no "we'll fix it later".
The work done today is the work that ships at scale.

## Why

A foundation library reaches a long tail of users. Each shortcut
compounds: a single `as any` raté costs a fraction of a second of
author time today, then costs hours of debugging at scale tomorrow, then
becomes the reason a downstream team migrates to a competitor. The
cost asymmetry is brutal in one direction and trivial in the other.

The same logic applies to **understanding**. A line of code written
without fully grasping its consequences will eventually be the line
that breaks. There is no shortcut around comprehension. Anyone who
finds themselves reaching for one is, by definition, the wrong person
to write that line at that moment.

The codebase is read far more often than it is written. Every
contribution must optimise for the **reader**, not the author.

## The ten invariants

Every contribution must satisfy all of these. They are not
guidelines; they are the floor.

1. **No shortcuts.** A cast that bypasses the type system is a lie to
   the audience. Either the return type is what you say it is, or it
   is not, and the code should reflect that truthfully.

2. **No conscious debt.** "We'll fix it later" is a promise to a
   future that may not exist. The only moment we are paid to do
   something well is the moment we are doing it. There is no later
   that justifies a shortcut now.

3. **Understand before writing.** If the API being called is not
   understood in full, the code is not ready to be written. Reading
   the source, asking the maintainer, or waiting for an answer are
   all acceptable next steps. Guessing is not.

4. **No speculative abstractions.** An abstraction added "in case"
   is a wall the next contributor will have to climb. Abstract only
   when three concrete cases exist (Rule of Three). Until then, the
   duplication is cheaper than the abstraction. _The threshold for
   extracting an abstraction (three) differs from the threshold for
   moving a single file (two distinct concerns); see rule 0003 for
   the file-level decision._

5. **No `any`.** `unknown` is the safe escape hatch. If a type cannot
   be expressed, model it explicitly — through a schema, a discriminated
   union, or a generic — rather than closing the eyes.

6. **No silent failures.** A `try`/`catch` that swallows an error is
   a betrayal of the user. Either re-raise, transform with explicit
   context, or log through a structured channel. Never silently.

7. **No compiler bypass.** `@ts-expect-error`, `as` casts, `// @ts-ignore`,
   dynamic `require`, and friends are signals that the code has a
   problem. Address the problem; do not silence the alarm.

8. **No dependency without justification.** A new dependency is a
   long-term commitment. Before adding it, be able to answer: what is
   its license, its release cadence, its bus factor, and why this
   one and not its alternatives. If the answer is "it has stars", it
   is not ready.

9. **Optimise for the reader.** The next maintainer is the
   audience. If a PR is harder to read than to write, it is the
   wrong PR. Comments explain _why_, not _what_. Names carry
   meaning; comments carry context that names cannot.

10. **Excellence is silent.** No commit message that celebrates. No
    PR description that congratulates itself. The work is the
    artefact. If it needs explanation to be recognised as good, the
    work is not good enough.

## The trust-the-type principle

The single sentence that operationalises the ten invariants:

> "If the type says it's not null, trust the type. If the type is
> wrong, fix the type. Don't add runtime null checks for values
> that can't be null."
>
> — Miguel Pizza, _No Defensive Null Checks_, Maintainable
> TypeScript doctrine.

Every invariant in this rule is a consequence of that principle.
The compiler is the first reviewer (invariant 9); the compiler says
"not null", the runtime says "I trust you" — or, if the compiler
is wrong, the fix is in the type, not in the runtime (rule 0004
operationalises this). No conscious debt (invariant 2) means no
guard that papers over a type we are afraid to fix. No speculative
abstractions (invariant 4) means no abstract `defensive(...)`
helper that catches everything on the assumption that anything
might happen.

The principle is the slogan of the project. A reader who
remembers only one sentence from this rule set should remember
this one.

## Enforcement

- **Code review** is the primary gate. A reviewer who sees any of the
  ten invariants violated is expected to block the PR, regardless of
  urgency or seniority of the author.
- **Onboarding** documents must include this rule verbatim. New
  contributors who arrive through a fast path (open-source
  contribution, AI-assisted PR) are pointed here on their first
  interaction with the repo.
- **Self-removal**: contributors who consistently violate the
  invariants despite feedback are removed from the maintainer list.
  This is not a punishment; it is a recognition that the project and
  the contributor have different standards, and the project's
  standard is the one that ships.

## Examples

Three invariants illustrated as bad/good pairs. The patterns are
generic; they apply to any code that takes the same shape.

**Invariant 1 (no shortcut) — the lie of a cast:**

```ts
// Bad: bypasses the type system because the author did not want to
// model the actual shape.
function loadConfig(path: string): Config {
  const raw = readFile(path) as any;
  return raw as Config;
}

// Good: the author learned what the file actually contains and
// modelled it. If the file is malformed, the function says so.
function loadConfig(path: string): Config {
  const raw = readJson(path);
  if (!isConfig(raw)) {
    throw new InvalidConfigError(path, raw);
  }
  return raw;
}
```

**Invariant 5 (no `any`) — escape hatches are modelling failures:**

```ts
// Bad: the author could not express the union, so they shut their eyes.
function handle(event: any) {
  if (event.type === 'click') {
    /* ... */
  }
}

// Good: the discriminated union models the truth. The compiler proves
// every branch is handled.
type Event = { type: 'click'; position: Position } | { type: 'key'; key: string };

function handle(event: Event) {
  switch (event.type) {
    case 'click':
      return; /* ... */
    case 'key':
      return; /* ... */
  }
}
```

**Invariant 6 (no silent failures) — the `catch` that lies:**

```ts
// Bad: the author wrapped the call to be safe and caught "in case".
// Failures vanish. The user never learns.
try {
  await sync();
} catch {
  /* nothing */
}

// Good: either re-raise with context, transform into a domain error,
// or log through a structured channel. Never silently.
try {
  await sync();
} catch (cause) {
  throw new SyncError('sync failed', { cause });
}
```

The remaining invariants are expanded in their dedicated rules:
see rule 0004 for invariants 4 and 7 (no speculative defences, no
compiler bypass) and rule 0008 for the type-side discipline
underlying invariant 7.

## See also

- **Rule 0002** — File Separation: the structure this mindset expects.
- **Rule 0003** — File Placement: the discipline that turns the
  mindset into a code-shape decision. The Rule of Three named in
  invariant 4 above is the _abstraction_ threshold; rule 0003
  applies a _second-concern_ threshold for file relocation — the
  two are different decisions with different evidence.
- **Rule 0004** — No Speculative Defences: invariant 4 (no
  speculative abstractions) and invariant 7 (no compiler bypass)
  in operational form.
- **Rule 0007** — Top-Down Composition: the discipline that puts
  the reader first.
- **Rule 0008** — No Chained Type Assertions: the type-side
  application of invariant 7.

## Exceptions

None. The invariants are absolute. A request for an exception is a
signal that the request should be re-scoped until it no longer
requires one.

## Sources

- **Pizza, Miguel.** _No Defensive Null Checks._ Maintainable
  TypeScript doctrine. Cited in rule 0001's trust-the-type epigraph
  and again in rule 0004 (where the principle is operationalised
  for runtime guards). The "trust the type" quote is the project's
  slogan; the rule applies the principle at the level of
  contributor mindset.
