import { error, type ErrorInstance } from "@deessejs/errors"
import { err, flatMap, map, ok, pipe, type Result } from "@deessejs/fp"
import {
  PROJECT_CONFIG_SCHEMA_URL,
  parseProjectConfig,
  type PlannedTemplateFile,
  type ProjectConfigV1,
  type TemplateInstallationPlan,
} from "@workspace/registry/v1"

type ProjectConfigPreparation = {
  plan: TemplateInstallationPlan
  generated: boolean
}

type ProjectConfigErrorStage = "utf8" | "json" | "schema"

type ProjectConfigErrorFields = {
  stage: ProjectConfigErrorStage
  detail: string
}

type ProjectConfigFailure = ErrorInstance<ProjectConfigErrorFields>

const ProjectConfigError = error<ProjectConfigErrorFields>({
  name: "ProjectConfigError",
  message: "Project config {stage} validation failed: {detail}",
})

const isRootProjectConfig = (path: string): boolean => {
  const normalized = process.platform === "win32" ? path.toLowerCase() : path
  return normalized === "deesse.json"
}

const findProjectConfig = (plan: TemplateInstallationPlan) => {
  return plan.files.find((file) => isRootProjectConfig(file.path))
}

const createDefaultConfigFile = (): PlannedTemplateFile => {
  const config = { $schema: PROJECT_CONFIG_SCHEMA_URL, formatVersion: 1 }
  const contents = `${JSON.stringify(config, null, 2)}\n`
  return { path: "deesse.json", contents: new TextEncoder().encode(contents) }
}

const addDefaultProjectConfig = (
  plan: TemplateInstallationPlan
): TemplateInstallationPlan => {
  return { ...plan, files: [...plan.files, createDefaultConfigFile()] }
}

const asError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value))

const projectConfigFailure = (
  stage: ProjectConfigErrorStage,
  detail: string,
  cause?: Error
): ProjectConfigFailure => {
  const failure = ProjectConfigError({ stage, detail })
  return cause ? failure.from(cause) : failure
}

const decodeConfig = (
  contents: Uint8Array
): Result<string, ProjectConfigFailure> => {
  try {
    return ok(new TextDecoder("utf-8", { fatal: true }).decode(contents))
  } catch (error) {
    const cause = asError(error)
    return err(projectConfigFailure("utf8", cause.message, cause))
  }
}

const parseJson = (text: string): Result<unknown, ProjectConfigFailure> => {
  try {
    return ok(JSON.parse(text))
  } catch (error) {
    const cause = asError(error)
    return err(projectConfigFailure("json", cause.message, cause))
  }
}

const formatDiagnostic = (diagnostic: {
  code: string
  message: string
}): string => {
  return `${diagnostic.code}: ${diagnostic.message}`
}

const validateConfig = (
  input: unknown
): Result<ProjectConfigV1, ProjectConfigFailure> => {
  const result = parseProjectConfig(input)
  if (result.success) return ok(result.data)
  const details = result.diagnostics.map(formatDiagnostic).join("\n")
  return err(projectConfigFailure("schema", details))
}

const readProjectConfig = (
  contents: Uint8Array
): Result<ProjectConfigV1, ProjectConfigFailure> =>
  pipe(contents, decodeConfig, flatMap(parseJson), flatMap(validateConfig))

const preserveProjectConfig = (
  plan: TemplateInstallationPlan,
  contents: Uint8Array
): Result<ProjectConfigPreparation, ProjectConfigFailure> =>
  pipe(
    readProjectConfig(contents),
    map(() => ({ plan, generated: false }))
  )

export const resolveProjectConfig = (
  plan: TemplateInstallationPlan
): Result<ProjectConfigPreparation, ProjectConfigFailure> => {
  const configFile = findProjectConfig(plan)
  if (!configFile) {
    return ok({ plan: addDefaultProjectConfig(plan), generated: true })
  }
  return preserveProjectConfig(plan, configFile.contents)
}
