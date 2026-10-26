import { z } from "zod"

export const TEMPLATE_DESCRIPTOR_SCHEMA_URL =
  "https://app.deessejs.com/schema/template/v1.json"

export const TEMPLATE_PROJECT_TYPES = [
  "template:app",
  "template:package",
  "template:cli",
  "template:mobile",
  "template:desktop",
  "template:agent",
  "template:landing",
  "template:starter",
] as const

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

const TemplateSourceV1Schema = z.strictObject({
  repo: z.string().min(1),
  ref: z.string().min(1).optional(),
})

/**
 * Author-owned manifest for a DeesseJS whole-project template.
 *
 * This schema validates structure only. Source consistency, file selection,
 * source inventory and destination safety belong to the shared interpreter.
 */
export const TemplateDescriptorV1Schema = z.strictObject({
  $schema: z.literal(TEMPLATE_DESCRIPTOR_SCHEMA_URL),
  formatVersion: z.literal(1),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(TEMPLATE_PROJECT_TYPES),
  version: z.string().regex(SEMVER_PATTERN),
  source: TemplateSourceV1Schema.optional(),
  includes: z.array(z.string()).min(1).optional(),
  excludes: z.array(z.string()),
  author: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  labels: z.array(z.string()).optional(),
})

export type TemplateDescriptorV1 = z.infer<typeof TemplateDescriptorV1Schema>

export type NormalizedTemplateDescriptorV1 = Omit<
  TemplateDescriptorV1,
  "includes"
> & {
  includes: string[]
}

export type TemplateDescriptorDiagnosticCode =
  | "descriptor.invalid_field"
  | "descriptor.unknown_field"
  | "descriptor.unsupported_format_version"

export type TemplateDescriptorDiagnostic = {
  code: TemplateDescriptorDiagnosticCode
  message: string
  path: string[]
}

export type ParseTemplateDescriptorResult =
  | { success: true; data: NormalizedTemplateDescriptorV1 }
  | { success: false; diagnostics: TemplateDescriptorDiagnostic[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Validate a parsed JSON value and apply the V1 includes default.
 *
 * The default is applied here instead of in the Zod schema so the generated
 * JSON Schema describes the author input accurately: includes remains optional.
 */
export function parseTemplateDescriptor(
  input: unknown,
): ParseTemplateDescriptorResult {
  const result = TemplateDescriptorV1Schema.safeParse(input)

  if (!result.success) {
    const diagnostics = result.error.issues.flatMap((issue) => {
      if (issue.code === "unrecognized_keys") {
        return issue.keys.map((key) => ({
          code: "descriptor.unknown_field" as const,
          message: `Unknown field "${key}".`,
          path: [...issue.path.map(String), key],
        }))
      }

      const isUnsupportedFormatVersion =
        issue.path.length === 1 &&
        issue.path[0] === "formatVersion" &&
        isRecord(input) &&
        typeof input.formatVersion === "number" &&
        input.formatVersion !== 1

      return [
        {
          code: isUnsupportedFormatVersion
            ? ("descriptor.unsupported_format_version" as const)
            : ("descriptor.invalid_field" as const),
          message: issue.message,
          path: issue.path.map(String),
        },
      ]
    })

    return { success: false, diagnostics }
  }

  return {
    success: true,
    data: {
      ...result.data,
      includes: result.data.includes ?? ["**/*"],
    },
  }
}
