import { createHash, randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { lstat, readFile } from "node:fs/promises"
import { promisify } from "node:util"
import { resolve } from "node:path"
import { c as createTar } from "tar"
import picomatch from "picomatch"
import { parseBlockDescriptor, parseTemplateDescriptor, inspectManagedReleaseArchive, MAX_MANAGED_ARCHIVE_BYTES } from "@workspace/registry/v1"
import { createAuthenticatedORPCClient } from "../api/client.js"
import { readAuth } from "../lib/auth/store/store.js"

const execFileAsync = promisify(execFile)
const MAX_ARCHIVE_BYTES = MAX_MANAGED_ARCHIVE_BYTES

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 16 * 1024 * 1024 })
  return stdout
}

function collect(stream: NodeJS.ReadableStream & { destroy(error?: Error): void }): Promise<Uint8Array> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    stream.on("data", (chunk: Buffer | Uint8Array) => {
      size += chunk.byteLength
      if (size > MAX_ARCHIVE_BYTES) {
        stream.destroy(new Error("Compressed release archive exceeds 100 MiB."))
        return
      }
      chunks.push(Buffer.from(chunk))
    })
    stream.on("error", reject)
    stream.on("end", () => resolvePromise(new Uint8Array(Buffer.concat(chunks))))
  })
}

async function createArchive(cwd: string, kind: "template" | "block") {
  const status = await git(cwd, "status", "--porcelain", "--untracked-files=all")
  if (status.trim()) throw new Error("Publishing requires a clean Git working tree. Commit or remove local changes first.")
  const paths = (await git(cwd, "ls-files", "-z")).split("\0").filter(Boolean)
  const descriptorPath = kind === "template" ? "deesse-template.json" : "deesse-block.json"
  const descriptorInfo = await lstat(resolve(cwd, descriptorPath))
  if (!descriptorInfo.isFile() || descriptorInfo.isSymbolicLink()) throw new Error(`${descriptorPath} must be a regular file in the current directory.`)
  const descriptorBytes = await readFile(resolve(cwd, descriptorPath))
  let raw: unknown
  try { raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(descriptorBytes)) }
  catch { throw new Error(`${descriptorPath} must be valid UTF-8 JSON.`) }

  let version: string
  let include: (path: string) => boolean
  if (kind === "template") {
    const parsed = parseTemplateDescriptor(raw)
    if (!parsed.success) throw new Error(parsed.diagnostics.map((item) => item.message).join(" "))
    version = parsed.data.version
    const includeMatcher = picomatch(parsed.data.includes, { dot: true })
    const exclude = picomatch(parsed.data.excludes, { dot: true })
    include = (path) => includeMatcher(path) && !exclude(path)
  } else {
    const parsed = parseBlockDescriptor(raw)
    if (!parsed.success) throw new Error(parsed.diagnostics.map((item) => item.message).join(" "))
    version = parsed.data.version
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error("Managed block releases require canonical stable SemVer.")
    const declared = new Set(parsed.data.install.files.map((file) => file.from))
    include = (path) => declared.has(path)
  }
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error("Managed releases require canonical stable SemVer.")
  const selected = [...new Set([descriptorPath, ...paths.filter(include)])].sort()
  const archive = await collect(createTar({ cwd, gzip: true, portable: true, mtime: new Date(0) }, selected) as unknown as NodeJS.ReadableStream & { destroy(error?: Error): void })
  const inspected = await inspectManagedReleaseArchive({ archive, kind, version })
  return { archive, version, descriptorDigest: inspected.descriptorDigest }
}

export async function publishManagedRelease(input: { kind: "template" | "block"; slug: string; destination: string; cwd?: string }) {
  const auth = readAuth()
  if (!auth) throw new Error("Sign in with `deessejs auth login` before publishing.")
  const { archive, version, descriptorDigest } = await createArchive(resolve(input.cwd ?? process.cwd()), input.kind)
  const digest = createHash("sha256").update(archive).digest("hex")
  const client = createAuthenticatedORPCClient(auth.access_token)
  const request = {
    kind: input.kind,
    slug: input.slug,
    destination: input.destination,
    version,
    digest,
    descriptorDigest,
    archiveSize: archive.byteLength,
    idempotencyKey: randomUUID(),
  } as const
  const attempt = await client.managedReleases.begin(request)
  if (attempt.alreadyPublished) return { alreadyPublished: true, slug: input.slug, version, digest }
  const response = await fetch(attempt.uploadUrl, { method: "PUT", headers: { "content-type": "application/gzip" }, body: Buffer.from(archive) })
  if (!response.ok) throw new Error(`Release upload failed with HTTP ${response.status}.`)
  const result = await client.managedReleases.finalize({ uploadId: attempt.uploadId })
  return { alreadyPublished: false, ...result.release }
}
