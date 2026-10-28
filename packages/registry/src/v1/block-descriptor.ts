import { z } from "zod"

export const BLOCK_DESCRIPTOR_SCHEMA_URL =
  "https://app.deessejs.com/schema/block/v1.json"

const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*$/

const PackageOutputV1Schema = z.strictObject({
  id: z.string().regex(IDENTIFIER_PATTERN),
  path: z.string().min(1),
})

const BlockFileTargetV1Schema = z.strictObject({
  package: z.string().regex(IDENTIFIER_PATTERN),
  path: z.string().min(1),
})

const BlockFileV1Schema = z.strictObject({
  from: z.string().min(1),
  to: BlockFileTargetV1Schema,
})

const EnvironmentVariableV1Schema = z.strictObject({
  name: z.string().min(1),
  required: z.boolean(),
  secret: z.boolean(),
  description: z.string().min(1).optional(),
})

const BlockCapabilityV1Schema = z.strictObject({
  capability: z.string().min(1),
  provider: z.string().min(1),
  package: z.string().regex(IDENTIFIER_PATTERN),
})

/**
 * Author-owned manifest for a copy-first DeesseJS block.
 *
 * This schema validates the descriptor structure. Asset existence, package
 * manifests, destination conflicts and project-specific package-manager
 * changes are validated by the block source and installation layers.
 */
export const BlockDescriptorV1Schema = z.strictObject({
  $schema: z.literal(BLOCK_DESCRIPTOR_SCHEMA_URL),
  formatVersion: z.literal(1),
  name: z.string().regex(IDENTIFIER_PATTERN),
  version: z.string().regex(SEMVER_PATTERN),
  description: z.string().min(1),
  provides: z.array(BlockCapabilityV1Schema).min(1),
  install: z.strictObject({
    packages: z.array(PackageOutputV1Schema).min(1),
    files: z.array(BlockFileV1Schema).min(1),
    environment: z.array(EnvironmentVariableV1Schema).optional(),
    manualSteps: z.array(z.string().min(1)).optional(),
  }),
})

export type BlockDescriptorV1 = z.infer<typeof BlockDescriptorV1Schema>

export type BlockDescriptorDiagnosticCode =
  | "descriptor.invalid_field"
  | "descriptor.unknown_field"
  | "descriptor.unsupported_format_version"
  | "descriptor.invalid_path"
  | "descriptor.duplicate_package_id"
  | "descriptor.duplicate_package_path"
  | "descriptor.duplicate_file_source"
  | "descriptor.duplicate_destination"
  | "descriptor.unresolved_package"
  | "descriptor.missing_package_manifest"
  | "descriptor.duplicate_capability"
  | "descriptor.duplicate_environment_name"

export type BlockDescriptorDiagnostic = {
  code: BlockDescriptorDiagnosticCode
  message: string
  path: string[]
}

export type ParseBlockDescriptorResult =
  | { success: true; data: BlockDescriptorV1 }
  | { success: false; diagnostics: BlockDescriptorDiagnostic[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSafeRelativePath(value: string): boolean {
  if (!value) return false
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false
  if (value.includes("\\") || value.includes("\0")) return false

  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..")
}

function areValidIdentifiers(
  value: string,
  disallowLeadingZeroes: boolean
): boolean {
  return value.split(".").every((identifier) => {
    if (!identifier || !/^[0-9A-Za-z-]+$/.test(identifier)) return false
    const numeric = /^\d+$/.test(identifier)
    return !(
      disallowLeadingZeroes &&
      numeric &&
      identifier.length > 1 &&
      identifier.startsWith("0")
    )
  })
}

function isValidSemver(value: string): boolean {
  const parts = value.split("+")
  if (parts.length > 2) return false

  const version = parts[0] ?? ""
  const build = parts[1]
  if (build !== undefined && !areValidIdentifiers(build, false)) return false

  const versionParts = version.split("-")
  const core = versionParts[0] ?? ""
  const prerelease = versionParts.slice(1).join("-")
  if (versionParts.length > 1 && !areValidIdentifiers(prerelease, true)) {
    return false
  }

  const numbers = core.split(".")
  return (
    numbers.length === 3 &&
    numbers.every((number) => /^(0|[1-9]\d*)$/.test(number))
  )
}

function getSchemaDiagnostics(
  input: unknown,
  error: z.ZodError
): BlockDescriptorDiagnostic[] {
  const diagnostics: BlockDescriptorDiagnostic[] = []

  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      diagnostics.push(
        ...issue.keys.map((key) => ({
          code: "descriptor.unknown_field" as const,
          message: `Unknown field "${key}".`,
          path: [...issue.path.map(String), key],
        }))
      )
      continue
    }

    const unsupportedFormat = isUnsupportedFormatVersion(issue.path, input)

    diagnostics.push({
      code: unsupportedFormat
        ? "descriptor.unsupported_format_version"
        : "descriptor.invalid_field",
      message: issue.message,
      path: issue.path.map(String),
    })
  }

  return diagnostics
}

function isUnsupportedFormatVersion(
  path: PropertyKey[],
  input: unknown
): boolean {
  if (path.length !== 1 || path[0] !== "formatVersion") return false
  if (!isRecord(input)) return false
  if (typeof input.formatVersion !== "number") return false
  return input.formatVersion !== 1
}

function validatePackages(
  descriptor: BlockDescriptorV1,
  diagnostics: BlockDescriptorDiagnostic[]
): Set<string> {
  const packageIds = new Set<string>()
  const packagePaths = new Set<string>()

  for (const [index, output] of descriptor.install.packages.entries()) {
    if (packageIds.has(output.id)) {
      diagnostics.push({
        code: "descriptor.duplicate_package_id",
        message: `Package id "${output.id}" is declared more than once.`,
        path: ["install", "packages", String(index), "id"],
      })
    }
    packageIds.add(output.id)

    if (!isSafeRelativePath(output.path)) {
      diagnostics.push({
        code: "descriptor.invalid_path",
        message: `Package path "${output.path}" must be a safe relative path.`,
        path: ["install", "packages", String(index), "path"],
      })
    }
    if (packagePaths.has(output.path)) {
      diagnostics.push({
        code: "descriptor.duplicate_package_path",
        message: `Package path "${output.path}" is declared more than once.`,
        path: ["install", "packages", String(index), "path"],
      })
    }
    packagePaths.add(output.path)
  }

  return packageIds
}

function validateFiles(
  descriptor: BlockDescriptorV1,
  packageIds: Set<string>,
  diagnostics: BlockDescriptorDiagnostic[]
): void {
  const sourceFiles = new Set<string>()
  const destinations = new Set<string>()

  for (const [index, file] of descriptor.install.files.entries()) {
    if (!isSafeRelativePath(file.from)) {
      diagnostics.push({
        code: "descriptor.invalid_path",
        message: `Source path "${file.from}" must be a safe relative path.`,
        path: ["install", "files", String(index), "from"],
      })
    }
    if (sourceFiles.has(file.from)) {
      diagnostics.push({
        code: "descriptor.duplicate_file_source",
        message: `Source file "${file.from}" is declared more than once.`,
        path: ["install", "files", String(index), "from"],
      })
    }
    sourceFiles.add(file.from)

    if (!packageIds.has(file.to.package)) {
      diagnostics.push({
        code: "descriptor.unresolved_package",
        message: `File target references undeclared package "${file.to.package}".`,
        path: ["install", "files", String(index), "to", "package"],
      })
    }
    if (!isSafeRelativePath(file.to.path)) {
      diagnostics.push({
        code: "descriptor.invalid_path",
        message: `Destination path "${file.to.path}" must be a safe relative path.`,
        path: ["install", "files", String(index), "to", "path"],
      })
    }

    const destination = file.to.package + "/" + file.to.path
    if (destinations.has(destination)) {
      diagnostics.push({
        code: "descriptor.duplicate_destination",
        message: `Destination "${destination}" is declared more than once.`,
        path: ["install", "files", String(index), "to"],
      })
    }
    destinations.add(destination)
  }
}

function validatePackageManifests(
  descriptor: BlockDescriptorV1,
  diagnostics: BlockDescriptorDiagnostic[]
): void {
  for (const [index, output] of descriptor.install.packages.entries()) {
    const hasManifest = descriptor.install.files.some(
      (file) => file.to.package === output.id && file.to.path === "package.json"
    )
    if (!hasManifest) {
      diagnostics.push({
        code: "descriptor.missing_package_manifest",
        message: `Package "${output.id}" must copy a package.json file.`,
        path: ["install", "packages", String(index)],
      })
    }
  }
}

function validateCapabilities(
  descriptor: BlockDescriptorV1,
  packageIds: Set<string>,
  diagnostics: BlockDescriptorDiagnostic[]
): void {
  const capabilities = new Set<string>()

  for (const [index, item] of descriptor.provides.entries()) {
    if (!packageIds.has(item.package)) {
      diagnostics.push({
        code: "descriptor.unresolved_package",
        message: `Capability declaration references undeclared package "${item.package}".`,
        path: ["provides", String(index), "package"],
      })
    }

    const key = item.capability + "\0" + item.provider + "\0" + item.package
    if (capabilities.has(key)) {
      diagnostics.push({
        code: "descriptor.duplicate_capability",
        message: `Capability "${item.capability}" from "${item.provider}" is declared more than once for package "${item.package}".`,
        path: ["provides", String(index)],
      })
    }
    capabilities.add(key)
  }
}

function validateEnvironment(
  descriptor: BlockDescriptorV1,
  diagnostics: BlockDescriptorDiagnostic[]
): void {
  const environmentNames = new Set<string>()

  for (const [index, variable] of (
    descriptor.install.environment ?? []
  ).entries()) {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(variable.name)) {
      diagnostics.push({
        code: "descriptor.invalid_field",
        message: `Environment variable "${variable.name}" must use uppercase letters, numbers and underscores.`,
        path: ["install", "environment", String(index), "name"],
      })
    }
    if (environmentNames.has(variable.name)) {
      diagnostics.push({
        code: "descriptor.duplicate_environment_name",
        message: `Environment variable "${variable.name}" is declared more than once.`,
        path: ["install", "environment", String(index), "name"],
      })
    }
    environmentNames.add(variable.name)
  }
}

/**
 * Validate a parsed JSON value and reject paths that can escape the block
 * source or a declared package destination.
 */
export function parseBlockDescriptor(
  input: unknown
): ParseBlockDescriptorResult {
  const result = BlockDescriptorV1Schema.safeParse(input)
  if (!result.success) {
    return {
      success: false,
      diagnostics: getSchemaDiagnostics(input, result.error),
    }
  }

  const descriptor = result.data
  const diagnostics: BlockDescriptorDiagnostic[] = []
  if (!isValidSemver(descriptor.version)) {
    diagnostics.push({
      code: "descriptor.invalid_field",
      message: "Version must be a valid SemVer version.",
      path: ["version"],
    })
  }

  const packageIds = validatePackages(descriptor, diagnostics)
  validateFiles(descriptor, packageIds, diagnostics)
  validatePackageManifests(descriptor, diagnostics)
  validateCapabilities(descriptor, packageIds, diagnostics)
  validateEnvironment(descriptor, diagnostics)

  return diagnostics.length > 0
    ? { success: false, diagnostics }
    : { success: true, data: descriptor }
}
