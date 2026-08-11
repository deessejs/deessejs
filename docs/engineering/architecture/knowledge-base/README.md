# knowledge-base/

Cross-cutting studies of external libraries we depend on. An
entry is a deep-dive on a specific integration, pinned to the
concrete files in this repo, that does not fit in
`decisions/` (which captures our architectural choices) or
`rules/` (which captures transverse policies).

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
- Be at least as deep as the doc it replaces (no surface-level
  restatements of code).
- Cite the upstream docs or commits it builds on.
- Stand on its own: a reader who doesn't know the history should
  be able to read this doc without reading three other docs first.
- Be a study, not an ADR — describe how a lib works and where each
  piece lives in our code, not the choice we made.

## Current entries

### `better-auth/`

- [`hono-integration.md`](./better-auth/hono-integration.md) —
  Mounting the better-auth handler in Hono, the session
  middleware that populates `c.var.user` and `c.var.session`,
  the typed Hono environment via `$Infer.Session`. Mirrors
  [better-auth.com/docs/integrations/hono](https://better-auth.com/docs/integrations/hono).
- [`test-utils.md`](./better-auth/test-utils.md) — The
  `testUtils()` plugin wired in `packages/auth/tests/setup.ts`,
  the factories and database/auth helpers it exposes, the
  gap between the auth-package tests and a future
  api-package test that needs a real session.

### `hono/`

- [`middleware.md`](./hono/middleware.md) — `app.use` vs
  `app.onError`, execution order, the seven custom
  middlewares in `packages/api/src/middleware/` and the
  order they are mounted in `index.ts`. Mirrors
  [hono.dev/docs/guides/middleware](https://hono.dev/docs/guides/middleware).
- [`testing.md`](./hono/testing.md) — `app.request(...)` and
  `testClient` from `hono/testing`, the `testClient` type
  inference caveat (chained routes only), and our gap
  (`routes.test.ts` tests the framework, not our code).
  Mirrors
  [hono.dev/docs/guides/testing](https://hono.dev/docs/guides/testing).

### `orpc/`

- [`hono-adapter.md`](./orpc/hono-adapter.md) — The
  `RPCHandler` mount on `/rpc/*`, the body-parser Proxy in
  `hono-adapter.ts`, our intentional divergence on the
  `X-Request-Id` response header. Mirrors
  [orpc.dev/docs/adapters/hono](https://orpc.dev/docs/adapters/hono).
- [`middleware.md`](./orpc/middleware.md) — The
  `({ context, next })` shape, `.use()` chaining, the
  `authGuard` pattern and the `$context<BaseContext>()`
  dependent context. Mirrors
  [orpc.dev/docs/middleware](https://orpc.dev/docs/middleware).
- [`testing-mocking.md`](./orpc/testing-mocking.md) — The
  Server-Side Client (`call`), context override for fake
  dependencies, the `implement` pattern we do not yet use,
  and the gap on a real `templates.list` test. Mirrors
  [orpc.dev/docs/advanced/testing-mocking](https://orpc.dev/docs/advanced/testing-mocking).

## Naming

Filenames are kebab-case and self-describing. An entry that
discusses Hono middleware lives at `hono/middleware.md`, not
at `hono-hono-middleware.md` or `middleware-hono.md`. The
parent folder disambiguates the lib; the filename is the
topic within that lib.

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
