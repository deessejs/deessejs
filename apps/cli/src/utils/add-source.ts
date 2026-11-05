import { createHash } from "node:crypto"
import { resolve } from "node:path"
import { realpath } from "node:fs/promises"
import { resolveOfficialBlock } from "../api/index.js"
import { resolveBlockAssets } from "./resolve-block-info.js"

export async function resolveAddSource(input: string, ref?: string) {
  let source = input
  if (/^[a-z][a-z0-9-]*$/.test(input)) {
    if (ref) throw new Error("Published blocks use their catalog-pinned revision; --ref is for GitHub sources.")
    const block = await resolveOfficialBlock(input)
    if (!block) throw new Error(`No published official block named ${input}.`)
    const repository = new URL(block.repositoryUrl)
    source = `https://github.com${repository.pathname.replace(/\.git$/, "")}/tree/${block.sourceCommit}${block.subdirectory ? `/${block.subdirectory}` : ""}`
  }
  const loaded = await resolveBlockAssets(source, { ...(ref ? { ref } : {}) })
  const identity = loaded.reader.source.type === "github"
    ? `github:${loaded.reader.source.repository}:${githubSubdirectory(source)}`
    : `local:${await realpath(resolve(loaded.reader.source.path))}`
  const revision = loaded.reader.source.type === "github"
    ? loaded.reader.source.revision
    : createHash("sha256").update(JSON.stringify(loaded.descriptor)).update(loaded.files.map((file) => `${file.from}\0${file.contents}`).join("\0")).digest("hex")
  return { ...loaded, identity, revision }
}

function githubSubdirectory(source: string): string {
  const segments = new URL(source).pathname.split("/").filter(Boolean)
  if (segments[2] === "tree") return segments.slice(4).join("/")
  return segments.slice(2).join("/")
}
