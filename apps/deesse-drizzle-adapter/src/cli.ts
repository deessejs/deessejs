#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { generateAuthCliConfigSource } from "./auth-config-generator.js"
import type { CliDatabaseSchema, CliPlugin } from "./cli.types.js"
import { generateDrizzleSchemaSource } from "./schema-generator.js"

function readFlag(name: string): string {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  if (!value) throw new Error(`Missing required argument ${name}.`)
  return value
}

function orderPlugins(plugins: readonly CliPlugin[]) {
  const pluginMap = new Map(plugins.map((item) => [item.id, item]))
  if (pluginMap.size !== plugins.length) throw new Error("Plugin IDs must be unique.")
  const ordered: typeof plugins[number][] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (item: typeof plugins[number]): void => {
    if (visited.has(item.id)) return
    if (visiting.has(item.id)) throw new Error(`Plugin dependency cycle at ${item.id}.`)
    visiting.add(item.id)
    for (const required of item.definition.requires ?? []) {
      const dependency = pluginMap.get(required)
      if (!dependency) throw new Error(`Plugin ${item.id} requires missing plugin ${required}.`)
      visit(dependency)
    }
    visiting.delete(item.id)
    visited.add(item.id)
    ordered.push(item)
  }
  for (const item of plugins) visit(item)
  return ordered
}

async function main(): Promise<void> {
  const configPath = resolve(readFlag("--config"))
  const outputPath = resolve(readFlag("--output"))
  const authConfigOutputPath = process.argv.includes("--auth-config-output")
    ? resolve(readFlag("--auth-config-output"))
    : undefined
  const module = await import(pathToFileURL(configPath).href)
  const config = module.deesseConfig ?? module.default
  if (!config || typeof config !== "object") {
    throw new Error("The config module must export deesseConfig or a default Deesse config object.")
  }
  const plugins = Array.isArray(config.plugins) ? config.plugins : []
  const contributions = orderPlugins(plugins).map((item) => {
    const handler = item.definition.handler
    const contribution = "args" in item ? handler(item.args) : handler()
    return { item, contribution }
  })
  const schema: CliDatabaseSchema = {}
  for (const { item, contribution } of contributions) {
    for (const [modelName, model] of Object.entries(contribution.database?.schema ?? {})) {
      if (modelName in schema) throw new Error(`Plugin ${item.id} contributes duplicate model ${modelName}.`)
      schema[modelName] = model
    }
  }
  const source = generateDrizzleSchemaSource(schema)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, source, "utf8")
  process.stdout.write(`Generated Deesse Drizzle schema: ${outputPath}\n`)

  if (authConfigOutputPath) {
    const configImport = relative(dirname(authConfigOutputPath), configPath).split(sep).join("/")
    const configSpecifier = configImport.startsWith(".") ? configImport : `./${configImport}`
    await mkdir(dirname(authConfigOutputPath), { recursive: true })
    await writeFile(authConfigOutputPath, generateAuthCliConfigSource(configSpecifier), "utf8")
    process.stdout.write(`Generated internal Better Auth CLI config: ${authConfigOutputPath}\n`)
  }
}

main().catch((cause: unknown) => {
  process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`)
  process.exitCode = 1
})
