#!/usr/bin/env node
import { existsSync } from "node:fs"
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
  const configIndex = process.argv.indexOf("--config")
  const configPath = configIndex >= 0 ? resolve(readFlag("--config")) : undefined
  const pluginsIndex = process.argv.indexOf("--plugins")
  const pluginsPath = pluginsIndex >= 0 ? resolve(readFlag("--plugins")) : undefined
  if (!configPath && !pluginsPath) throw new Error("Provide --config or --plugins.")
  const outputPath = resolve(readFlag("--output"))
  const authConfigOutputPath = process.argv.includes("--auth-config-output")
    ? resolve(readFlag("--auth-config-output"))
    : undefined
  const authSchemaPlaceholderPath = process.argv.includes("--auth-schema-placeholder-output")
    ? resolve(readFlag("--auth-schema-placeholder-output"))
    : undefined
  if (authConfigOutputPath && !configPath) {
    throw new Error("--auth-config-output requires --config.")
  }
  const pluginModule = await import(pathToFileURL(pluginsPath ?? configPath!).href)
  const configModule = pluginsPath ? undefined : pluginModule
  const config = configModule?.deesseConfig ?? configModule?.default
  const plugins = pluginsPath
    ? pluginModule.plugins ?? pluginModule.default
    : Array.isArray(config?.plugins) ? config.plugins : []
  if (!Array.isArray(plugins)) {
    throw new Error("The plugin module must export a plugins array, or the config must export plugins.")
  }
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

  if (authSchemaPlaceholderPath && !existsSync(authSchemaPlaceholderPath)) {
    await mkdir(dirname(authSchemaPlaceholderPath), { recursive: true })
    await writeFile(authSchemaPlaceholderPath, "export {}\n", "utf8")
    process.stdout.write(`Created temporary Better Auth schema bootstrap: ${authSchemaPlaceholderPath}\n`)
  }

  if (authConfigOutputPath) {
    const configImport = relative(dirname(authConfigOutputPath), configPath!).split(sep).join("/")
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
