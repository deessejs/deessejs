import type { DeesseDatabaseSchema } from "deesse"
import type { PgTable } from "drizzle-orm/pg-core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export type ModelState = {
  schema: DeesseDatabaseSchema
  tables: Map<string, PgTable>
}

export type DeesseCapabilities = { transactions: true }

export type DatabaseExecutor = {
  select: PostgresJsDatabase<Record<string, unknown>>["select"]
  insert: PostgresJsDatabase<Record<string, unknown>>["insert"]
  update: PostgresJsDatabase<Record<string, unknown>>["update"]
  delete: PostgresJsDatabase<Record<string, unknown>>["delete"]
}
