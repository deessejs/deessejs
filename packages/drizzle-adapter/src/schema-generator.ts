import type { DeesseDatabaseSchema, DeesseFieldDefinition } from "deesse"

function assertIntegerDefault(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
    throw new Error("Integer defaults must fit PostgreSQL integer.")
  }
  return value
}

function assertBooleanDefault(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Boolean defaults must be booleans.")
  return value
}

function escapeSqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function sqlLiteral(field: DeesseFieldDefinition, value: unknown): string {
  switch (field.type) {
    case "integer":
      return String(assertIntegerDefault(value))
    case "boolean":
      return String(assertBooleanDefault(value))
    case "json": {
      const serialized = JSON.stringify(value)
      if (serialized === undefined) throw new Error("JSON defaults must be JSON serializable.")
      return `${escapeSqlString(serialized)}::jsonb`
    }
    case "string":
    case "text":
    case "timestamp":
    case "date":
      if (typeof value !== "string") throw new Error("Text and temporal defaults must be strings.")
      if (field.type === "date" && !isCalendarDate(value)) throw new Error("Date defaults must use a valid YYYY-MM-DD date.")
      if (field.type === "timestamp" && Number.isNaN(Date.parse(value))) throw new Error("Timestamp defaults must be valid date strings.")
      return escapeSqlString(value)
  }
}

function columnBuilder(field: DeesseFieldDefinition): string {
  switch (field.type) {
    case "string":
    case "text":
      return "text"
    case "integer":
      return "integer"
    case "boolean":
      return "boolean"
    case "timestamp":
      return "timestamp"
    case "date":
      return "date"
    case "json":
      return "jsonb"
  }
}

function columnOptions(field: DeesseFieldDefinition): string {
  if (field.type === "timestamp") return ', { withTimezone: true, mode: "date" }'
  if (field.type === "date") return ', { mode: "string" }'
  return ""
}

function columnModifiers(field: DeesseFieldDefinition): string {
  const modifiers: string[] = []
  if (field.nullable !== true) modifiers.push(".notNull()")
  if (field.unique === true) modifiers.push(".unique()")
  if ("default" in field) modifiers.push(`.default(sql.raw(${JSON.stringify(sqlLiteral(field, field.default))}))`)
  return modifiers.join("")
}

function columnSource(fieldName: string, field: DeesseFieldDefinition): string {
  const columnName = JSON.stringify(field.columnName ?? fieldName)
  return `${JSON.stringify(fieldName)}: ${columnBuilder(field)}(${columnName}${columnOptions(field)})${columnModifiers(field)}`
}

function indexSource(modelName: string, fields: Record<string, DeesseFieldDefinition>, indexes: NonNullable<DeesseDatabaseSchema[string]["indexes"]>): string[] {
  return indexes.map((item, index) => {
    if (!item.fields.length) throw new Error(`Index ${item.name ?? index} on ${modelName} must include a field.`)
    const unknownField = item.fields.find((fieldName) => !(fieldName in fields))
    if (unknownField) throw new Error(`Index ${item.name ?? index} on ${modelName} references unknown field ${unknownField}.`)
    const name = item.name ?? `deesse_${modelName}_${item.fields.join("_")}_${index}`
    const builder = item.unique ? "uniqueIndex" : "index"
    const columns = item.fields.map((fieldName) => `table[${JSON.stringify(fieldName)}]`).join(", ")
    return `    ${builder}(${JSON.stringify(name)}).on(${columns}),`
  })
}

function tableSource(modelName: string, model: DeesseDatabaseSchema[string]): string {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(modelName)) throw new Error(`Invalid Deesse model identifier: ${modelName}`)
  if ("id" in model.fields) throw new Error(`Model ${modelName} cannot declare the generated id field.`)
  const columns = Object.entries(model.fields).map(([name, field]) => `    ${columnSource(name, field)},`)
  const id = '    id: uuid("id").defaultRandom().primaryKey(),'
  const indexes = indexSource(modelName, model.fields, model.indexes ?? [])
  const extras = indexes.length ? `,\n  (table) => [\n${indexes.join("\n")}\n  ]` : ""
  return `export const ${modelName} = pgTable(${JSON.stringify(modelName)}, {\n${[id, ...columns].join("\n")}\n}${extras})`
}

function importForField(field: DeesseFieldDefinition): string {
  return columnBuilder(field)
}

function collectImports(schema: DeesseDatabaseSchema): Set<string> {
  const imports = new Set(["pgTable", "uuid"])
  for (const model of Object.values(schema)) {
    for (const field of Object.values(model.fields)) imports.add(importForField(field))
    for (const index of model.indexes ?? []) imports.add(index.unique ? "uniqueIndex" : "index")
  }
  return imports
}

function schemaNeedsSql(schema: DeesseDatabaseSchema): boolean {
  return Object.values(schema).some((model) => Object.values(model.fields).some((field) => "default" in field))
}

export function generateDrizzleSchemaSource(schema: DeesseDatabaseSchema): string {
  const imports = collectImports(schema)
  const lines = [`import { ${[...imports].join(", ")} } from "drizzle-orm/pg-core"`]
  if (schemaNeedsSql(schema)) lines.push('import { sql } from "drizzle-orm"')
  lines.push("")
  for (const [modelName, model] of Object.entries(schema)) {
    lines.push(tableSource(modelName, model), "")
  }
  return lines.join("\n")
}
