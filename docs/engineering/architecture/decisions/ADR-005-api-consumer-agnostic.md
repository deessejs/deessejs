# ADR-005: The API is consumer-agnostic

## Status

Accepted (2026-08). Non-negotiable.

## Context

ADR-001 establishes that `oRPC is load-bearing` — the router
type (`appRouter`) is the source of truth for the wire shape,
and every consumer (CLI, web, app) imports the typed client
and reasons about the contract. The contract is the API.

The corollary of "the contract is the API" is **directionality**.
The contract is described from the server to the consumer; the
consumer is described in the consumer's own docs. The server
does not know who its clients are. It knows the contract; it
serves the contract; it does not name the consumer.

Today, the API package leaks the consumer in three places:

1. **A dedicated endpoint**: `packages/api/src/cli-version.ts`
   defines `CLI_VERSION` and `CLI_MIN_SUPPORTED`, served at
   `/api/v1/cli-version`. The endpoint exists to let the CLI
   warn its user when the installed version is below the
   server's minimum. The endpoint's reason for being is the
   consumer.
2. **Docstrings that name the consumer**:
   - `router/routes/templates.ts:13` says "Consumed by:
     apps/cli (via @orpc/client)".
   - `core/templates/enrich.ts:7` says "CLI and apps/web consume".
   - `templates.ts:2` says "Templates registry data for the
     DeesseJS CLI".
   - `base-path.ts:14` says "served as a deprecated alias for
     installed CLI V1.x clients".
3. **A file named after the consumer**: `cli-version.ts`,
   which carries the consumer's name in the filename.

Each leak is small. The aggregate is a structural statement:
the API is the CLI's backend. The CLI is one consumer; the
API serves many. The naming and the docstrings tell the reader
that the API is for **one** consumer, the way a library's docs
tell the reader that the library is for **one** use case.

This is the opposite of the correct shape. The API is a generic
oRPC server. The contract is the only public surface. The
identity of the consumer is the consumer's concern, not the
server's.

## Decision

The `packages/api/` package is consumer-agnostic at every layer
that crosses the wire or the contract.

Concretely:

1. **No file in `packages/api/src/` is named after a consumer.**
   `cli-version.ts` becomes `version.ts`. The constant
   `CLI_VERSION` becomes `VERSION`. The route `/cli-version`
   becomes `/version` (the path is part of the contract; the
   old name was a leak).
2. **No docstring in `packages/api/src/` names a consumer.**
   "Consumed by" is a view-from-the-consumer; the API's
   perspective is "the server exposes". Docstrings that say
   "the CLI does X" become "the server does X" or are removed.
3. **The exception: infrastructure that the consumer requires
   to operate.** The `/version` endpoint stays because the
   server genuinely needs to expose its version (the consumer
   needs to read it). What changes is **the naming and the
   framing**, not the existence of the endpoint. The server
   serves its version; the server does not serve "the CLI's
   version".
4. **The direction of consumer documentation is reversed.**
   The mapping "CLI uses these endpoints" is documented in
   `apps/cli/`, not in `packages/api/`. The consumer knows
   what it consumes; the server knows what it serves.

The principle is **directionality**. The API knows the contract.
The consumer knows what it does with the contract. Neither
needs to know the other.

## What this rule allows

- **The contract itself.** The router type, the procedure
  shapes, the error envelope, the HTTP paths are public and
  documented. The consumer reads them; the API publishes them.
- **Server-side naming that names the server's purpose.**
  `version.ts`, `health.ts`, `ready.ts`, `templates.ts` are the
  server's names; the server owns them; the consumer uses them.
- **Comments that describe the server's behaviour.** "This
  endpoint returns the server's version" is fine. "This
  endpoint is for the CLI" is the leak.
- **Tests that exercise the contract.** Server-side tests
  may use any client shape to exercise the API; the test
  does not have to know who the real consumer is.

## What this rule forbids

- **Files named after a consumer** in `packages/api/src/`.
  `cli-version.ts` is the canonical example. `web-ssr.ts`,
  `app-auth.ts`, and similar names are the same violation
  with a different consumer.
- **Variables, constants, files, or routes whose name embeds
  a consumer's identity.** `CLI_VERSION`, `WEB_BASE_URL`,
  `appRouterFromCli`, `@cli/api`, etc. — the server has no
  business naming things after a consumer.
- **Docstrings that describe the consumer.** "Consumed by",
  "called by the CLI", "used by the web app" are views from
  the consumer. The server's view is "serves", "returns",
  "exposes".
- **Imports that depend on a consumer's package.** The API
  imports `@workspace/auth`, `@workspace/contracts`, and
  internal core modules. The API does not import from
  `apps/cli`, `apps/web`, or `apps/app`. The reverse may
  happen (a consumer imports the API), but the server is
  downstream of nothing in the apps folder.
- **Conditional logic based on who is calling.** The API
  does not look at a header, a user-agent, or a referer to
  decide "this is the CLI". The contract is the same for
  every caller. If a caller needs different behaviour, the
  contract is richer; the server does not branch on the
  caller's identity.

## The naming test

Before naming a file, a constant, a route, or a variable that
mentions a consumer, ask:

> *If the consumer disappeared tomorrow, would this name still
> describe the thing?*

- `CLI_VERSION` → would the constant still describe the
  server's version if the CLI did not exist? **Yes.** The
  name is wrong only because the prefix is a leak, not
  because the concept is wrong. Rename to `VERSION`.
- `cli-version.ts` → would the file still describe the
  server's version endpoint if the CLI did not exist?
  **Yes.** Rename to `version.ts`.
- `cli-version` route → would the path still describe the
  server's version if the CLI did not exist? **Yes.** The
  path is a wire contract; the rename is a breaking change
  we accept because the contract has not shipped to a
  consumer that we cannot coordinate with.
- "Consumed by apps/cli" in a docstring → would the
  statement still be meaningful? **No, the consumer is
  the source of the statement.** Remove the statement.

The test catches every leak this rule is designed to prevent.

## Why this rule exists

The opposite of this rule is **"the API is the backend for
consumer X"**. This is the shape of a typical SaaS
application: the server is built for the one client that
exists, and the client's identity is everywhere. The shape
works for the first client. It degrades as the second, third,
and fourth clients appear: the server's naming tells the
reader that the server is for one client, and the second
client's authors are confused about which conventions apply
to them.

The oRPC contract is the right primitive for the
multi-consumer case. The contract is the API; the consumer
binds to the contract; the server implements the contract.
The consumer is unremarkable to the server.

The CLI is the smallest consumer in the DeesseJS monorepo.
The web app is the largest. The web SSR rendering uses the
same routes the CLI uses. Both are downstream of the contract.
Neither is upstream of the server's naming.

A server that names itself after its largest consumer is a
server that other consumers cannot trust. A server that names
itself after the contract is a server that any consumer can
trust.

## Consequences

- A PR that introduces a file, constant, route, or docstring
  in `packages/api/` that names a consumer (`apps/cli`,
  `apps/web`, `apps/app`) is rejected. The author renames
  to the server's view.
- A PR that adds a server-side branch on caller identity
  (a header check, a user-agent check, a special token for
  one client) is rejected. The contract is the same for
  every caller; richer contracts replace caller-identity
  branches.
- A PR that imports from `apps/*` inside `packages/api/`
  is rejected. The API is downstream of nothing in the apps
  folder.
- The `clients.md` overview document that describes how
  each app consumes the API is **kept**. It is the
  legitimate home for the consumer → contract mapping; the
  document direction is consumer → engine, not engine →
  consumer. The rule forbids the mapping appearing in the
  API; the rule does not forbid the mapping appearing in
  the consumers' docs.

## What this rule does not change

- The contract itself. The `appRouter` is unchanged. The
  HTTP paths are unchanged for the routes that do not
  contain a consumer's name (every route except
  `/cli-version`).
- The library imports inside `packages/api/`. The API
  continues to import `@workspace/auth`, `@workspace/contracts`,
  `@workspace/env`, `@workspace/database`. These are
  dependencies, not consumers.
- The runtime topology. The catch-all in
  `apps/app/app/api/[[...route]]/route.ts` continues to
  mount the API. The topology is reversed later: the API
  is the engine, the apps host the routes, and the CLI is
  one caller.

## Where this rule came from

The rule was triggered by `cli-version.ts`. The file existed
because the CLI needed the server's version. The file's
existence is fine; the file's name is the leak. The name
makes the API read as "the CLI's backend" — a one-consumer
server. The rule is the discipline that prevents the same
leak from happening again with `web-ssr.ts`, `app-auth.ts`,
or any other consumer-named file the next contributor is
tempted to add.

The `"Consumed by: apps/cli"` docstring in
`router/routes/templates.ts` is a smaller instance of the same
pattern. The reader who opens the file expects a procedure
that explains what the server does; they get a comment that
explains what the consumer does. The docstring is the wrong
side of the contract.

## How to migrate

The migration is mechanical. In one PR:

1. Rename `packages/api/src/cli-version.ts` to
   `packages/api/src/version.ts`. Rename the constants
   `CLI_VERSION` → `VERSION` and `CLI_MIN_SUPPORTED` →
   `MIN_SUPPORTED_VERSION` (or similar server-side name).
2. Update the route `/cli-version` → `/version` in
   `packages/api/src/router/routes/http.ts`. Update the
   `Cache-Control` caching comment if it mentions the CLI.
3. Update the docstrings in `router/routes/templates.ts`,
   `core/templates/enrich.ts`, `templates.ts`,
   `base-path.ts` to remove the consumer view.
4. Update the consumer side (`apps/cli/src/`) to call the
   new path `/api/v1/version` instead of `/api/v1/cli-version`.
5. Update the documentation in `docs/guides/`,
   `docs/engineering/architecture/overview.md`, and any
   knowledge-base entry that references the old path.

The migration is reviewable in one PR. The wire contract
breaks; the fix is to update the CLI in the same PR or in
a follow-up PR that lands before the server ships.

## Related

- [ADR-001: oRPC is load-bearing](./ADR-001-orpc-is-load-bearing.md) —
  the contract discipline this rule is the server-side
  face of. ADR-001 says the contract is the API; ADR-005
  says the server is the contract's implementation, not
  the consumer's backend.
- [ADR-002: File organization by sub-domain](./ADR-002-file-organization.md) —
  the rule that files in a concern are named after the
  concern. The API is its own concern; a consumer is not
  a concern of the API.
- [ADR-004: API package structure](./ADR-004-api-package-structure.md) —
  the four-layer structure (`http/`, `orpc/`, `core/`,
  `constants/`) that the rename lands inside. After the
  migration, `constants/version.ts` replaces
  `cli-version.ts`; the file is in the right layer
  regardless of the rename.
- [docs/engineering/architecture/clients.md](../clients.md) —
  the document that describes what each consumer does with
  the API. The mapping lives here, in the consumers' docs,
  not in the API.
- [Rule 0006: Technology Choices](./../rules/0006-technology-choices.md) —
  the discipline that requires every technology choice to
  answer "what does it rule out". A consumer-name in the
  API rules out the API's ability to be consumer-agnostic;
  the rule makes the leak a deliberate choice, not an
  accident.
