#!/usr/bin/env node
import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { generateAuthCliConfigSource } from "./auth-config-generator.js"
import type { CliDatabaseSchema, CliPlugin } from "./cli.types.js"
import { generateDrizzleSchemaSource } from "./schema-generator.js"

interface CliOptions {
  configPath?: string
  pluginsPath?: string
  outputPath: string
  authConfigOutputPath?: string
  authSchemaPlaceholderPath?: string
}

interface PluginContribution {
  item: CliPlugin
  contribution: ReturnType<CliPlugin["definition"]["handler"]>
}

function readFlag(name: string): string {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  if (!value) throw new Error(`Missing required argument ${name}.`)
  return value
}

function readOptionalFlag(name: string): string | undefined {
  return process.argv.includes(name) ? resolve(readFlag(name)) : undefined
}

function readCliOptions(): CliOptions {
  const configPath = readOptionalFlag("--config")
  const pluginsPath = readOptionalFlag("--plugins")
  if (!configPath && !pluginsPath) throw new Error("Provide --config or --plugins.")

  const authConfigOutputPath = readOptionalFlag("--auth-config-output")
  if (authConfigOutputPath && !configPath) {
    throw new Error("--auth-config-output requires --config.")
  }

  return {
    configPath,
    pluginsPath,
    outputPath: resolve(readFlag("--output")),
    authConfigOutputPath,
    authSchemaPlaceholderPath: readOptionalFlag("--auth-schema-placeholder-output"),
  }
}

async function loadPlugins(options: CliOptions): Promise<readonly CliPlugin[]> {
  const modulePath = options.pluginsPath ?? options.configPath
  if (!modulePath) throw new Error("Provide --config or --plugins.")

  const pluginModule = await import(pathToFileURL(modulePath).href)
  const config = options.pluginsPath ? undefined : pluginModule.deesseConfig ?? pluginModule.default
  const plugins = options.pluginsPath
    ? pluginModule.plugins ?? pluginModule.default
    : Array.isArray(config?.plugins) ? config.plugins : []

  if (!Array.isArray(plugins)) {
    throw new Error("The plugin module must export a plugins array, or the config must export plugins.")
  }
  return plugins as readonly CliPlugin[]
}

function collectContributions(plugins: readonly CliPlugin[]): PluginContribution[] {
  return orderPlugins(plugins).map((item) => {
    const handler = item.definition.handler
    const contribution = "args" in item ? handler(item.args) : handler()
    return { item, contribution }
  })
}

function orderPlugins(plugins: readonly CliPlugin[]): CliPlugin[] {
  const pluginMap = new Map(plugins.map((item) => [item.id, item]))
  if (pluginMap.size !== plugins.length) throw new Error("Plugin IDs must be unique.")
  const ordered: CliPlugin[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (item: CliPlugin): void => {
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

function collectDatabaseSchema(contributions: readonly PluginContribution[]): CliDatabaseSchema {
  const schema: CliDatabaseSchema = {}
  for (const { item, contribution } of contributions) {
    for (const [modelName, model] of Object.entries(contribution.database?.schema ?? {})) {
      if (modelName in schema) throw new Error(`Plugin ${item.id} contributes duplicate model ${modelName}.`)
      schema[modelName] = model
    }
  }
  return schema
}

async function writeSchema(outputPath: string, schema: CliDatabaseSchema): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, generateDrizzleSchemaSource(schema), "utf8")
  process.stdout.write(`Generated Deesse Drizzle schema: ${outputPath}\n`)
}

async function writeAuthSchemaPlaceholder(path: string | undefined): Promise<void> {
  if (!path || existsSync(path)) return
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, "export {}\n", "utf8")
  process.stdout.write(`Created temporary Better Auth schema bootstrap: ${path}\n`)
}

async function writeAuthConfig(options: CliOptions): Promise<void> {
  if (!options.authConfigOutputPath) return
  if (!options.configPath) throw new Error("--auth-config-output requires --config.")

  const configImport = relative(dirname(options.authConfigOutputPath), options.configPath).split(sep).join("/")
  const configSpecifier = configImport.startsWith(".") ? configImport : `./${configImport}`
  await mkdir(dirname(options.authConfigOutputPath), { recursive: true })
  await writeFile(options.authConfigOutputPath, generateAuthCliConfigSource(configSpecifier), "utf8")
  process.stdout.write(`Generated internal Better Auth CLI config: ${options.authConfigOutputPath}\n`)
}

async function main(): Promise<void> {
  const options = readCliOptions()
  const plugins = await loadPlugins(options)
  const contributions = collectContributions(plugins)
  await writeSchema(options.outputPath, collectDatabaseSchema(contributions))
  await writeAuthSchemaPlaceholder(options.authSchemaPlaceholderPath)
  await writeAuthConfig(options)
}

main().catch((cause: unknown) => {
  process.stderr.write(`${cause instanceof Error ? cause.message : String(cause)}\n`)
  process.exitCode = 1
})
