import { describe, expect, it } from "vitest"
import {
  createTemplateDescriptorInfo,
  createTemplateInstallationPlan,
} from "../../src/v1/installation-plan.js"
import type {
  TemplateSourceAdapter,
  TemplateSourceEntry,
  TemplateSourceSnapshot,
} from "../../src/v1/template-source.js"

const REVISION = "0123456789abcdef0123456789abcdef01234567"

const descriptor = {
  $schema: "https://app.deessejs.com/schema/template/v1.json",
  formatVersion: 1,
  name: "fixture",
  title: "Fixture",
  description: "Fixture template",
  type: "template:app",
  version: "1.0.0",
  source: { repo: "deessejs/fixture", ref: "v1.0.0" },
  includes: ["**/*"],
  excludes: ["deesse-template.json", "private/**"],
}

function createAdapter(
  entries: TemplateSourceEntry[],
  fileContents: Record<string, Uint8Array>
): TemplateSourceAdapter {
  const snapshot: TemplateSourceSnapshot = {
    repository: "deessejs/fixture",
    revision: REVISION,
    entries,
    async readFile(path) {
      const contents = fileContents[path]
      if (!contents) throw new Error(`Missing fixture file: ${path}`)
      return contents
    },
  }

  return {
    async resolve() {
      return snapshot
    },
    async resolveDescriptor() {
      const contents = fileContents["deesse-template.json"]
      if (!contents) throw new Error("Missing fixture descriptor")
      return {
        repository: snapshot.repository,
        contents,
      }
    },
    async resolveRevision() {
      return REVISION
    },
  }
}

function blob(
  path: string,
  contents: Uint8Array,
  mode = "100644"
): TemplateSourceEntry {
  return {
    path,
    mode,
    type: "blob",
    sha: `${path.length}`.padStart(40, "0"),
    size: contents.byteLength,
  }
}

describe("createTemplateInstallationPlan", () => {
  it("validates one source revision and returns sorted paths with untouched bytes", async () => {
    const descriptorBytes = new TextEncoder().encode(JSON.stringify(descriptor))
    const binaryBytes = Uint8Array.from([0, 255, 16, 128])
    const fileContents = {
      "deesse-template.json": descriptorBytes,
      ".gitignore": new TextEncoder().encode("node_modules\n"),
      "src/z.ts": new TextEncoder().encode("export const z = true"),
      "assets/font.woff2": binaryBytes,
      "private/credentials.txt": new TextEncoder().encode("secret"),
    }
    const adapter = createAdapter(
      Object.entries(fileContents).map(([path, contents]) =>
        blob(path, contents)
      ),
      fileContents
    )

    const result = await createTemplateInstallationPlan(
      { repository: "deessejs/fixture", ref: "v1.0.0" },
      adapter
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.plan.source).toEqual({
      repository: "deessejs/fixture",
      revision: REVISION,
    })
    expect(result.plan.files.map((file) => file.path)).toEqual([
      ".gitignore",
      "assets/font.woff2",
      "src/z.ts",
    ])
    expect(result.plan.files[1]?.contents).toEqual(binaryBytes)
  })

  it("rejects a selected symlink before returning a plan", async () => {
    const descriptorBytes = new TextEncoder().encode(JSON.stringify(descriptor))
    const fileContents = { "deesse-template.json": descriptorBytes }
    const adapter = createAdapter(
      [
        blob("deesse-template.json", descriptorBytes),
        { ...blob("src/link", new Uint8Array()), mode: "120000" },
      ],
      fileContents
    )

    const result = await createTemplateInstallationPlan(
      { repository: "deessejs/fixture" },
      adapter
    )

    expect(result).toMatchObject({
      success: false,
      diagnostics: [{ code: "source.symlink", path: ["src/link"] }],
    })
  })

  it("rejects descriptor source metadata that resolves to a different commit", async () => {
    const input = {
      ...descriptor,
      source: { repo: "deessejs/fixture", ref: "v0.9.0" },
    }
    const descriptorBytes = new TextEncoder().encode(JSON.stringify(input))
    const adapter = createAdapter(
      [blob("deesse-template.json", descriptorBytes)],
      { "deesse-template.json": descriptorBytes }
    )
    adapter.resolveRevision = async () =>
      "fedcba9876543210fedcba9876543210fedcba98"

    const result = await createTemplateInstallationPlan(
      { repository: "deessejs/fixture", ref: "v1.0.0" },
      adapter
    )

    expect(result).toMatchObject({
      success: false,
      diagnostics: [
        { code: "descriptor.source_ref_mismatch", path: ["source", "ref"] },
      ],
    })
  })

  it("supports Picomatch braces, extglobs and POSIX character classes", async () => {
    const input = {
      ...descriptor,
      includes: ["{src,lib}/+(index|main).[[:alpha:]]s"],
      excludes: ["lib/**"],
    }
    const descriptorBytes = new TextEncoder().encode(JSON.stringify(input))
    const fileContents = {
      "deesse-template.json": descriptorBytes,
      "src/index.ts": new TextEncoder().encode("export {}"),
      "lib/main.ts": new TextEncoder().encode("export {}"),
      "src/other.ts": new TextEncoder().encode("export {}"),
    }
    const adapter = createAdapter(
      Object.entries(fileContents).map(([path, contents]) =>
        blob(path, contents)
      ),
      fileContents
    )

    const result = await createTemplateInstallationPlan(
      { repository: "deessejs/fixture" },
      adapter
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.plan.files.map((file) => file.path)).toEqual(["src/index.ts"])
  })
})

describe("createTemplateDescriptorInfo", () => {
  it("validates the manifest and source identity without making an installation plan", async () => {
    const descriptorBytes = new TextEncoder().encode(JSON.stringify(descriptor))
    const adapter = createAdapter(
      [blob("deesse-template.json", descriptorBytes)],
      { "deesse-template.json": descriptorBytes }
    )

    const result = await createTemplateDescriptorInfo(
      { repository: "deessejs/fixture", ref: "v1.0.0" },
      adapter
    )

    expect(result).toEqual({
      success: true,
      info: {
        source: { repository: "deessejs/fixture" },
        descriptor: { ...descriptor, includes: ["**/*"] },
      },
    })
  })

  it("rejects source metadata that does not match the selected repository", async () => {
    const descriptorBytes = new TextEncoder().encode(
      JSON.stringify({ ...descriptor, source: { repo: "deessejs/other" } })
    )
    const adapter = createAdapter(
      [blob("deesse-template.json", descriptorBytes)],
      { "deesse-template.json": descriptorBytes }
    )

    const result = await createTemplateDescriptorInfo(
      { repository: "deessejs/fixture" },
      adapter
    )

    expect(result).toMatchObject({
      success: false,
      diagnostics: [{ code: "descriptor.source_mismatch" }],
    })
  })
})
