# ADR-001: oRPC is the load-bearing core of the internal API

## Status

Accepted (2026-08). Non-negotiable.

## Context

Every consumer app in this repo (`apps/web`, `apps/app`, `apps/cli`)
talks to the shared backend (`packages/api`) through oRPC. The router
type (`appRouter`) is the source of truth for the wire shape. The
typed client (`RouterClient<typeof appRouter>`) gives every consumer
input/output inference. The error wire format (`ORPCError`) is the
only error shape the consumers know how to decode.

When an agent encounters friction with oRPC — an undocumented edge
case, a test that won't pass, a feature that doesn't fit the
contract — the temptation is to bypass: a custom envelope, a parallel
REST endpoint, a second transport mechanism, a wrapper that imitates
what oRPC already does. Each bypass fragments the architecture and
forces every consumer to learn a new path.

## Decision

**oRPC is the load-bearing core of the internal API. We do not work
around it. We do not bypass it. We do not add a second transport
mechanism.**

If a problem arises that oRPC doesn't solve cleanly, the agent
**stops and escalates to the tech lead**. The agent does not
implement a workaround. The agent does not write a custom envelope.
The agent does not write a parallel REST endpoint. The agent does not
add a second transport mechanism.

The reason is simple: the cost of a workaround compounds. A custom
envelope becomes a public surface that every consumer must learn. A
parallel REST endpoint becomes a drift vector. A wrapper that imitates
oRPC becomes dead weight that future readers must understand. The
"temporary workaround" never gets replaced. Tomorrow is what never
arrives.

This ADR is senior-grade because it puts a hard stop on the most
common failure mode of the codebase: agents optimizing for local
correctness at the expense of global architecture.

## What this means in practice

When you write code that touches oRPC:

1. **Check the upstream docs first.** Per `rules/external-knowledge.md`,
   the official docs are the source of truth. If a feature is
   undocumented, the answer is not "implement a workaround" — it is
   "escalate".
2. **Read the contracts.** The wire shape lives in
   `packages/contracts/`. The router lives in `packages/api/src/router/`.
   If your code needs a shape that doesn't exist in either, the answer
   is not "shape your own" — it is "escalate".
3. **Read this ADR carefully.** If your code contradicts what it
   says, you are wrong. Update the ADR first, then the code.
4. **When in doubt, escalate.** The tech lead is the human escalation
   path. The agent's job is to identify the problem precisely, not
   to solve it unilaterally.

## What "escalate" looks like

Not "let me try X first and see if it works". Not "I think this
might be right". Concrete:

1. Stop coding.
2. Describe the problem in writing, citing the upstream docs and the
   existing ADRs.
3. Propose two or three options, each with a cost and a benefit.
4. Hand off to the tech lead.

The agent's contribution is the precise description of the problem,
not a solution that may or may not be correct. A wrong solution is
worse than no solution: it's a public surface that future readers
must understand, and it's often impossible to remove without breaking
every consumer.

## What this rule forbids

- A custom error envelope alongside `ORPCError`.
- A REST endpoint at `/api/v1/...` that shadows an oRPC procedure.
- A "client-side workaround" that bypasses the typed client (e.g.
  direct `fetch` to the server instead of `client.templates.list()`).
- A wrapper that imitates what `RPCLink` already does.
- A parallel transport mechanism (REST + oRPC, or GraphQL + oRPC).
- A `fetch` in a procedure handler that bypasses the `core/` layer.

Each of these is a load-bearing piece of "today is a temporary
shortcut that becomes tomorrow's permanent debt".

## What this rule allows

- Reading the oRPC docs to understand the right way.
- Asking questions in PR comments when an ADR is unclear.
- Proposing an ADR change when the existing rule is wrong.
- Adding a procedure that uses oRPC's existing patterns.

These are how the system evolves. They are not workarounds.

## Consequences

- A PR that introduces a workaround is rejected, regardless of
  whether the workaround "works". The reviewer flags it, the author
  reverts or escalates.
- A test that fails because oRPC doesn't behave as the model
  expected is not a signal to mock around oRPC. It is a signal to read
  the docs and update the test to match the real behavior.
- A feature request that doesn't fit oRPC is not a signal to add a
  parallel system. It is a signal to escalate.

## Anti-patterns

- "I'll just use REST here, oRPC is overkill for this endpoint." No.
  Every endpoint uses oRPC.
- "I'll catch the error and remap it to my custom format." No.
  ORPCError is the format.
- "I'll mock the RPCLink to make the test pass." No. Use a real
  `http.createServer` or a Server-Side Client test against
  `appRouter`.
- "I'll wrap oRPC in a custom error handler because ORPCError is too
  complex." No. Use ORPCError directly.

## What this rule does not forbid

- Using `context` on the RPCLink to thread per-call state. That's a
  documented oRPC feature.
- Adding a middleware on the server. The router has a middleware
  story; we use it.
- Reading the oRPC source code to understand a behavior. Reading is
  not bypassing.

## Where this rule came from

The PR #45 migration of `/templates` from REST to oRPC stalled
because the model produced code that bypassed oRPC in several places
(custom envelope, manual unwrap, mocked fetch). Each bypass was a
local optimization that fragmented the architecture. The cost of
recovering those bypasses is now borne by every consumer that has to
understand them.

This ADR exists to prevent recurrence. oRPC is the load-bearing
core. It is not negotiable. Workarounds are not options. Escalation
is the path.

## Related

- [README.md](../README.md) — the engineering culture this ADR enforces.
- [rules/external-knowledge.md](../rules/external-knowledge.md) —
  official docs over model knowledge.
- [rules/architecture-changes.md](../rules/architecture-changes.md) —
  every abstraction needs an ADR.
