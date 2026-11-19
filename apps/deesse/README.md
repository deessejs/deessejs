# deesse

Private internal framework prototype. It is not production-ready or publishable.

## Executable runtime slice

`createDeesse()` validates plugin IDs and dependency edges, orders root-level plugins, and invokes each handler once during composition. It creates Better Auth from the configured auth options and adapter, composes application and plugin routers, and exposes a Hono Fetch handler. Hono mounts Better Auth at `/api/auth/*` and oRPC at `/api/rpc/*`. Each RPC request resolves its Better Auth session and passes request headers, user, and session into the oRPC context. No migration or database write is performed during startup.

`deesse/next` exports `toNextJsHandler(instance)` as a Hono Vercel/Next host bridge. `deesse/react` creates a Better Auth React client and a router-derived oRPC client with the same `/api/auth` and `/api/rpc` paths. The app supplies application-specific router and Better Auth client types through the existing type-only module augmentation.

Runtime tests use Better Auth's in-memory adapter only as an isolated test double. They prove plugin handler invocation, public and authenticated request-scoped oRPC context, Better Auth route mounting, and the Next host bridge. They do not prove PostgreSQL behavior.

## Bounded database type contract

The revised RFC's V1 schema and service contract is represented in public types. `DeesseDatabaseSchema` models named models, typed fields, static defaults, nullability, uniqueness, and indexes. `DeesseModelRow` maps schema fields to row values and adds the generated string `id`. `DeesseDatabaseService` types `findById`, bounded `findMany` with equality and `in` filters plus ordering, `insert`, `updateById`, `deleteById`, and a transaction-scoped service without nested transactions. Results include the RFC's typed `NOT_FOUND` outcome and the declared conflict, unsupported-capability, and infrastructure categories. JSON fields accept JSON values only.

Plugin schema contributions are merged with the adapter schema in the inferred instance service type. The compile-time fixture exercises adapter-owned and plugin-owned models through that composed type, and rejects unknown models, fields, query values, invalid limits, and invalid writes. `DatabaseAdapter` pairs the portable service with Better Auth's official database-adapter option type. The portable service does not expose a provider client.

These database operations and schema merges are a type contract only. The prototype does not implement or execute those methods, validate schema conflicts at runtime, connect Drizzle/PostgreSQL, generate or apply migrations, or prove Better Auth persistence against PostgreSQL. Its adapter fixture is structural and does not establish Drizzle compatibility. Startup remains free of database operations and DDL.

## Type model boundaries

Compile-time assertions preserve `DeesseConfig` and direct `createDeesse({ database, auth, api, plugins })` inference, including optional API/plugins, Zod raw versus parsed args, no-config plugins, router input/output, Better Auth plugin types, the exact instance shape, and the standalone `DeessePluginContributionRegistry<TPlugins>`. The registry is type-only and is not a runtime registry or a property on `DeesseInstance`.

The oRPC request context type includes the stable database service, request, headers, user, and session; the runtime passes those request-scoped values. Plugin auth schema contributions are collected in the type-only contribution registry. Extension values are checked manually with `PluginExtension`; `requires` does not infer provider-to-consumer extension validation. Runtime dependency ordering and missing/cycle/duplicate checks are implemented, but schema conflict and provider extension compatibility checks are not. The React client plugin list is explicitly supplied by app-level module augmentation and is not derived from server contributions. The contribution registry remains type-only and is not exposed on `DeesseInstance`.

The package build emits declarations and typechecks a consumer fixture through the public `deesse`, `deesse/react`, and `deesse/next` exports. Hono dispatch and client transports are now executable. A production example, schema/migration workflow, PostgreSQL integration, collections, admin, alternate providers/dialects, and broader V1 behavior remain out of scope for this slice.
