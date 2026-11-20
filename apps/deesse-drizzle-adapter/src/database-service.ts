import { error } from "@deessejs/errors"
import { err, ok, type Result } from "@deessejs/fp"
import { drizzleAdapter as officialDrizzleAdapter } from "@better-auth/drizzle-adapter"
import { and, asc, desc, getTableColumns, getTableName, isNull, or, sql, type SQL } from "drizzle-orm"
import { PgTable, type PgColumn } from "drizzle-orm/pg-core"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type {
  DeesseDatabaseAdapter,
  DeesseDatabaseErrorFields,
  DeesseDatabaseFailure,
  DeesseDatabaseSchema,
  DeesseFieldDefinition,
  DeesseFindManyOptions,
  DeesseInsert,
  DeesseModelResult,
  DeesseModelRow,
  DeesseModelDefinition,
  DeessePatch,
  DeesseTransactionService,
} from "deesse"
import type { DatabaseExecutor, DeesseCapabilities, ModelState } from "./database-service.types.js"

const DatabaseError = error<DeesseDatabaseErrorFields>({
  name: "DeesseDatabaseError",
  message: "{message}",
})

function typeBoundary<TRow>(value: unknown): TRow {
  // lint exception: Drizzle validates persisted column values and schema registration checks model-column alignment.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as TRow
}

function failure<TValue = never>(
  fields: DeesseDatabaseErrorFields,
  cause?: unknown,
): Result<TValue, DeesseDatabaseFailure> {
  const errorValue = DatabaseError(fields)
  if (cause !== undefined) errorValue.from(cause instanceof Error ? cause : new Error(String(cause)))
  return err(typeBoundary<DeesseDatabaseFailure>(errorValue))
}

function driverCode(cause: unknown): string | undefined {
  if (typeof cause !== "object" || cause === null) return undefined
  if ("code" in cause && typeof cause.code === "string") return cause.code
  return "cause" in cause ? driverCode(cause.cause) : undefined
}

function normalizeError<TValue>(model: string, cause: unknown): Result<TValue, DeesseDatabaseFailure> {
  const code = driverCode(cause)
  if (code === "23505") return failure({ code: "CONFLICT", message: "A record with the same unique value already exists.", model }, cause)
  if (code === "23502" || code === "23503" || code === "23514" || code === "22003") return failure({ code: "VALIDATION", message: "The record violates a database constraint.", model }, cause)
  return failure({ code: "INFRASTRUCTURE", message: "The database operation failed.", model }, cause)
}

function fieldValueIsValid(field: DeesseFieldDefinition, value: unknown): boolean {
  if (value === null) return field.nullable === true
  switch (field.type) {
    case "string":
    case "text":
      return typeof value === "string"
    case "integer":
      return typeof value === "number" && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
    case "boolean":
      return typeof value === "boolean"
    case "timestamp":
      return value instanceof Date && !Number.isNaN(value.getTime())
    case "date":
      return typeof value === "string" && isCalendarDate(value)
    case "json":
      return isJsonValue(value)
  }
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isJsonValue(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value !== "object" || seen.has(value)) return false
  seen.add(value)
  const valid = Array.isArray(value)
    ? value.every((item) => isJsonValue(item, seen))
    : (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) &&
      Object.values(value).every((item) => isJsonValue(item, seen))
  seen.delete(value)
  return valid
}

function validateValues(
  modelName: string,
  model: DeesseModelDefinition,
  values: Record<string, unknown>,
  operation: "insert" | "update",
): string | undefined {
  for (const [fieldName, value] of Object.entries(values)) {
    const field = model.fields[fieldName]
    if (!field) return `Unknown field ${fieldName} for model ${modelName}.`
    if (fieldName === "id") return "The id field is generated and cannot be supplied."
    if (!fieldValueIsValid(field, value)) return `Invalid value for ${modelName}.${fieldName}.`
  }
  if (operation === "insert") {
    for (const [fieldName, field] of Object.entries(model.fields)) {
      if (!(fieldName in values) && field.nullable !== true && !("default" in field)) {
        return `Missing required field ${modelName}.${fieldName}.`
      }
    }
  }
  return undefined
}

function getModel(state: ModelState, modelName: string): { table: PgTable; model: DeesseModelDefinition } | undefined {
  const table = state.tables.get(modelName)
  const model = state.schema[modelName]
  return table && model ? { table, model } : undefined
}

function getColumn(table: PgTable, fieldName: string): PgColumn | undefined {
  return getTableColumns(table)[fieldName]
}

function validateFilter(modelName: string, model: DeesseModelDefinition, key: string, value: unknown): string | undefined {
  if (key === "id") return validateIdFilter(modelName, value)
  const field = model.fields[key]
  if (!field) return `Unknown filter field ${key} for model ${modelName}.`
  if (isInFilter(value)) return validateInFilter(modelName, key, field, value.in)
  return fieldValueIsValid(field, value) ? undefined : `Invalid filter value for ${modelName}.${key}.`
}

function validateIdFilter(modelName: string, value: unknown): string | undefined {
  if (typeof value === "string") return undefined
  if (!isInFilter(value)) return `Invalid id filter for model ${modelName}.`
  return value.in.every((item) => typeof item === "string") ? undefined : `Invalid id filter for model ${modelName}.`
}

function validateInFilter(modelName: string, fieldName: string, field: DeesseFieldDefinition, values: unknown[]): string | undefined {
  if (!values.every((item) => fieldValueIsValid(field, item))) return `Invalid in filter value for ${modelName}.${fieldName}.`
  return undefined
}

function isInFilter(value: unknown): value is { in: unknown[] } {
  if (typeof value !== "object" || value === null || !("in" in value)) return false
  return Object.keys(value).length === 1 && Array.isArray(value.in)
}

function inCondition(column: PgColumn, values: unknown[]): SQL {
  if (values.length === 0) return sql`false`
  const valuesWithoutNull = values.filter((value) => value !== null)
  const matches = valuesWithoutNull.length
    ? sql`${column} in (${sql.join(valuesWithoutNull.map((value) => sql`${value}`), sql`, `)})`
    : undefined
  const matchesNull = values.some((value) => value === null) ? isNull(column) : undefined
  const combined = matches && matchesNull ? or(matches, matchesNull) : matches ?? matchesNull
  return combined ?? sql`false`
}

function filterCondition(column: PgColumn, filter: unknown): SQL {
  if (filter === null) return isNull(column)
  if (isInFilter(filter)) return inCondition(column, filter.in)
  return sql`${column} = ${filter}`
}

function whereClause(
  modelName: string,
  table: PgTable,
  model: DeesseModelDefinition,
  where: Record<string, unknown> | undefined,
): { clause?: SQL; error?: string } {
  if (!where) return {}
  const conditions: SQL[] = []
  for (const [fieldName, filter] of Object.entries(where)) {
    const invalid = validateFilter(modelName, model, fieldName, filter)
    if (invalid) return { error: invalid }
    const column = getColumn(table, fieldName)
    if (!column) return { error: `No database column exists for ${modelName}.${fieldName}.` }
    conditions.push(filterCondition(column, filter))
  }
  if (!conditions.length) return {}
  const clause = and(...conditions)
  return clause ? { clause } : {}
}

function createOperations<TSchema extends DeesseDatabaseSchema>(
  database: DatabaseExecutor,
  state: ModelState,
): DeesseTransactionService<TSchema, DeesseCapabilities> {
  const service = {
    capabilities: { transactions: true as const },
    async findById<TModel extends keyof TSchema & string>(modelName: TModel, id: string): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>> {
      const model = getModel(state, modelName)
      if (!model) return failure({ code: "VALIDATION", message: `Unknown model ${modelName}.`, model: modelName })
      const idColumn = getColumn(model.table, "id")
      if (!idColumn) return failure({ code: "INFRASTRUCTURE", message: "The model has no id column.", model: modelName })
      try {
        const rows = await database.select().from(model.table).where(sql`${idColumn} = ${id}`).limit(1)
        const row = rows[0]
        if (!row) return failure({ code: "NOT_FOUND", message: `No ${modelName} record was found.`, model: modelName, id })
        return ok(typeBoundary<DeesseModelRow<TSchema[TModel]>>(row))
      } catch (cause) {
        return normalizeError(modelName, cause)
      }
    },
    async findMany<TModel extends keyof TSchema & string>(modelName: TModel, options?: DeesseFindManyOptions<DeesseModelRow<TSchema[TModel]>>): Promise<Result<DeesseModelRow<TSchema[TModel]>[], DeesseDatabaseFailure>> {
      const model = getModel(state, modelName)
      if (!model) return failure({ code: "VALIDATION", message: `Unknown model ${modelName}.`, model: modelName })
      const limit = options?.limit ?? 20
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return failure({ code: "VALIDATION", message: "Query limit must be an integer from 1 through 100.", model: modelName })
      }
      const filter = whereClause(modelName, model.table, model.model, typeBoundary<Record<string, unknown> | undefined>(options?.where))
      if (filter.error) return failure({ code: "VALIDATION", message: filter.error, model: modelName })
      const sortColumns: SQL[] = []
      for (const [fieldName, direction] of Object.entries(options?.orderBy ?? {})) {
        const column = getColumn(model.table, fieldName)
        if (!column) return failure({ code: "VALIDATION", message: `Unknown order field for model ${modelName}.`, model: modelName })
        if (direction !== "asc" && direction !== "desc") return failure({ code: "VALIDATION", message: `Invalid order direction for model ${modelName}.`, model: modelName })
        sortColumns.push(direction === "asc" ? asc(column) : desc(column))
      }
      try {
        const select = database.select().from(model.table)
        const filtered = filter.clause ? select.where(filter.clause) : select
        const ordered = sortColumns.length ? filtered.orderBy(...sortColumns) : filtered
        const rows = await ordered.limit(limit)
        return ok(rows.map((row) => typeBoundary<DeesseModelRow<TSchema[TModel]>>(row)))
      } catch (cause) {
        return normalizeError(modelName, cause)
      }
    },
    async insert<TModel extends keyof TSchema & string>(modelName: TModel, values: DeesseInsert<TSchema[TModel]>): Promise<Result<DeesseModelRow<TSchema[TModel]>, DeesseDatabaseFailure>> {
      const model = getModel(state, modelName)
      if (!model) return failure({ code: "VALIDATION", message: `Unknown model ${modelName}.`, model: modelName })
      const insertValues = typeBoundary<Record<string, unknown>>(values)
      const invalid = validateValues(modelName, model.model, insertValues, "insert")
      if (invalid) return failure({ code: "VALIDATION", message: invalid, model: modelName })
      try {
        const rows = await database.insert(model.table).values(insertValues).returning()
        const row = rows[0]
        return row ? ok(typeBoundary<DeesseModelRow<TSchema[TModel]>>(row)) : failure({ code: "INFRASTRUCTURE", message: "The insert did not return a row.", model: modelName })
      } catch (cause) {
        return normalizeError(modelName, cause)
      }
    },
    async updateById<TModel extends keyof TSchema & string>(modelName: TModel, id: string, patch: DeessePatch<TSchema[TModel]>): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>> {
      const model = getModel(state, modelName)
      if (!model) return failure({ code: "VALIDATION", message: `Unknown model ${modelName}.`, model: modelName })
      const patchValues = typeBoundary<Record<string, unknown>>(patch)
      const invalid = validateValues(modelName, model.model, patchValues, "update")
      if (invalid) return failure({ code: "VALIDATION", message: invalid, model: modelName })
      const idColumn = getColumn(model.table, "id")
      if (!idColumn) return failure({ code: "INFRASTRUCTURE", message: "The model has no id column.", model: modelName })
      if (Object.keys(patchValues).length === 0) {
        try {
          const rows = await database.select().from(model.table).where(sql`${idColumn} = ${id}`).limit(1)
          const row = rows[0]
          return row ? ok(typeBoundary<DeesseModelRow<TSchema[TModel]>>(row)) : failure({ code: "NOT_FOUND", message: `No ${modelName} record was found.`, model: modelName, id })
        } catch (cause) {
          return normalizeError(modelName, cause)
        }
      }
      try {
        const rows = await database.update(model.table).set(patchValues).where(sql`${idColumn} = ${id}`).returning()
        const row = rows[0]
        return row ? ok(typeBoundary<DeesseModelRow<TSchema[TModel]>>(row)) : failure({ code: "NOT_FOUND", message: `No ${modelName} record was found.`, model: modelName, id })
      } catch (cause) {
        return normalizeError(modelName, cause)
      }
    },
    async deleteById<TModel extends keyof TSchema & string>(modelName: TModel, id: string): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>> {
      const model = getModel(state, modelName)
      if (!model) return failure({ code: "VALIDATION", message: `Unknown model ${modelName}.`, model: modelName })
      const idColumn = getColumn(model.table, "id")
      if (!idColumn) return failure({ code: "INFRASTRUCTURE", message: "The model has no id column.", model: modelName })
      try {
        const rows = await database.delete(model.table).where(sql`${idColumn} = ${id}`).returning()
        const row = rows[0]
        return row ? ok(typeBoundary<DeesseModelRow<TSchema[TModel]>>(row)) : failure({ code: "NOT_FOUND", message: `No ${modelName} record was found.`, model: modelName, id })
      } catch (cause) {
        return normalizeError(modelName, cause)
      }
    },
  }
  return service
}

const resultRollbackTag = Symbol("DeesseResultRollback")

export function drizzleAdapter<TPgSchema extends Record<string, unknown>, TSchema extends DeesseDatabaseSchema = never>(
  database: PostgresJsDatabase<TPgSchema>,
): DeesseDatabaseAdapter<TSchema> {
  const tables = new Map<string, PgTable>()
  for (const value of Object.values(database._.fullSchema)) {
    if (value instanceof PgTable) tables.set(getTableName(value), value)
  }
  const state: ModelState = { schema: {}, tables }
  const databaseService = createOperations<TSchema>(database, state)
  const service = {
    ...databaseService,
    async transaction<TValue>(callback: (transaction: DeesseTransactionService<TSchema, DeesseCapabilities>) => Promise<Result<TValue, DeesseDatabaseFailure>>): Promise<Result<TValue, DeesseDatabaseFailure>> {
      try {
        return await database.transaction(async (transaction) => {
          const transactionService = createOperations<TSchema>(transaction, state)
          const result = await callback(transactionService)
          if (result._tag === "Err") throw { tag: resultRollbackTag, result }
          return result
        })
      } catch (cause) {
        if (typeof cause !== "object" || cause === null) throw cause
        if (!("tag" in cause) || cause.tag !== resultRollbackTag) throw cause
        if (!("result" in cause)) throw cause
        return typeBoundary<Result<TValue, DeesseDatabaseFailure>>(cause.result)
      }
    },
  }
  const authAdapter = officialDrizzleAdapter(database, {
    provider: "pg",
    schema: database._.fullSchema,
    transaction: true,
  })
  return {
    database: service,
    authAdapter,
    initializeSchema(schema) {
      const modelNames = Object.keys(schema)
      for (const modelName of modelNames) {
        const table = tables.get(modelName)
        if (!table) throw new Error(`The configured Drizzle schema is missing Deesse model table ${modelName}.`)
        const columns = getTableColumns(table)
        const model = schema[modelName]
        if (!model) throw new Error(`No Deesse model definition was supplied for ${modelName}.`)
        for (const fieldName of Object.keys(model.fields)) {
          if (!(fieldName in columns)) throw new Error(`Drizzle table ${modelName} is missing declared field ${fieldName}.`)
        }
        if (!("id" in columns)) throw new Error(`Drizzle table ${modelName} is missing generated id column.`)
      }
      state.schema = schema
    },
  }
}
