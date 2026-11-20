# @deessejs/drizzle-adapter

The V1 PostgreSQL adapter for DeesseJS. It accepts an app-owned Drizzle database configured with the postgres-js driver and derives both the portable Deesse database service and Better Auth's official Drizzle adapter from that client. The application owns and closes the postgres-js pool.

```ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/index.js"
import { createDeesse } from "deesse"
import { drizzleAdapter } from "@deessejs/drizzle-adapter"

const client = postgres(process.env.DATABASE_URL!, { max: 10, prepare: false })
const database = drizzle(client, { schema })

export const app = createDeesse({
  database: drizzleAdapter(database),
  auth: { secret: process.env.BETTER_AUTH_SECRET! },
  plugins: [],
})
```

The adapter implements the bounded `findById`, `findMany`, `insert`, `updateById`, `deleteById`, and transaction service. It supports PostgreSQL only through postgres-js and the compatibility baseline verified by this repository's lockfile. `drizzle-orm` and `postgres` are peer dependencies.

## Schema and migrations

Plugin declarations are the source for Deesse-owned tables. Run `deesse-drizzle-schema --plugins ./plugins/index.ts --config ./deesse.config.ts --output ./.deesse/generated/deesse.schema.ts` to invoke the root plugin registrations and emit their Drizzle schema without importing the runtime config. The optional `--auth-config-output ./.deesse/tooling/auth.config.ts` flag emits an internal Better Auth CLI bridge that reuses `deesse.auth`, so the consumer does not instantiate Better Auth. If a generated auth schema does not yet exist, `--auth-schema-placeholder-output` creates an empty temporary module so the synchronous runtime config can be imported by Better Auth's CLI; the CLI then replaces it with Better Auth's authoritative schema. These commands do not connect to a database. Generated outputs should stay in ignored framework tooling directories and must not be edited manually.

In the consuming application, include the generated Deesse schema and Better Auth CLI schema in that application's Drizzle schema barrel. Generate, review, commit, and explicitly apply migrations with the application's Drizzle Kit workflow. The adapter package does not write to or export through the monorepo product database. `createDeesse()` does not apply migrations or perform startup DDL.

The real PostgreSQL integration suite is `pnpm --filter @deessejs/drizzle-adapter test`. It requires `TEST_DATABASE_URL` or `DATABASE_URL` to point to a migrated PostgreSQL database.

The `posts` plugin, Better Auth schema, and generated migrations used by that suite live only in `tests/fixtures/`. Running the integration suite generates and applies these files only to its test database. The fixtures do not write into or export through the DeesseJS product database workspace.
