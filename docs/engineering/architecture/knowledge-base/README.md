# knowledge-base/

Cross-cutting studies of external libraries we depend on. An
entry is a deep-dive on a specific integration: how the lib
works, what the upstream docs say, and what shape the
integration takes in this codebase. An entry does not fit in
`decisions/` (which captures our architectural choices),
`rules/` (which captures transverse policies), or
`docs/guides/{lib}/` (which is written for the lib's users).

## The cardinal rule: no internal code references

An entry describes the **lib and the integration pattern**,
not the **current code**. A reader of an entry should learn
how the lib works and what shape the integration takes, not
which file holds which function today.

Concretely:

- **No file paths** inside the project's source directories.
  The path is a snapshot of today's layout; the layout will
  change.
- **No internal identifier names**. The identifier is a
  contract with the current code; the contract will be
  renamed. Use neutral example names in code excerpts
  (`router`, `procedure`, `mountRpcProcedures`,
  `proxyRawRequest`, `requireSession`) — names that
  describe the pattern, not the current implementation.
- **No code excerpts** that depend on the internal layout.
  Code excerpts from the upstream docs are fine; code
  excerpts pasted from our source are not.
- **No references to internal types** like the env shape,
  the context shape, the router shape. The shape will evolve.

The reason is simple: a knowledge-base entry that pins
itself to today's code becomes **wrong the day the code
changes**. A reader who trusts the entry finds a stale
identifier, an empty path, and a contradiction. The drift
is silent. The fix is to keep the entry pointed at the lib,
not at the consumer.

When an entry needs to ground a concept in "what we do", the
grounding is the **pattern** (the shape of the integration),
not the **identifier** (the name of a function). Examples:

- "The session middleware populates the user and session
  context variables" — pattern, OK.
- "The session middleware at a specific path populates the
  user variable" — pin to a path, NOT OK.
- "The auth-guard middleware that narrows the type for
  protected procedures" — pattern, OK.
- "The auth guard middleware" — pin to an identifier, NOT OK.

The pattern is timeless. The path is not.

## What lives here vs elsewhere

| Folder | What | Audience |
|---|---|---|
| `decisions/ADR-NNN-*.md` | Our architectural choices ("we picked X because Y") | Readers of our codebase |
| `rules/*.md` | Transverse policies ("PRs must do X") | Authors of any PR |
| `knowledge-base/{lib}/*.md` | Studies of external lib integrations | Readers who need to understand a specific integration |
| `docs/guides/{lib}/*.md` | Per-lib docs, written for the lib's users | Users of the lib (locked-in decisions, setup, hooks) |

`docs/guides/{lib}/` and `knowledge-base/{lib}/` look similar
(both grouped by library) but target different audiences.
`guides/` answers "how do I use this lib"; `knowledge-base/`
answers "how does this lib fit into our codebase".

## What an entry must do

Each entry in this folder must:

- **Pin to the upstream docs, not to our code.** The entry
  is the pattern; the codebase is the implementation. When
  the implementation changes, the entry does not.
- **Cite the upstream docs or commits it builds on.** A
  reader who reads the entry should know where to go for the
  current lib version.
- **Be at least as deep as the doc it replaces** (no
  surface-level restatements of code).
- **Stand on its own** — a reader who doesn't know the
  history should be able to read this doc without reading
  three other docs first.
- **Be a study, not an ADR** — describe how a lib works and
  what shape the integration takes, not the choice we made.
- **No internal paths, no internal identifiers, no snippets
  from our source.** The cardinal rule above.

## Current entries

### `better-auth/`

- [`hono-integration.md`](./better-auth/hono-integration.md) —
  Mounting the better-auth handler in Hono, the session
  middleware that populates `c.var.user` and `c.var.session`,
  the typed Hono environment via `$Infer.Session`. Mirrors
  [better-auth.com/docs/integrations/hono](https://better-auth.com/docs/integrations/hono).
- [`test-utils.md`](./better-auth/test-utils.md) — The
  `testUtils()` plugin, the factories and database/auth
  helpers it exposes, the pattern of wiring it in a
  separate test-only auth instance (not the production
  config), and the gap between auth-package tests and a
  future api-package test that needs a real session.
  Mirrors
  [better-auth.com/docs/plugins/test-utils](https://better-auth.com/docs/plugins/test-utils).

### `hono/`

- [`middleware.md`](./hono/middleware.md) — `app.use` vs
  `app.onError`, execution order, the categories of custom
  middleware (request-id, session, rate-limit, etag, error
  handling, security headers), and the order they should be
  mounted in the composer. Mirrors
  [hono.dev/docs/guides/middleware](https://hono.dev/docs/guides/middleware).
- [`testing.md`](./hono/testing.md) — `app.request(...)` and
  `testClient` from `hono/testing`, the `testClient` type
  inference caveat (chained routes only), and the
  end-to-end test pattern that exercises the real app
  rather than a local one. Mirrors
  [hono.dev/docs/guides/testing](https://hono.dev/docs/guides/testing).

### `orpc/`

- [`hono-adapter.md`](./orpc/hono-adapter.md) — The
  `RPCHandler` mount on `/rpc/*`, the body-parser Proxy
  that defends against "Body Already Used", and the
  per-response header rewrite pattern. Mirrors
  [orpc.dev/docs/adapters/hono](https://orpc.dev/docs/adapters/hono).
- [`middleware.md`](./orpc/middleware.md) — The
  `({ context, next })` shape, `.use()` chaining, the
  auth-guard pattern that narrows the user/session type
  for protected procedures, and the `$context<...>()`
  dependent context. Mirrors
  [orpc.dev/docs/middleware](https://orpc.dev/docs/middleware).
- [`testing-mocking.md`](./orpc/testing-mocking.md) — The
  Server-Side Client (`call`), context override for fake
  dependencies, the `implement` pattern as a route-replacement
  primitive, and the discipline that bans mocks of the typed
  client. Mirrors
  [orpc.dev/docs/advanced/testing-mocking](https://orpc.dev/docs/advanced/testing-mocking).

### Root

- [`commander.md`](./commander.md) — The Command class,
  the two-call shape (with vs without description), the
  action handler signature, `parseAsync` for async
  handlers, options vs arguments, and the
  `parent.getOptionValue` pattern for reading program-wide
  flags. Mirrors
  [tj.github.io/commander.js](https://tj.github.io/commander.js/).

## Naming

Filenames are kebab-case and self-describing. An entry that
discusses Hono middleware lives at `hono/middleware.md`, not
at `hono-hono-middleware.md` or `middleware-hono.md`. The
parent folder disambiguates the lib; the filename is the
topic within that lib.

A lib without a dedicated app folder (e.g. `commander`, which
integrates with the CLI consumer app but the lib itself is
generic) gets a file at the root of `knowledge-base`. A lib
whose integration is tied to a specific layer (e.g. `hono`,
which is the HTTP layer of one package) gets a folder named
after the lib.

## When to add an entry

Add a knowledge-base entry when:

- A reader has to assemble knowledge from three or more
  places to understand an integration, and the assembly
  is non-obvious.
- We made a deliberate divergence from the upstream
  pattern that the next contributor would not guess.
- An external lib we depend on is not documented well
  enough to be used correctly from the upstream alone.

Do not add an entry when:

- The topic fits cleanly in a single file (link to that
  file from the relevant section above).
- The "study" is really a decision (write an ADR in
  `decisions/`).
- The "study" is really a policy (write a rule in
  `rules/`).
- The "study" is really a tour of our current code (the
  entry drifts on the next refactor; the cardinal rule
  forbids it).
