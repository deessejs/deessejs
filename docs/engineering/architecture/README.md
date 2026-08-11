# Engineering culture

This repo targets tens of millions of deployments. Every shortcut
compounds. Every `any` becomes N silent bugs. Every deferred cleanup
becomes permanent debt. Excellence is not an aspiration, it is a daily
discipline applied to every commit.

## The rule

**Today is always the day of excellence. There is no "later".**

When you are tempted to write "this works for now, we can clean it up
later", you are not saving time. You are multiplying the cost by the
number of deployments that will run the code. The fix never comes.
Tomorrow is what never arrives.

## What "excellence" means concretely

These are not aspirations. They are the floor, applied to every commit,
including the throwaway ones.

### No `any`

- No explicit `any` (`function foo(x: any)`).
- No implicit `any` from missing types (`function foo(x)` with no
  inference — TypeScript's `noImplicitAny` should be on; if it isn't,
  fix it).
- No `as unknown as X` to silence the compiler. If you need a cast,
  you don't understand the type — figure it out instead.

### No cosmetic casts

- `as any`, `as never`, `as unknown` are not escape hatches. They are
  signal that the type is wrong.
- A cast is only acceptable when it documents a contract that the
  type system cannot express (interop with a third-party library
  that has weak types). When you write a cast, the next line must
  be a comment explaining why the cast is correct.
- `// @ts-ignore` and `// @ts-expect-error` are not shortcuts. They
  are documentation of a known type-system gap. The comment is
  mandatory.

### No "fix later"

- "I'll fix this in a follow-up PR" without a tracked issue is a lie.
  Either do it now, or open an issue and link it. The deferred state
  is a public surface that future readers must reverse-engineer.
- "This works for the happy path" is acceptable only if the unhappy
  path is unreachable AND proven unreachable by a test. Otherwise
  it's a bug you've chosen to ship.

### No invented formats

- The framework gives you a wire format. Use it. Don't invent a custom
  envelope because "this is simpler". The next consumer pays for your
  decision.
- The contract is shared (`packages/contracts/`). Don't redeclare it
  in the consumer. Don't add fields the producer doesn't know about.

### oRPC is not negotiable

See [decisions/ADR-001-orpc-is-load-bearing.md](./decisions/ADR-001-orpc-is-load-bearing.md).
oRPC is the load-bearing core of the internal API. We do not
workaround it, bypass it, or add a second transport. When a problem
arises, the agent escalates to the tech lead. "I'll just implement
my own envelope" is not an option. The cost of a workaround compounds
across every deployment. Tomorrow is what never arrives.

### Tests prove behavior, not implementation

- A test that calls `expect(true).toBe(true)` passes. It proves nothing.
- A test that mocks the entire service and asserts it was called proves
  nothing about whether the service works.
- A test of a getter proves the getter returns the field. It doesn't
  prove the field is the right one.
- Tests verify behavior: "given X, the system produces Y". Not "the
  implementation calls function Z".

### The doc reflects the code

- If the doc and the code disagree, both are wrong until you fix one.
  Update the doc in the same commit as the code change. Reviewers
  check both.
- If a doc says "we do X" but the code does Y, the doc is a lie. Delete
  the lie or fix the code, but don't leave the disagreement in place.

### The PR description is part of the work

- "Fixed a bug" is not a description. "Fix the off-by-one in
  `enrich` when GitHub returns fewer repos than the registry
  declares" is a description.
- "I followed the existing pattern" is acceptable when the existing
  pattern is correct. When it's wrong, the PR is wrong.
- The reviewer should be able to understand the change from the
  description alone. Code is detail.

## What this means for the work in this repo

The architecture, decisions, and rules in this directory encode the
specific invariants of this codebase. The culture encoded here encodes
how those invariants should be defended.

When the two conflict — when an ADR says "use X" but the culture says
"X is a shortcut" — the culture wins. The ADR is a description of the
state of the system at a point in time. The culture is the standard
the system is held to.

## Anti-patterns (a non-exhaustive list)

- "I'll just cast and add a TODO" — there is no TODO that gets done.
- "Tests can come later" — tests are the spec, not the audit.
- "It's only an internal tool" — every internal tool becomes a public
  surface.
- "We can refactor after the launch" — there is no "after the launch".
- "It's the same pattern as X" — sometimes X is the bug.
- "It's a one-line change" — one-line changes are how production
  breaks.

## What you do when you don't know

You stop. You ask. You read the docs.

You do not guess, implement, and hope review catches the mistake.
Review is a sanity check, not a discovery process. The author is
responsible for knowing the right answer before writing the code.

If the right answer isn't in this directory, you add it. If the right
answer isn't in the upstream docs, you cite the docs in your PR.
Either way, you don't ship without knowing.

## When the rule is non-negotiable

Some pieces of the architecture are load-bearing — touching them the
wrong way fragments the system. For those, the answer is not "work
around it". The answer is escalate.

See [decisions/ADR-001-orpc-is-load-bearing.md](./decisions/ADR-001-orpc-is-load-bearing.md)
for what that means in practice. The pattern is:

1. Stop coding.
2. Describe the problem precisely.
3. Cite upstream docs and existing ADRs.
4. Propose options.
5. Hand off to the tech lead.

The agent's job is to identify the problem, not to solve it
unilaterally when the rule says "don't". A wrong solution is worse
than no solution.

## The test of a senior commit

A senior commit is one that, two years from now, when someone is
debugging a production issue at 3am, they can read the commit message
and the diff and understand not just *what* changed but *why*, and
trust that the change is correct.

This directory is the cumulative record of what "correct" means in
this codebase. Read it before writing code. Update it when "correct"
evolves. Cite it in your PR description.

If you can't make your change pass this test, the change is not ready.
