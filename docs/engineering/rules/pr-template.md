# Pull request template

## What

What does this PR change? One or two sentences. Reference the issue
or ADR.

## Why

Why is this change necessary? What problem does it solve? What is
the expected outcome?

## Architecture

Which existing boundaries does this touch? Cite `architecture/` or
`decisions/` files by name. If you introduce a new abstraction,
link the ADR you wrote in the same PR.

## Decisions

Did you introduce a new abstraction, pattern, or file in a new
location? Why? What alternatives did you consider?

## External documentation

Were external libraries, frameworks, or APIs involved in this
change? If yes:

- Which versions (per `package.json`)?
- Which official documentation did you consult? Cite URLs.
- Did the documentation contradict any existing code? If yes, how
  was it resolved?

See `rules/external-knowledge.md` for the policy.

## Testing

What behavior is actually tested? Which pattern?

- [ ] Server-Side Client (`appRouter.X()` direct) for procedure contract
- [ ] `http.createServer` fixture for the transport layer
- [ ] MSW with `@dansnow/orpc-msw` for component tests
- [ ] External service mocked (Stripe, GitHub, etc.)

What assertions? Are they testing behavior or implementation?

## Risks

What could break? What did you not test? Are there migrations
needed (changesets, ADRs)?

## Checklist

- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] If new abstraction: ADR created or updated
- [ ] If invariant changed: corresponding `architecture/` doc updated
- [ ] If external lib changed: docs cited in this description
- [ ] If mock added: it follows `rules/test-mocking.md`
- [ ] No `vi.stubGlobal("fetch", ...)` in test files

## Example

```md
## What
Adds the `/api/v1/rpc/templates/list` procedure to the shared
backend. Closes #42.

## Why
The marketing site and the CLI both need the templates registry.
Direct `fetch` calls duplicated the wire format. RPC + typed client
gives every consumer input/output type inference.

## Architecture
- New procedure in `packages/api/src/router/templates.ts`
- Error wire format per ADR-016
- Client wrapper per ADR-015

## Decisions
- Single procedure, no server-side cache (deferred to V1.1)
- Layer field on registry entry (open-community | pro | enterprise)

## External documentation
- oRPC Hono adapter: https://orpc.dev/docs/adapters/hono
- @orpc/client RPCLink: confirmed 5-arg fetch signature in
  node_modules/@orpc/client/dist/adapters/fetch/index.d.ts

## Testing
- apps/cli/test/contract/orpc-to-cli-error.test.ts: 8/8 pass
- apps/cli/test/integration/list.test.ts: 4/4 pass
- Server-Side Client used for procedure contract

## Risks
None for V1. Server-side cache is deferred.

## Checklist
- [x] Typecheck passes
- [x] Lint passes
- [x] Tests pass
- [x] ADR-014 created
- [x] architecture/rpc.md updated
- [x] rules/test-mocking.md followed
```
