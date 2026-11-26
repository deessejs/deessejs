import { createHash } from "node:crypto"
import { resolve } from "node:path"
import { realpath } from "node:fs/promises"
import { resolveOfficialBlock } from "../api/index.js"
import { orpc } from "../api/client.js"
import { createAuthenticatedORPCClient } from "../api/client.js"
import { readAuth } from "../lib/auth/store/store.js"
import { inspectManagedReleaseArchive, parseBlockDescriptor } from "@workspace/registry/v1"
import { downloadManagedArchive } from "./download-managed-archive.js"
import { resolveBlockAssets } from "./resolve-block-info.js"

type LoadedBlock = Awaited<ReturnType<typeof resolveBlockAssets>>
type ManagedBlockRelease = { version: string; digest: string; downloadUrl: string }

export async function resolveAddSource(input: string, ref?: string, organizationSlug?: string) {
  if (/^[a-z][a-z0-9-]*$/.test(input) && !ref) {
    const managedBlock = await resolveManagedBlock(input, organizationSlug)
    if (managedBlock) return managedBlock
  }
  const source = await resolveSourceInput(input, ref)
  const loaded = await resolveBlockAssets(source, { ...(ref ? { ref } : {}) })
  const identity = await createSourceIdentity(loaded, source)
  const revision = createSourceRevision(loaded)
  return { ...loaded, identity, revision }
}

async function resolveManagedBlock(name: string, organizationSlug?: string) {
  const auth = organizationSlug ? readAuth() : undefined
  if (organizationSlug && !auth) throw new Error("Sign in with deessejs auth login to access organization releases.")
  let managed
  try {
    const client = auth ? createAuthenticatedORPCClient(auth.access_token) : orpc
    managed = await client.managedReleases.resolve({ kind: "block", slug: name, ...(organizationSlug ? { organizationSlug } : {}) })
  } catch {
    if (organizationSlug) throw new Error(`Organization block "${name}" is unavailable or you do not have access.`)
    throw new Error("Managed block resolution failed. Try again or use the public source URL.")
  }
  if (!managed.release) {
    if (organizationSlug) throw new Error(`Organization block "${name}" has no ready managed release or you do not have access.`)
    if (managed.requiresManaged) throw new Error(`Block "${name}" is protected and must be initialized from a managed release.`)
    return undefined
  }
  return loadManagedBlock(name, managed.release)
}

async function loadManagedBlock(name: string, release: ManagedBlockRelease) {
  const archive = await downloadManagedArchive(release.downloadUrl, release.digest)
  const inspected = await inspectManagedReleaseArchive({ archive, kind: "block", version: release.version })
  const descriptorBytes = inspected.files.get("deesse-block.json")
  if (!descriptorBytes) throw new Error("Managed block archive has no root descriptor.")
  const parsed = parseBlockDescriptor(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(descriptorBytes)))
  if (!parsed.success) throw new Error(parsed.diagnostics.map((item) => item.message).join(" "))
  const files = await Promise.all(parsed.data.install.files.map(async (file) => {
    const contents = inspected.files.get(file.from)
    if (!contents) throw new Error(`Managed block archive is missing ${file.from}.`)
    return { ...file, contents: new TextDecoder("utf-8", { fatal: true }).decode(contents) }
  }))
  const loaded = { descriptor: parsed.data, files, reader: { source: { type: "github" as const, repository: `managed/${name}`, path: "", revision: release.digest }, read: async (path: string) => {
    const contents = inspected.files.get(path)
    if (!contents) throw new Error(`Managed block archive is missing ${path}.`)
    return new TextDecoder("utf-8", { fatal: true }).decode(contents)
  } } } as LoadedBlock
  return { ...loaded, identity: `managed:block:${name}`, revision: release.digest }
}

async function resolveSourceInput(
  input: string,
  ref?: string
): Promise<string> {
  if (!/^[a-z][a-z0-9-]*$/.test(input)) return input
  if (ref)
    throw new Error(
      "Published blocks use their catalog-pinned revision; --ref is for GitHub sources."
    )
  const block = await resolveOfficialBlock(input)
  if (!block) throw new Error(`No published official block named ${input}.`)
  const repository = new URL(block.repositoryUrl)
  const directory = block.subdirectory ? `/${block.subdirectory}` : ""
  return `https://github.com${repository.pathname.replace(/\.git$/, "")}/tree/${block.sourceCommit}${directory}`
}

async function createSourceIdentity(
  loaded: LoadedBlock,
  source: string
): Promise<string> {
  if (loaded.reader.source.type === "github")
    return `github:${loaded.reader.source.repository}:${githubSubdirectory(source)}`
  return `local:${await realpath(resolve(loaded.reader.source.path))}`
}

function createSourceRevision(loaded: LoadedBlock): string {
  if (loaded.reader.source.type === "github")
    return loaded.reader.source.revision
  return createHash("sha256")
    .update(JSON.stringify(loaded.descriptor))
    .update(
      loaded.files.map((file) => `${file.from}\0${file.contents}`).join("\0")
    )
    .digest("hex")
}

function githubSubdirectory(source: string): string {
  const segments = new URL(source).pathname.split("/").filter(Boolean)
  if (segments[2] === "tree") return segments.slice(4).join("/")
  return segments.slice(2).join("/")
}
