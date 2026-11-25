import { randomUUID } from "node:crypto"
import type { FileHandle } from "node:fs/promises"
import { lstat, open, readFile, rename, rm } from "node:fs/promises"
import { join, resolve } from "node:path"
import { inc, parse } from "semver"
import type { SemVer } from "semver"
import { TemplateDescriptorV1Schema } from "@workspace/registry/v1"
import { CliError } from "../errors/index.js"

const DESCRIPTOR_FILENAME = "deesse-template.json"
const CANONICAL_STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

type Release = "major" | "minor" | "patch"

type TemplateVersionBump = {
  previousVersion: string
  version: string
}

function descriptorError(detail: string, cause?: Error) {
  return new CliError(
    "template_invalid",
    `local template descriptor "${DESCRIPTOR_FILENAME}" cannot be updated`,
    detail,
    cause
  )
}

function isSafeCanonicalVersion(version: string): boolean {
  const match = CANONICAL_STABLE_VERSION.exec(version)
  if (!match) return false

  let parsed: SemVer | null
  try {
    parsed = parse(version)
  } catch {
    return false
  }
  if (!parsed || parsed.version !== version || parsed.prerelease.length > 0 || parsed.build.length > 0)
    return false

  return match.slice(1).every((component) => {
    const value = Number(component)
    return Number.isSafeInteger(value)
  })
}

async function readDescriptor(path: string): Promise<{
  bytes: Buffer
  descriptor: Record<string, unknown>
  mode: number
}> {
  const fileInfo = await statDescriptor(path)
  const bytes = await readDescriptorBytes(path)
  const descriptor = parseDescriptor(bytes)

  return { bytes, descriptor, mode: fileInfo.mode }
}

async function statDescriptor(path: string) {
  let fileInfo: Awaited<ReturnType<typeof lstat>>
  try {
    fileInfo = await lstat(path)
  } catch (error) {
    throw descriptorError(
      `cannot read "${DESCRIPTOR_FILENAME}": ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  }
  if (!fileInfo.isFile()) {
    throw descriptorError(`"${DESCRIPTOR_FILENAME}" must be a regular file, not a symlink or directory.`)
  }
  return fileInfo
}

async function readDescriptorBytes(path: string): Promise<Buffer> {
  try {
    return await readFile(path)
  } catch (error) {
    throw descriptorError(
      `cannot read "${DESCRIPTOR_FILENAME}": ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  }
}

function parseDescriptor(bytes: Buffer): Record<string, unknown> {
  let input: unknown
  try {
    input = JSON.parse(bytes.toString("utf8"))
  } catch (error) {
    throw descriptorError(
      `"${DESCRIPTOR_FILENAME}" is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  }

  const result = TemplateDescriptorV1Schema.safeParse(input)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "descriptor"}: ${issue.message}`)
      .join("; ")
    throw descriptorError(`"${DESCRIPTOR_FILENAME}" is invalid: ${detail}`)
  }
  return input as Record<string, unknown>
}

async function writeAtomically(
  path: string,
  originalBytes: Buffer,
  contents: string,
  mode: number
): Promise<void> {
  const currentInfo = await lstat(path).catch((error: unknown) => {
    throw descriptorError(
      `cannot confirm "${DESCRIPTOR_FILENAME}" is unchanged before writing: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  })
  if (!currentInfo.isFile()) {
    throw descriptorError(`"${DESCRIPTOR_FILENAME}" changed and is no longer a regular file. Run the command again.`)
  }
  const latestBytes = await readFile(path).catch((error: unknown) => {
    throw descriptorError(
      `cannot confirm "${DESCRIPTOR_FILENAME}" is unchanged before writing: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  })
  if (!latestBytes.equals(originalBytes)) {
    throw descriptorError(`"${DESCRIPTOR_FILENAME}" changed while the version was being updated. Run the command again.`)
  }

  const temporaryPath = join(
    resolve(path, ".."),
    `.${DESCRIPTOR_FILENAME}.${process.pid}.${randomUUID()}.tmp`
  )
  let handle: FileHandle | undefined
  try {
    handle = await open(temporaryPath, "wx", mode & 0o777)
    await handle.chmod(mode & 0o777)
    await handle.writeFile(contents, "utf8")
    await handle.sync()
    await handle.close()
    handle = undefined
    await rename(temporaryPath, path)
  } catch (error) {
    throw descriptorError(
      `cannot safely update "${DESCRIPTOR_FILENAME}": ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    )
  } finally {
    await handle?.close().catch(() => undefined)
    await rm(temporaryPath, { force: true }).catch(() => undefined)
  }
}

export async function bumpLocalTemplateVersion(
  cwd: string,
  release: Release
): Promise<TemplateVersionBump> {
  const path = resolve(cwd, DESCRIPTOR_FILENAME)
  const { bytes, descriptor, mode } = await readDescriptor(path)
  const current = descriptor.version
  if (typeof current !== "string" || !isSafeCanonicalVersion(current)) {
    throw descriptorError(
      'the version must be canonical stable SemVer in MAJOR.MINOR.PATCH form, without a "v" prefix, leading zeroes, prerelease, or build metadata; each component must be a safe integer.'
    )
  }

  const parsed = parse(current)
  const component = release === "major"
    ? parsed?.major
    : release === "minor"
      ? parsed?.minor
      : parsed?.patch
  if (component === Number.MAX_SAFE_INTEGER) {
    throw descriptorError(`the ${release} version component cannot be incremented beyond ${Number.MAX_SAFE_INTEGER}.`)
  }

  const next = inc(current, release)
  if (!next || !isSafeCanonicalVersion(next)) {
    throw descriptorError(`the ${release} version component cannot be incremented safely.`)
  }

  descriptor.version = next
  await writeAtomically(path, bytes, `${JSON.stringify(descriptor, null, 2)}\n`, mode)
  return { previousVersion: current, version: next }
}
