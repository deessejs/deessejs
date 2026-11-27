import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { afterEach, describe, expect, it, vi } from "vitest"

const GIT_EXECUTABLE = "/usr/bin/git"

const mocks = vi.hoisted(() => ({
  readAuth: vi.fn(),
  begin: vi.fn(),
  finalize: vi.fn(),
}))

vi.mock("../../src/lib/auth/store/store.js", () => ({
  readAuth: mocks.readAuth,
}))
vi.mock("../../src/api/client.js", () => ({
  createAuthenticatedORPCClient: () => ({
    managedReleases: { begin: mocks.begin, finalize: mocks.finalize },
  }),
}))

import { publishManagedRelease } from "../../src/utils/publish-release.js"

const roots: string[] = []

async function makeCleanTemplate() {
  const root = await mkdtemp(join(tmpdir(), "deesse-template-publish-"))
  roots.push(root)
  execFileSync(GIT_EXECUTABLE, ["init", "--quiet"], { cwd: root })
  execFileSync(GIT_EXECUTABLE, ["config", "user.name", "CLI Test"], {
    cwd: root,
  })
  execFileSync(
    GIT_EXECUTABLE,
    ["config", "user.email", "cli-test@example.test"],
    { cwd: root }
  )
  await writeFile(
    join(root, "deesse-template.json"),
    JSON.stringify({
      $schema: "https://app.deessejs.com/schema/template/v1.json",
      formatVersion: 1,
      name: "Private Starter",
      title: "Private Starter",
      description: "Private managed fixture.",
      type: "template:starter",
      version: "1.0.0",
      includes: ["README.md"],
      excludes: [],
    })
  )
  await writeFile(join(root, "README.md"), "Private template source files.")
  execFileSync(
    GIT_EXECUTABLE,
    ["add", "deesse-template.json", "README.md"],
    { cwd: root }
  )
  execFileSync(
    GIT_EXECUTABLE,
    ["commit", "--quiet", "-m", "initial template"],
    { cwd: root }
  )
  return root
}

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  )
})

describe("publishManagedRelease", () => {
  it("publishes a clean local template project with no repository identity", async () => {
    const root = await makeCleanTemplate()
    mocks.readAuth.mockReturnValue({ access_token: "test-token" })
    mocks.begin.mockResolvedValue({
      alreadyPublished: false,
      uploadId: "upload-1",
      uploadUrl: "https://upload.invalid/staging",
    })
    mocks.finalize.mockResolvedValue({
      release: { id: "release-1", version: "1.0.0" },
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await publishManagedRelease({
      kind: "template",
      slug: "private-starter",
      destination: "acme",
      cwd: root,
    })

    expect(mocks.begin).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "template",
        slug: "private-starter",
        destination: "acme",
        version: "1.0.0",
      })
    )
    expect(mocks.begin.mock.calls[0]?.[0]).not.toHaveProperty("repository")
    expect(fetchMock).toHaveBeenCalledWith(
      "https://upload.invalid/staging",
      expect.objectContaining({ method: "PUT" })
    )
    expect(mocks.finalize).toHaveBeenCalledWith({ uploadId: "upload-1" })
    expect(result).toMatchObject({ id: "release-1", version: "1.0.0" })
  })

  it("refuses a project with uncommitted changes before requesting an upload", async () => {
    const root = await makeCleanTemplate()
    await writeFile(join(root, "README.md"), "uncommitted edit")
    mocks.readAuth.mockReturnValue({ access_token: "test-token" })

    await expect(
      publishManagedRelease({
        kind: "template",
        slug: "private-starter",
        destination: "acme",
        cwd: root,
      })
    ).rejects.toThrow("clean Git working tree")
    expect(mocks.begin).not.toHaveBeenCalled()
  })
})
