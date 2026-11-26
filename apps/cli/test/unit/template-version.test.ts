import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { bumpLocalTemplateVersion } from "../../src/utils/template-version.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe("local template version bump", () => {
  it.each([
    ["patch", "1.2.3", "1.2.4"],
    ["minor", "1.2.3", "1.3.0"],
    ["major", "1.2.3", "2.0.0"],
  ] as const)("increments the %s component", async (release, version, expected) => {
    const directory = await createTemplateDirectory(version)
    const before = await readDescriptor(directory)

    await expect(bumpLocalTemplateVersion(directory, release)).resolves.toEqual({
      previousVersion: version,
      version: expected,
    })
    await expect(readDescriptor(directory)).resolves.toEqual({
      ...before,
      version: expected,
    })
  })

  it.each([
    "v1.2.3",
    "01.2.3",
    "1.02.3",
    "1.2.03",
    "1.2.3-beta.1",
    "1.2.3+build.1",
    "1.2",
    "not-semver",
    "9007199254740992.0.0",
  ])("rejects invalid stable SemVer %s without changing the descriptor", async (version) => {
    const directory = await createTemplateDirectory(version)
    const before = await readFile(join(directory, "deesse-template.json"))

    await expect(
      bumpLocalTemplateVersion(directory, "patch")
    ).rejects.toThrow()
    await expect(readFile(join(directory, "deesse-template.json"))).resolves.toEqual(before)
  })

  it.each([
    ["major", "9007199254740991.0.0"],
    ["minor", "1.9007199254740991.0"],
    ["patch", "1.0.9007199254740991"],
  ] as const)("rejects %s overflow without changing the descriptor", async (release, version) => {
    const directory = await createTemplateDirectory(version)
    const before = await readFile(join(directory, "deesse-template.json"))

    await expect(
      bumpLocalTemplateVersion(directory, release)
    ).rejects.toMatchObject({
      hint: expect.stringContaining("cannot be incremented"),
    })
    await expect(readFile(join(directory, "deesse-template.json"))).resolves.toEqual(before)
  })

  it("fails clearly when the descriptor is missing", async () => {
    const directory = await createTemplateDirectory()

    await expect(
      bumpLocalTemplateVersion(directory, "patch")
    ).rejects.toMatchObject({
      hint: expect.stringContaining('cannot read "deesse-template.json"'),
    })
  })
})

async function createTemplateDirectory(version?: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "deesse-template-version-"))
  temporaryDirectories.push(directory)
  if (version !== undefined) {
    await writeFile(
      join(directory, "deesse-template.json"),
      `${JSON.stringify(createDescriptor(version), null, 2)}\n`
    )
  }
  return directory
}

function createDescriptor(version: string) {
  return {
    $schema: "https://app.deessejs.com/schema/template/v1.json",
    formatVersion: 1,
    name: "test-template",
    title: "Test Template",
    description: "A descriptor for version bump tests.",
    type: "template:starter",
    version,
    excludes: ["private/**"],
    labels: ["starter"],
  }
}

async function readDescriptor(directory: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(join(directory, "deesse-template.json"), "utf8")
  ) as Record<string, unknown>
}
