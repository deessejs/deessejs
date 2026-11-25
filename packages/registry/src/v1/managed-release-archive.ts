import { createHash } from "node:crypto"
import { Parser } from "tar"
import { parseBlockDescriptor } from "./block-descriptor.js"
import { parseTemplateDescriptor } from "./template-descriptor.js"

export const MAX_MANAGED_ARCHIVE_BYTES = 100 * 1024 * 1024
const MAX_EXPANDED_BYTES = 200 * 1024 * 1024
const MAX_ENTRIES = 10_000
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024

export type ManagedReleaseArchiveInfo = {
  descriptorDigest: string
  files: ReadonlyMap<string, Uint8Array>
  preview?: { bytes: Uint8Array; contentType: "image/png" | "image/jpeg" | "image/webp" }
}

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")
function isSafePath(path: string): boolean {
  if (path.startsWith("/")) return false
  if (/^[A-Za-z]:/.test(path)) return false
  if (path.includes("\\") || path.includes("\0")) return false
  return path.split("/").every((part) => part !== "" && part !== "." && part !== "..")
}
function imageType(bytes: Uint8Array): NonNullable<ManagedReleaseArchiveInfo["preview"]>["contentType"] | undefined {
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (bytes.length >= pngSignature.length && pngSignature.every((value, index) => bytes[index] === value)) return "image/png"
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg"
  const isWebp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (isWebp) return "image/webp"
  return undefined
}

type ArchiveEntryState = {
  names: Set<string>
  files: Map<string, Uint8Array>
  expanded: number
  count: number
  parseError?: Error
}

function consumeArchiveEntry(entry: import("tar").ReadEntry, state: ArchiveEntryState) {
  const name = entry.path.replace(/\/$/, "")
  if (!name) {
    entry.resume()
    return
  }
  state.count += 1
  if (state.count > MAX_ENTRIES) {
    state.parseError = new Error("Archive contains too many entries.")
    entry.resume()
    return
  }
  if (!isSafePath(name) || state.names.has(name)) {
    state.parseError = new Error(`Archive contains an unsafe or duplicate path: ${name}`)
    entry.resume()
    return
  }
  state.names.add(name)
  if (entry.type === "Directory") {
    entry.resume()
    return
  }
  if (!["File", "OldFile", "ContiguousFile"].includes(entry.type)) {
    state.parseError = new Error(`Archive entry type ${entry.type} is not supported.`)
    entry.resume()
    return
  }
  state.expanded += entry.size
  if (state.expanded > MAX_EXPANDED_BYTES) {
    state.parseError = new Error("Archive expands beyond 200 MiB.")
    entry.resume()
    return
  }
  const chunks: Buffer[] = []
  entry.on("data", (chunk: Buffer) => chunks.push(chunk))
  entry.on("end", () => state.files.set(name, new Uint8Array(Buffer.concat(chunks))))
}

function readDescriptor(input: { kind: "template" | "block"; version: string; files: Map<string, Uint8Array> }) {
  const descriptorPath = input.kind === "template" ? "deesse-template.json" : "deesse-block.json"
  const descriptorBytes = input.files.get(descriptorPath)
  if (!descriptorBytes) throw new Error(`Archive is missing ${descriptorPath} at its root.`)
  let raw: unknown
  try { raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(descriptorBytes)) }
  catch { throw new Error(`${descriptorPath} must be valid UTF-8 JSON.`) }
  let previewPath: string | undefined
  if (input.kind === "template") {
    const parsed = parseTemplateDescriptor(raw)
    if (!parsed.success) throw new Error(parsed.diagnostics.map((item) => item.message).join(" "))
    if (parsed.data.version !== input.version) throw new Error("Descriptor version does not match the requested release version.")
    previewPath = parsed.data.previewImage
  } else {
    const parsed = parseBlockDescriptor(raw)
    if (!parsed.success) throw new Error(parsed.diagnostics.map((item) => item.message).join(" "))
    if (parsed.data.version !== input.version) throw new Error("Block descriptor version does not match the requested release version.")
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(parsed.data.version)) throw new Error("Managed block releases require canonical stable SemVer.")
  }
  return { descriptorBytes, previewPath }
}

function readPreview(files: Map<string, Uint8Array>, previewPath: string | undefined) {
  if (!previewPath) return undefined
  if (!isSafePath(previewPath)) throw new Error("previewImage must be a safe path relative to the repository root.")
  const bytes = files.get(previewPath)
  if (!bytes || bytes.byteLength > MAX_PREVIEW_BYTES) throw new Error("previewImage must name a file no larger than 5 MiB.")
  const contentType = imageType(bytes)
  if (!contentType) throw new Error("previewImage must contain a PNG, JPEG, or WebP image.")
  return { bytes, contentType }
}

/** Validates archive structure and its embedded release descriptor without extracting files to disk. */
export async function inspectManagedReleaseArchive(input: {
  archive: Uint8Array
  kind: "template" | "block"
  version: string
}): Promise<ManagedReleaseArchiveInfo> {
  if (input.archive.byteLength === 0 || input.archive.byteLength > MAX_MANAGED_ARCHIVE_BYTES) throw new Error("Archive must be between 1 byte and 100 MiB compressed.")
  const parser = new Parser({ gzip: true, strict: true, maxMetaEntrySize: 1024 * 1024 })
  const state: ArchiveEntryState = { names: new Set(), files: new Map(), expanded: 0, count: 0 }
  parser.on("error", (error: Error) => { state.parseError = error })
  parser.on("entry", (entry) => consumeArchiveEntry(entry, state))
  await new Promise<void>((resolve, reject) => {
    parser.once("end", resolve)
    parser.once("error", reject)
    parser.end(Buffer.from(input.archive))
  }).catch((error: unknown) => { throw error instanceof Error ? error : new Error(String(error)) })
  if (state.parseError) throw state.parseError
  const { descriptorBytes, previewPath } = readDescriptor({ ...input, files: state.files })
  const preview = readPreview(state.files, previewPath)
  return { descriptorDigest: digest(descriptorBytes), files: state.files, ...(preview ? { preview } : {}) }
}
