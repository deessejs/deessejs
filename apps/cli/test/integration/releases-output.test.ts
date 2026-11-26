import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { listReleases, readAuth } = vi.hoisted(() => ({
  listReleases: vi.fn(),
  readAuth: vi.fn(() => undefined),
}))
vi.mock("../../src/api/client.js", () => ({
  orpc: { managedReleases: { list: listReleases } },
  createAuthenticatedORPCClient: vi.fn(() => ({
    managedReleases: { list: listReleases },
  })),
}))
vi.mock("../../src/lib/auth/store/store.js", () => ({ readAuth }))

import { releasesCommand } from "../../src/commands/releases.js"

function stripAnsi(value: string): string {
  let output = ""
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) !== 0x1b || value[index + 1] !== "[") {
      output += value[index]
      continue
    }
    index += 2
    while (index < value.length) {
      const code = value.charCodeAt(index)
      if (code >= 0x40 && code <= 0x7e) break
      index += 1
    }
  }
  return output
}

describe("managed release listing output", () => {
  let stdout: string[]
  let stderr: string[]
  let out: ReturnType<typeof vi.spyOn>
  let err: ReturnType<typeof vi.spyOn>
  let log: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdout = []
    stderr = []
    out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout.push(chunk.toString())
      return true
    })
    err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(chunk.toString())
      return true
    })
    log = vi.spyOn(console, "log").mockImplementation((...values) => {
      stdout.push(`${values.join(" ")}\n`)
    })
    releasesCommand.setOptionValue("json", undefined)
    releasesCommand.setOptionValue("verbose", undefined)
    releasesCommand.setOptionValue("organization", undefined)
    process.exitCode = undefined
    listReleases
      .mockReset()
      .mockResolvedValue({
        releases: [
          {
            slug: "starter",
            version: "1.2.0",
            kind: "template",
            ownerType: "platform",
            hasPreview: false,
          },
        ],
      })
  })

  afterEach(() => {
    out.mockRestore()
    err.mockRestore()
    log.mockRestore()
    process.exitCode = undefined
  })

  async function run(flags: string[] = []) {
    await releasesCommand.parseAsync(flags, { from: "user" })
  }

  it("emits JSON by default", async () => {
    await run()
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      releases: [{ slug: "starter" }],
    })
    expect(stderr.join("")).toBe("")
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("uses human output with --verbose and JSON when --json overrides it", async () => {
    await run(["--verbose"])
    expect(stripAnsi(stdout.join(""))).toContain("starter 1.2.0")
    expect(stderr.join("")).toBe("")

    stdout = []
    log.mockClear()
    await run(["--verbose", "--json"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      releases: [{ slug: "starter" }],
    })
    expect(log).not.toHaveBeenCalled()
  })

  it("returns one JSON error on stdout and sets a failure exit code", async () => {
    listReleases.mockRejectedValue(new Error("release lookup failed"))
    await run()
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: false,
      code: "release_list_failed",
    })
    expect(stderr.join("")).toBe("")
    expect(process.exitCode).toBe(1)
  })
})
