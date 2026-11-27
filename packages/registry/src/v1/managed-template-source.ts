import { createHash } from "node:crypto"
import { inspectManagedReleaseArchive } from "./managed-release-archive.js"
import type { TemplateSourceAdapter } from "./template-source.js"

/** Builds the shared installation adapter from a validated sealed archive. */
export async function createManagedTemplateSourceAdapter(input: {
  archive: Uint8Array
  repository: string
  version: string
}): Promise<TemplateSourceAdapter> {
  const inspected = await inspectManagedReleaseArchive({ archive: input.archive, kind: "template", version: input.version })
  const files = inspected.files
  const descriptor = files.get("deesse-template.json")
  if (!descriptor) throw new Error("Managed template archive has no root descriptor.")
  const revision = createHash("sha256").update(input.archive).digest("hex")
  const entries = [...files.entries()].map(([path, contents]) => ({ path, type: "blob" as const, mode: "100644", sha: `${revision}:${path}`, size: contents.byteLength }))
  const readFile = async (path: string) => {
    const contents = files.get(path)
    if (!contents) throw Object.assign(new Error(`File not found: ${path}`), { code: "source.file_not_found", path })
    return contents
  }
  return {
    async resolve(source) {
      if (source.repository.toLowerCase() !== input.repository.toLowerCase()) throw new Error("Managed release identity mismatch.")
      return { repository: input.repository, revision, entries, readFile }
    },
    async resolveDescriptor(source) {
      if (source.repository.toLowerCase() !== input.repository.toLowerCase()) throw new Error("Managed release identity mismatch.")
      return { repository: input.repository, contents: descriptor }
    },
    async resolveRevision(repository, ref) {
      if (repository.toLowerCase() !== input.repository.toLowerCase()) throw new Error("Managed release repository mismatch.")
      void ref
      return revision
    },
  }
}
