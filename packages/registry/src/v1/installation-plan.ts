import picomatch from "picomatch"
import {
  parseTemplateDescriptor,
  type NormalizedTemplateDescriptorV1,
  type TemplateDescriptorDiagnostic,
} from "./template-descriptor.js"
import {
  isTemplateSourceError,
  type TemplateSourceAdapter,
  type TemplateSourceDiagnosticCode,
  type TemplateSourceEntry,
  type TemplateDescriptorSourceSnapshot,
  type TemplateSourceRequest,
  type TemplateSourceSnapshot,
} from "./template-source.js"

const DESCRIPTOR_PATH = "deesse-template.json"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024

export type TemplateInstallationDiagnosticCode =
  | TemplateSourceDiagnosticCode
  | TemplateDescriptorDiagnostic["code"]
  | "descriptor.missing"
  | "descriptor.invalid_json"
  | "descriptor.source_mismatch"
  | "descriptor.source_ref_mismatch"
  | "source.unsafe_path"
  | "source.symlink"
  | "source.unsupported_entry"
  | "selection.invalid_pattern"
  | "selection.empty"
  | "source.total_size_exceeded"

export type TemplateInstallationDiagnostic = {
  code: TemplateInstallationDiagnosticCode
  message: string
  path: string[]
}

export type PlannedTemplateFile = {
  path: string
  contents: Uint8Array
}

export type TemplateInstallationPlan = {
  source: {
    repository: string
    revision: string
  }
  descriptor: NormalizedTemplateDescriptorV1
  files: PlannedTemplateFile[]
}

export type CreateTemplateInstallationPlanResult =
  | { success: true; plan: TemplateInstallationPlan }
  | { success: false; diagnostics: TemplateInstallationDiagnostic[] }

export type TemplateDescriptorInfo = {
  source: { repository: string }
  descriptor: NormalizedTemplateDescriptorV1
}

export type CreateTemplateDescriptorInfoResult =
  | { success: true; info: TemplateDescriptorInfo }
  | { success: false; diagnostics: TemplateInstallationDiagnostic[] }

function diagnostic(
  code: TemplateInstallationDiagnosticCode,
  message: string,
  path: string[] = []
): TemplateInstallationDiagnostic {
  return { code, message, path }
}

function compareDiagnostics(
  left: TemplateInstallationDiagnostic,
  right: TemplateInstallationDiagnostic
): number {
  const leftPath = left.path.join("/")
  const rightPath = right.path.join("/")
  return (
    compareStrings(leftPath, rightPath) || compareStrings(left.code, right.code)
  )
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function isSafeRelativePath(path: string): boolean {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0") ||
    /^[a-z]:/i.test(path)
  ) {
    return false
  }

  const segments = path.split("/")
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== ".."
  )
}

function isSafePattern(pattern: string): boolean {
  if (
    pattern.length === 0 ||
    pattern.startsWith("/") ||
    pattern.includes("\\") ||
    /^[a-z]:/i.test(pattern)
  ) {
    return false
  }

  return pattern.split("/").every((segment) => segment !== "..")
}

function makeMatchers(patterns: string[]): {
  matchers: Array<(path: string) => boolean>
  diagnostics: TemplateInstallationDiagnostic[]
} {
  const matchers: Array<(path: string) => boolean> = []
  const diagnostics: TemplateInstallationDiagnostic[] = []

  for (const pattern of patterns) {
    if (!isSafePattern(pattern)) {
      diagnostics.push(
        diagnostic(
          "selection.invalid_pattern",
          `The selection pattern "${pattern}" must be a non-empty relative glob without traversal segments.`,
          [pattern]
        )
      )
      continue
    }

    try {
      matchers.push(picomatch(pattern, { dot: true, posix: true }))
    } catch {
      diagnostics.push(
        diagnostic(
          "selection.invalid_pattern",
          `The selection pattern "${pattern}" is not a valid Picomatch glob.`,
          [pattern]
        )
      )
    }
  }

  return { matchers, diagnostics }
}

function matchesAny(
  matchers: Array<(path: string) => boolean>,
  path: string
): boolean {
  return matchers.some((matches) => matches(path))
}

function findDescriptor(
  snapshot: TemplateSourceSnapshot
): TemplateSourceEntry | undefined {
  return snapshot.entries.find(
    (entry) => entry.path === DESCRIPTOR_PATH && entry.type === "blob"
  )
}

function normalizeRepository(repository: string): string | null {
  const match = /^([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)$/.exec(repository)
  const owner = match?.[1]
  const name = match?.[2]
  if (!owner || !name || owner === "." || name === "." || name === "..")
    return null
  return `${owner.toLowerCase()}/${name.toLowerCase()}`
}

type ReadDescriptorResult =
  | { success: true; input: unknown }
  | { success: false; diagnostic: TemplateInstallationDiagnostic }

async function readDescriptor(
  snapshot: TemplateSourceSnapshot
): Promise<ReadDescriptorResult> {
  const entry = findDescriptor(snapshot)
  if (!entry) {
    return {
      success: false,
      diagnostic: diagnostic(
        "descriptor.missing",
        `The source snapshot does not contain a root ${DESCRIPTOR_PATH}.`,
        [DESCRIPTOR_PATH]
      ),
    }
  }
  if (entry.mode === "120000") {
    return {
      success: false,
      diagnostic: diagnostic(
        "source.symlink",
        `The root ${DESCRIPTOR_PATH} must be a regular file, not a symbolic link.`,
        [DESCRIPTOR_PATH]
      ),
    }
  }

  try {
    const bytes = await snapshot.readFile(DESCRIPTOR_PATH)
    return parseDescriptorBytes(bytes)
  } catch (error) {
    if (isTemplateSourceError(error)) throw error
    return {
      success: false,
      diagnostic: diagnostic(
        "descriptor.invalid_json",
        `The root ${DESCRIPTOR_PATH} is not valid UTF-8 JSON: ${String(error)}.`,
        [DESCRIPTOR_PATH]
      ),
    }
  }
}

function parseDescriptorBytes(bytes: Uint8Array): ReadDescriptorResult {
  try {
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return { success: true, input: JSON.parse(json) as unknown }
  } catch (error) {
    return {
      success: false,
      diagnostic: diagnostic(
        "descriptor.invalid_json",
        `The root ${DESCRIPTOR_PATH} is not valid UTF-8 JSON: ${String(error)}.`,
        [DESCRIPTOR_PATH]
      ),
    }
  }
}

function validateDescriptorSource(
  descriptor: NormalizedTemplateDescriptorV1,
  request: TemplateSourceRequest,
  snapshot: Pick<TemplateSourceSnapshot, "repository">
): TemplateInstallationDiagnostic[] {
  const diagnostics: TemplateInstallationDiagnostic[] = []
  const expectedRepository = normalizeRepository(request.repository)
  const actualRepository = descriptor.source
    ? normalizeRepository(descriptor.source.repo)
    : null

  if (
    descriptor.source &&
    (!actualRepository || actualRepository !== expectedRepository)
  ) {
    diagnostics.push(
      diagnostic(
        "descriptor.source_mismatch",
        `The descriptor declares source repository "${descriptor.source.repo}", but the selected source is "${snapshot.repository}".`,
        ["source", "repo"]
      )
    )
  }

  return diagnostics
}

async function validateDescriptorRef(
  descriptor: NormalizedTemplateDescriptorV1,
  snapshot: Pick<TemplateSourceSnapshot, "repository" | "revision">,
  resolveRevision: (repository: string, ref: string) => Promise<string>
): Promise<TemplateInstallationDiagnostic[]> {
  if (!descriptor.source?.ref) return []

  try {
    const descriptorRevision = await resolveRevision(
      snapshot.repository,
      descriptor.source.ref
    )
    if (descriptorRevision === snapshot.revision) return []
    return [
      diagnostic(
        "descriptor.source_ref_mismatch",
        `The descriptor ref "${descriptor.source.ref}" resolves to ${descriptorRevision}, while the selected source resolves to ${snapshot.revision}.`,
        ["source", "ref"]
      ),
    ]
  } catch (error) {
    return [
      diagnostic(
        "descriptor.source_ref_mismatch",
        `The descriptor ref "${descriptor.source.ref}" could not be resolved against the selected repository: ${String(error)}.`,
        ["source", "ref"]
      ),
    ]
  }
}

function selectEntries(
  descriptor: NormalizedTemplateDescriptorV1,
  entries: readonly TemplateSourceEntry[]
): {
  selected: TemplateSourceEntry[]
  diagnostics: TemplateInstallationDiagnostic[]
} {
  const includeResult = makeMatchers(descriptor.includes)
  const excludeResult = makeMatchers(descriptor.excludes)
  const diagnostics = [
    ...includeResult.diagnostics,
    ...excludeResult.diagnostics,
  ]
  if (diagnostics.length > 0) return { selected: [], diagnostics }

  const selected: TemplateSourceEntry[] = []
  for (const entry of entries) {
    if (entry.type === "tree") continue
    if (!matchesAny(includeResult.matchers, entry.path)) continue
    if (matchesAny(excludeResult.matchers, entry.path)) continue

    if (!isSafeRelativePath(entry.path)) {
      diagnostics.push(
        diagnostic(
          "source.unsafe_path",
          `Selected source path "${entry.path}" is not a safe relative file path.`,
          [entry.path]
        )
      )
      continue
    }
    if (entry.mode === "120000") {
      diagnostics.push(
        diagnostic(
          "source.symlink",
          `Selected source path "${entry.path}" is a symbolic link.`,
          [entry.path]
        )
      )
      continue
    }
    if (entry.type === "commit") {
      diagnostics.push(
        diagnostic(
          "source.unsupported_entry",
          `Selected source path "${entry.path}" is a Git submodule, which V1 does not copy.`,
          [entry.path]
        )
      )
      continue
    }
    if (entry.mode !== "100644" && entry.mode !== "100755") {
      diagnostics.push(
        diagnostic(
          "source.unsupported_entry",
          `Selected source path "${entry.path}" uses unsupported Git mode "${entry.mode}".`,
          [entry.path]
        )
      )
      continue
    }
    if (entry.size !== undefined && entry.size > MAX_FILE_SIZE_BYTES) {
      diagnostics.push(
        diagnostic(
          "source.file_too_large",
          `Selected source path "${entry.path}" exceeds the 10 MiB file limit.`,
          [entry.path]
        )
      )
      continue
    }
    selected.push(entry)
  }

  selected.sort((left, right) => compareStrings(left.path, right.path))
  if (selected.length === 0 && diagnostics.length === 0) {
    diagnostics.push(
      diagnostic(
        "selection.empty",
        "The includes and excludes patterns selected no source files."
      )
    )
  }

  const knownTotalSize = selected.reduce(
    (total, entry) => total + (entry.size ?? 0),
    0
  )
  if (knownTotalSize > MAX_TOTAL_SIZE_BYTES) {
    diagnostics.push(
      diagnostic(
        "source.total_size_exceeded",
        "The selected files exceed the 50 MiB total source size limit."
      )
    )
  }

  return { selected, diagnostics }
}

function toDiagnostic(error: unknown): TemplateInstallationDiagnostic {
  if (isTemplateSourceError(error)) {
    return diagnostic(error.code, error.message, error.path ? [error.path] : [])
  }
  return diagnostic(
    "source.unavailable",
    `The template source could not be resolved: ${String(error)}.`
  )
}

async function validateDescriptorSnapshot(
  request: TemplateSourceRequest,
  snapshot: TemplateDescriptorSourceSnapshot
): Promise<
  | { success: true; descriptor: NormalizedTemplateDescriptorV1 }
  | { success: false; diagnostics: TemplateInstallationDiagnostic[] }
> {
  const readResult = parseDescriptorBytes(snapshot.contents)
  if (!readResult.success) {
    return { success: false, diagnostics: [readResult.diagnostic] }
  }

  const parsed = parseTemplateDescriptor(readResult.input)
  if (!parsed.success) {
    return {
      success: false,
      diagnostics: parsed.diagnostics.map((item) => ({
        code: item.code,
        message: item.message,
        path: item.path,
      })),
    }
  }

  const diagnostics = [
    ...validateDescriptorSource(parsed.data, request, snapshot),
    ...makeMatchers(parsed.data.includes).diagnostics,
    ...makeMatchers(parsed.data.excludes).diagnostics,
  ].sort(compareDiagnostics)

  return diagnostics.length > 0
    ? { success: false, diagnostics }
    : { success: true, descriptor: parsed.data }
}

/**
 * Read and validate only the root descriptor for display. Unlike an
 * installation plan, this does not download or inventory the repository.
 */
export async function createTemplateDescriptorInfo(
  request: TemplateSourceRequest,
  adapter: TemplateSourceAdapter
): Promise<CreateTemplateDescriptorInfoResult> {
  let snapshot: TemplateDescriptorSourceSnapshot
  try {
    snapshot = await adapter.resolveDescriptor(request)
  } catch (error) {
    if (
      isTemplateSourceError(error) &&
      error.code === "source.file_not_found" &&
      error.path === DESCRIPTOR_PATH
    ) {
      return {
        success: false,
        diagnostics: [
          diagnostic(
            "descriptor.missing",
            `The source repository does not contain a root ${DESCRIPTOR_PATH}.`,
            [DESCRIPTOR_PATH]
          ),
        ],
      }
    }
    return { success: false, diagnostics: [toDiagnostic(error)] }
  }

  const validated = await validateDescriptorSnapshot(request, snapshot)
  if (!validated.success) return validated
  return {
    success: true,
    info: {
      source: {
        repository: snapshot.repository,
      },
      descriptor: validated.descriptor,
    },
  }
}

/**
 * Validate a descriptor and build a deterministic, byte-preserving plan.
 * This function does not create directories or write files.
 */
export async function createTemplateInstallationPlan(
  request: TemplateSourceRequest,
  adapter: TemplateSourceAdapter
): Promise<CreateTemplateInstallationPlanResult> {
  let snapshot: TemplateSourceSnapshot
  try {
    snapshot = await adapter.resolve(request)
  } catch (error) {
    return { success: false, diagnostics: [toDiagnostic(error)] }
  }

  let descriptorResult: ReadDescriptorResult
  try {
    descriptorResult = await readDescriptor(snapshot)
  } catch (error) {
    return { success: false, diagnostics: [toDiagnostic(error)] }
  }
  if (!descriptorResult.success) {
    return { success: false, diagnostics: [descriptorResult.diagnostic] }
  }

  const parsed = parseTemplateDescriptor(descriptorResult.input)
  if (!parsed.success) {
    return {
      success: false,
      diagnostics: parsed.diagnostics.map((item) => ({
        code: item.code,
        message: item.message,
        path: item.path,
      })),
    }
  }

  const diagnostics = [
    ...validateDescriptorSource(parsed.data, request, snapshot),
    ...(await validateDescriptorRef(parsed.data, snapshot, (repository, ref) =>
      adapter.resolveRevision(repository, ref)
    )),
  ]
  if (diagnostics.length > 0) {
    return { success: false, diagnostics: diagnostics.sort(compareDiagnostics) }
  }

  const selection = selectEntries(parsed.data, snapshot.entries)
  if (selection.diagnostics.length > 0) {
    return {
      success: false,
      diagnostics: selection.diagnostics.sort(compareDiagnostics),
    }
  }

  const files: PlannedTemplateFile[] = []
  let totalSize = 0
  for (const entry of selection.selected) {
    try {
      const contents = await snapshot.readFile(entry.path)
      if (contents.byteLength > MAX_FILE_SIZE_BYTES) {
        return {
          success: false,
          diagnostics: [
            diagnostic(
              "source.file_too_large",
              `Selected source path "${entry.path}" exceeds the 10 MiB file limit.`,
              [entry.path]
            ),
          ],
        }
      }
      totalSize += contents.byteLength
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        return {
          success: false,
          diagnostics: [
            diagnostic(
              "source.total_size_exceeded",
              "The selected files exceed the 50 MiB total source size limit."
            ),
          ],
        }
      }
      files.push({ path: entry.path, contents })
    } catch (error) {
      return { success: false, diagnostics: [toDiagnostic(error)] }
    }
  }

  return {
    success: true,
    plan: {
      source: { repository: snapshot.repository, revision: snapshot.revision },
      descriptor: parsed.data,
      files,
    },
  }
}
