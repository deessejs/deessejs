import { createHash } from "node:crypto"
import { resolve } from "node:path"
import { realpath } from "node:fs/promises"
import { resolveOfficialBlock } from "../api/index.js"
import { resolveBlockAssets } from "./resolve-block-info.js"

type LoadedBlock = Awaited<ReturnType<typeof resolveBlockAssets>>

export async function resolveAddSource(input: string, ref?: string) {
  const source = await resolveSourceInput(input, ref)
  const loaded = await resolveBlockAssets(source, { ...(ref ? { ref } : {}) })
  const identity = await createSourceIdentity(loaded, source)
  const revision = createSourceRevision(loaded)
  return { ...loaded, identity, revision }
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
