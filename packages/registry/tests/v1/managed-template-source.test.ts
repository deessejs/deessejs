import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { c } from "tar"
import { afterEach, describe, expect, it } from "vitest"
import { createTemplateInstallationPlan } from "../../src/v1/installation-plan.js"
import { createManagedTemplateSourceAdapter } from "../../src/v1/managed-template-source.js"

const roots: string[] = []

async function makeArchive() {
  const root = await mkdtemp(join(tmpdir(), "deesse-managed-template-source-"))
  roots.push(root)
  const descriptor = {
    $schema: "https://app.deessejs.com/schema/template/v1.json",
    formatVersion: 1,
    name: "Internal Starter",
    title: "Internal Starter",
    description: "A source-neutral managed template.",
    type: "template:starter",
    version: "1.0.0",
    excludes: [],
  }
  await writeFile(
    join(root, "deesse-template.json"),
    JSON.stringify(descriptor)
  )
  await writeFile(join(root, "README.md"), "Managed archive content.")
  const chunks: Buffer[] = []
  for await (const chunk of c(
    { cwd: root, gzip: true, portable: true, mtime: new Date(0) },
    ["deesse-template.json", "README.md"]
  )) {
    chunks.push(Buffer.from(chunk))
  }
  return new Uint8Array(Buffer.concat(chunks))
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  )
})

describe("source-neutral managed template installation", () => {
  it("builds an installation plan from a release identity without an owner or repository", async () => {
    const archive = await makeArchive()
    const sourceIdentity = "managed-release:release-123"
    const adapter = await createManagedTemplateSourceAdapter({
      archive,
      repository: sourceIdentity,
      version: "1.0.0",
    })
    const result = await createTemplateInstallationPlan(
      { repository: sourceIdentity },
      adapter
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.plan.source.repository).toBe(sourceIdentity)
    expect(result.plan.descriptor.name).toBe("Internal Starter")
    expect(result.plan.files.map((file) => file.path)).toContain("README.md")
  })
})
