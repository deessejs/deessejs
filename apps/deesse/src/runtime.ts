import { betterAuth } from "better-auth"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { DEESSE_AUTH_PATH, DEESSE_RPC_PATH } from "./paths.js"
import type { AnyRouter, DeesseDatabaseSchema, DeesseFetchHandler, DeesseFieldDefinition, DeesseModelDefinition, PluginContribution } from "./types.js"
import type { RuntimeOptions, RuntimePlugin } from "./runtime-types.js"

function orderedPlugins(plugins: readonly RuntimePlugin[]): readonly RuntimePlugin[] {
  const byId = new Map<string, RuntimePlugin>()
  for (const item of plugins) {
    if (byId.has(item.id)) throw new Error(`Duplicate Deesse plugin id: ${item.id}`)
    byId.set(item.id, item)
  }

  const ordered: RuntimePlugin[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (item: RuntimePlugin): void => {
    if (visited.has(item.id)) return
    if (visiting.has(item.id)) throw new Error(`Deesse plugin dependency cycle at: ${item.id}`)
    visiting.add(item.id)
    for (const required of item.definition.requires ?? []) {
      const dependency = byId.get(required)
      if (!dependency) throw new Error(`Plugin ${item.id} requires missing plugin ${required}`)
      visit(dependency)
    }
    visiting.delete(item.id)
    visited.add(item.id)
    ordered.push(item)
  }
  for (const item of plugins) visit(item)
  return ordered
}

function contributionOf(item: RuntimePlugin): PluginContribution {
  const handler = item.definition.handler as unknown as (args?: unknown) => PluginContribution
  return "args" in item ? handler(item.args) : handler()
}

function composeDatabaseSchema(contributions: readonly { item: RuntimePlugin; contribution: PluginContribution }[]): DeesseDatabaseSchema {
  const models: DeesseDatabaseSchema = {}
  for (const { item, contribution } of contributions) {
    for (const [modelName, model] of Object.entries(contribution.database?.schema ?? {})) {
      if (models[modelName]) throw new Error(`Plugin ${item.id} contributes duplicate database model: ${modelName}`)
      validateModel(item.id, modelName, model)
      models[modelName] = model
    }
  }
  return models
}

function validateModel(pluginId: string, modelName: string, model: DeesseModelDefinition): void {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(modelName)) throw new Error(`Plugin ${pluginId} declares an invalid model name: ${modelName}`)
  if ("id" in model.fields) throw new Error(`Plugin ${pluginId} model ${modelName} cannot declare reserved field id`)
  for (const [fieldName, field] of Object.entries(model.fields)) validateField(pluginId, modelName, fieldName, field)
  for (const index of model.indexes ?? []) validateIndex(pluginId, modelName, model, index.fields)
}

function validateField(pluginId: string, modelName: string, fieldName: string, field: DeesseFieldDefinition): void {
  const prefix = `Plugin ${pluginId} model ${modelName} field ${fieldName}`
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(fieldName)) throw new Error(`Plugin ${pluginId} model ${modelName} has invalid field: ${fieldName}`)
  if (!["string", "text", "integer", "boolean", "timestamp", "date", "json"].includes(field.type)) throw new Error(`${prefix} has an unsupported type`)
  if (field.default === null) throw new Error(`${prefix} uses null as a default`)
  if (field.nullable !== undefined && typeof field.nullable !== "boolean") throw new Error(`${prefix} has invalid nullable setting`)
  if (field.unique !== undefined && typeof field.unique !== "boolean") throw new Error(`${prefix} has invalid unique setting`)
  if (field.columnName !== undefined && typeof field.columnName !== "string") throw new Error(`${prefix} has invalid columnName`)
  if ("default" in field && !defaultMatchesType(field, field.default)) throw new Error(`${prefix} has an invalid default`)
}

function defaultMatchesType(field: DeesseFieldDefinition, value: unknown): boolean {
  switch (field.type) {
    case "string":
    case "text":
      return typeof value === "string"
    case "integer":
      return typeof value === "number" && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
    case "boolean":
      return typeof value === "boolean"
    case "timestamp":
      return typeof value === "string" && !Number.isNaN(Date.parse(value))
    case "date":
      return typeof value === "string" && validCalendarDate(value)
    case "json":
      return isJsonValue(value)
  }
}

function validateIndex(pluginId: string, modelName: string, model: DeesseModelDefinition, fields: readonly string[]): void {
  if (!fields.length) throw new Error(`Plugin ${pluginId} model ${modelName} declares an empty index`)
  const unknownField = fields.find((fieldName) => !(fieldName in model.fields))
  if (unknownField) throw new Error(`Plugin ${pluginId} model ${modelName} index references unknown field: ${unknownField}`)
}

function validCalendarDate(value: string): boolean {
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

export function createRuntime(options: RuntimeOptions): {
  database: RuntimeOptions["database"]["database"]
  auth: unknown
  api: { router: AnyRouter }
  handler: DeesseFetchHandler
} {
  const plugins = orderedPlugins(options.plugins ?? [])
  const contributions = plugins.map((item) => ({ item, contribution: contributionOf(item) }))
  const pluginRouters = Object.fromEntries(contributions.flatMap(({ item, contribution }) =>
    contribution.api?.router ? [[item.id, contribution.api.router]] : []))
  const applicationRouter = options.api?.router ?? {}
  const collisions = Object.keys(pluginRouters).filter((pluginId) => Object.hasOwn(applicationRouter, pluginId))
  if (collisions.length) {
    throw new Error(`Deesse plugin router namespace conflicts with application router key: ${collisions.join(", ")}`)
  }
  const schema = composeDatabaseSchema(contributions)
  options.database.initializeSchema?.(schema)
  const serverPlugins = contributions.flatMap(({ contribution }) => contribution.auth?.serverPlugins ?? [])
  const router = { ...applicationRouter, ...pluginRouters } as AnyRouter
  const authOptions = {
    ...options.auth,
    database: options.database.authAdapter,
    plugins: [...(options.auth.plugins ?? []), ...serverPlugins],
  }
  const auth = betterAuth(authOptions)
  const app = new Hono()
  app.on(["GET", "POST"], `${DEESSE_AUTH_PATH}/*`, (context) => auth.handler(context.req.raw))
  const rpc = new RPCHandler(router)
  app.all(`${DEESSE_RPC_PATH}/*`, async (context) => {
    const getSession = auth.api.getSession as unknown as (input: { headers: Headers }) => Promise<{ session: object; user: object } | null>
    const session = await getSession({ headers: context.req.raw.headers })
    const result = await rpc.handle(context.req.raw, {
      prefix: DEESSE_RPC_PATH,
      context: { database: options.database.database, request: context.req.raw, headers: context.req.raw.headers, session: session?.session ?? null, user: session?.user ?? null },
    })
    return result.matched ? result.response : context.notFound()
  })
  return {
    database: options.database.database,
    auth: auth as unknown,
    api: { router },
    handler: async (request) => app.fetch(request),
  }
}
