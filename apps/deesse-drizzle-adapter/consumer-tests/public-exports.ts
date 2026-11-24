import { drizzleAdapter, type DrizzleAdapter } from "@deessejs/drizzle-adapter"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

declare const database: PostgresJsDatabase<Record<string, unknown>>
const adapter = drizzleAdapter(database)
const adapterContract: DrizzleAdapter<never> = adapter
const transactions: true = adapter.database.capabilities.transactions
void adapterContract.authAdapter
void transactions
// @ts-expect-error the adapter does not publish a raw postgres-js client as the Deesse service
void adapter.database.$client
