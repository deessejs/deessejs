# deesse

Private internal framework prototype. It is not production-ready or publishable.

## Executable runtime slice

`createDeesse()` validates plugin IDs and dependency edges, orders root-level plugins, and invokes each handler once during composition. It creates Better Auth from the configured auth options and adapter, composes application and plugin routers, and exposes a Hono Fetch handler. Hono mounts Better Auth at `/api/auth/*` and oRPC at `/api/rpc/*`. Each RPC request resolves its Better Auth session and passes request headers, user, and session into the oRPC context. No migration or database write is performed during startup.

`deesse/next` exports `toNextJsHandler(instance)` as a Hono Vercel/Next host bridge. `deesse/react` creates a Better Auth React client and a router-derived oRPC client with the same `/api/auth` and `/api/rpc` paths. The app supplies application-specific router and Better Auth client types through the existing type-only module augmentation.

Runtime tests use Better Auth's in-memory adapter only as an isolated test double. They prove plugin handler invocation, public and authenticated request-scoped oRPC context, Better Auth route mounting, and the Next host bridge. They do not prove PostgreSQL behavior.

## Database contract blocker

The referenced adapter RFC leaves the public database operations, plugin schema representation, migration artifact format, and distribution boundary undecided. The CRUD and validation RFCs leave query/write semantics and error behavior open as well. The current `DeesseDatabaseService` only represents capabilities; it is not a usable persistence API. Plugin `database.schema` contributions are collected by the type-only registry but are not applied to a database. This slice therefore does not implement or claim a PostgreSQL adapter, schema composition into a provider, generated migrations, migration application, or Better Auth persistence on PostgreSQL.

The smallest required decision is the initial PostgreSQL slice's schema input and portable service operations, plus its generated migration artifact and explicit apply command. Runtime startup must remain free of database mutation. Once decided, a provider adapter can expose the service and Better Auth adapter from the same PostgreSQL connection without leaking the provider client through the portable service.

## Type model boundaries

Compile-time assertions preserve `DeesseConfig` and direct `createDeesse({ database, auth, api, plugins })` inference, including optional API/plugins, Zod raw versus parsed args, no-config plugins, router input/output, Better Auth plugin types, the exact instance shape, and the standalone `DeessePluginContributionRegistry<TPlugins>`. The registry is type-only and is not a runtime registry or a property on `DeesseInstance`.

Extension values are checked manually with `PluginExtension`; `requires` does not infer provider-to-consumer extension validation. Runtime dependency ordering and missing/cycle/duplicate checks are implemented, but schema conflict and provider extension compatibility checks are not. The React client plugin list is explicitly supplied by app-level module augmentation and is not derived from server contributions. The portable database fixture is structural and does not establish Drizzle or PostgreSQL compatibility.

The package build emits declarations and typechecks a consumer fixture through the public `deesse`, `deesse/react`, and `deesse/next` exports. Hono dispatch and client transports are now executable. A production example, schema/migration workflow, PostgreSQL integration, collections, admin, alternate providers/dialects, and broader V1 behavior remain out of scope for this slice.
