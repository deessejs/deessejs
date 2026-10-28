import { z } from "zod"

export const PROJECT_CONFIG_SCHEMA_URL =
  "https://app.deessejs.com/schema/project/v1.json"

const ROLE_IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]{0,63}$/
const ROLE_IDENTIFIER_SCHEMA = z.string().regex(ROLE_IDENTIFIER_PATTERN)

const ProjectPathsV1Schema = z.record(
  ROLE_IDENTIFIER_SCHEMA,
  z.string().min(1)
)
const IMPORT_ROOT_SCHEMA = z
  .string()
  .min(1)
  .regex(/^[^\u0000-\u001F\u007F]+$/)
const ProjectAliasesV1Schema = z.record(
  ROLE_IDENTIFIER_SCHEMA,
  IMPORT_ROOT_SCHEMA
)

/**
 * User-owned context for a DeesseJS project.
 *
 * This schema validates the document shape. Path normalization and the
 * relationship between aliases and paths are checked by parseProjectConfig.
 */
export const ProjectConfigV1Schema = z.strictObject({
  $schema: z.literal(PROJECT_CONFIG_SCHEMA_URL).optional(),
  formatVersion: z.literal(1),
  paths: ProjectPathsV1Schema.optional(),
  aliases: ProjectAliasesV1Schema.optional(),
})

export type ProjectConfigV1 = z.infer<typeof ProjectConfigV1Schema>

export type ProjectConfigDiagnosticCode =
  | "project_config.invalid_field"
  | "project_config.unknown_field"
  | "project_config.unsupported_field"
  | "project_config.unsupported_format_version"
  | "project_config.invalid_path"
  | "project_config.alias_without_path"

export type ProjectConfigDiagnostic = {
  code: ProjectConfigDiagnosticCode
  message: string
  path: string[]
}

export type ParseProjectConfigResult =
  | { success: true; data: ProjectConfigV1 }
  | { success: false; diagnostics: ProjectConfigDiagnostic[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isUnsupportedFormatVersion(input: unknown): boolean {
  if (!isRecord(input)) return false
  return (
    typeof input.formatVersion === "number" &&
    input.formatVersion !== 1
  )
}

function normalizeProjectPath(value: string): string | null {
  if (
    value.length === 0 ||
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value) ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.includes("*") ||
    value.includes("?") ||
    value.includes("[") ||
    value.includes("]") ||
    value.includes("{") ||
    value.includes("}")
  ) {
    return null
  }

  const segments = value.split("/").filter((segment) => {
    return segment.length > 0 && segment !== "."
  })

  if (segments.some((segment) => segment === "..")) return null
  return segments.length === 0 ? "." : segments.join("/")
}

function compareDiagnostics(
  left: ProjectConfigDiagnostic,
  right: ProjectConfigDiagnostic
): number {
  const leftPath = left.path.join("/")
  const rightPath = right.path.join("/")
  if (leftPath < rightPath) return -1
  if (leftPath > rightPath) return 1
  if (left.code < right.code) return -1
  if (left.code > right.code) return 1
  return 0
}

/**
 * Validate a parsed JSON value and normalize configured project paths.
 * This function does not access the filesystem, network or process environment.
 */
export function parseProjectConfig(
  input: unknown
): ParseProjectConfigResult {
  const result = ProjectConfigV1Schema.safeParse(input)

  if (!result.success) {
    const diagnostics: ProjectConfigDiagnostic[] = []

    for (const issue of result.error.issues) {
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) {
          const unsupportedRegistryField =
            issue.path.length === 0 && key === "registries"
          diagnostics.push({
            code: unsupportedRegistryField
              ? "project_config.unsupported_field"
              : "project_config.unknown_field",
            message: unsupportedRegistryField
              ? 'The "registries" field is not supported by project config V1.'
              : 'Unknown field "' + key + '".',
            path: [...issue.path.map(String), key],
          })
        }
        continue
      }

      diagnostics.push({
        code:
          issue.path.length === 1 &&
          issue.path[0] === "formatVersion" &&
          isUnsupportedFormatVersion(input)
            ? "project_config.unsupported_format_version"
            : "project_config.invalid_field",
        message: issue.message,
        path: issue.path.map(String),
      })
    }

    diagnostics.sort(compareDiagnostics)
    return { success: false, diagnostics }
  }

  const diagnostics: ProjectConfigDiagnostic[] = []
  const normalizedPaths: Record<string, string> = {}

  for (const [role, path] of Object.entries(result.data.paths ?? {})) {
    const normalized = normalizeProjectPath(path)
    if (normalized === null) {
      diagnostics.push({
        code: "project_config.invalid_path",
        message:
          'Path for role "' +
          role +
          '" must be a safe relative directory path.',
        path: ["paths", role],
      })
      continue
    }
    normalizedPaths[role] = normalized
  }

  for (const role of Object.keys(result.data.aliases ?? {})) {
    if (!Object.hasOwn(result.data.paths ?? {}, role)) {
      diagnostics.push({
        code: "project_config.alias_without_path",
        message:
          'Alias role "' + role + '" must also be declared in paths.',
        path: ["aliases", role],
      })
    }
  }

  if (diagnostics.length > 0) {
    diagnostics.sort(compareDiagnostics)
    return { success: false, diagnostics }
  }

  const data: ProjectConfigV1 = { ...result.data }
  if (result.data.paths !== undefined) data.paths = normalizedPaths
  return { success: true, data }
}
