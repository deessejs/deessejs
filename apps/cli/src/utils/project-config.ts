import {
  PROJECT_CONFIG_SCHEMA_URL,
  parseProjectConfig,
  type PlannedTemplateFile,
  type TemplateInstallationPlan,
} from "@workspace/registry/v1"
import { templateInvalid } from "../errors/index.js"

type ProjectConfigPreparation = {
  plan: TemplateInstallationPlan
  generated: boolean
}

function isRootProjectConfig(path: string): boolean {
  const normalized = process.platform === "win32" ? path.toLowerCase() : path
  return normalized === "deesse.json"
}

function findProjectConfig(plan: TemplateInstallationPlan) {
  return plan.files.find((file) => isRootProjectConfig(file.path))
}

function createDefaultConfigFile(): PlannedTemplateFile {
  const config = { $schema: PROJECT_CONFIG_SCHEMA_URL, formatVersion: 1 }
  const contents = `${JSON.stringify(config, null, 2)}\n`
  return { path: "deesse.json", contents: new TextEncoder().encode(contents) }
}

function addDefaultProjectConfig(
  plan: TemplateInstallationPlan
): TemplateInstallationPlan {
  return { ...plan, files: [...plan.files, createDefaultConfigFile()] }
}

function invalidUtf8Config(templateSlug: string, error: unknown): never {
  const detail = error instanceof Error ? error.message : String(error)
  throw templateInvalid(
    templateSlug,
    `the root "deesse.json" could not be read as UTF-8 JSON: ${detail}`
  )
}

function decodeConfig(contents: Uint8Array, templateSlug: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(contents)
  } catch (error) {
    invalidUtf8Config(templateSlug, error)
  }
}

function invalidJsonDetail(error: unknown): string {
  if (error instanceof Error && error.name !== "SyntaxError") throw error
  return error instanceof Error ? error.message : String(error)
}

function parseConfig(contents: Uint8Array, templateSlug: string): unknown {
  try {
    return JSON.parse(decodeConfig(contents, templateSlug))
  } catch (error) {
    throw templateInvalid(
      templateSlug,
      `the root "deesse.json" is not valid JSON: ${invalidJsonDetail(error)}`
    )
  }
}

function formatDiagnostic(diagnostic: {
  code: string
  message: string
}): string {
  return `${diagnostic.code}: ${diagnostic.message}`
}

function validateConfig(contents: Uint8Array, templateSlug: string): void {
  const result = parseProjectConfig(parseConfig(contents, templateSlug))
  if (result.success) return
  const details = result.diagnostics.map(formatDiagnostic).join("\n")
  throw templateInvalid(
    templateSlug,
    `the root "deesse.json" is invalid:\n${details}`
  )
}

export function prepareProjectConfig(
  plan: TemplateInstallationPlan,
  templateSlug: string
): ProjectConfigPreparation {
  const configFile = findProjectConfig(plan)
  return configFile
    ? prepareProvidedProjectConfig(plan, configFile.contents, templateSlug)
    : { plan: addDefaultProjectConfig(plan), generated: true }
}

function prepareProvidedProjectConfig(
  plan: TemplateInstallationPlan,
  contents: Uint8Array,
  templateSlug: string
): ProjectConfigPreparation {
  validateConfig(contents, templateSlug)
  return { plan, generated: false }
}
