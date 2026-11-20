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

Plugin declarations are the source for Deesse-owned tables. Run `deesse-drizzle-schema --config ./deesse.config.ts --output ./src/schema/deesse.generated.ts` to invoke the configured plugins once and emit their Drizzle schema. This command does not connect to a database. Better Auth's CLI owns `packages/database/src/schema/auth.ts`. Both files are generated artifacts and must not be edited manually.

After reviewing both generated schema files, run `pnpm db:generate` to generate the SQL migration, review and commit it, then apply it explicitly with `pnpm db:migrate`. `createDeesse()` does not apply migrations or perform startup DDL.

The real PostgreSQL integration suite is `pnpm --filter @deessejs/drizzle-adapter test`. It requires `TEST_DATABASE_URL` or `DATABASE_URL` to point to a migrated PostgreSQL database.
