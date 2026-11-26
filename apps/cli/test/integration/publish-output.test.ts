import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { publishManagedRelease } = vi.hoisted(() => ({
  publishManagedRelease: vi.fn(),
}))
vi.mock("../../src/utils/publish-release.js", () => ({ publishManagedRelease }))

import {
  blockPublishCommand,
  templatePublishCommand,
} from "../../src/commands/publish.js"

const release = {
  alreadyPublished: false,
  id: "release-1",
  slug: "starter",
  version: "1.2.0",
  digest: "a".repeat(64),
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe.each([
  { kind: "template", command: templatePublishCommand },
  { kind: "block", command: blockPublishCommand },
])("$kind publish output", ({ kind, command }) => {
  let stdout: string[]
  let stderr: string[]
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdout = []
    stderr = []
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        stdout.push(chunk.toString())
        return true
      })
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk) => {
        stderr.push(chunk.toString())
        return true
      })
    command.setOptionValue("json", undefined)
    command.setOptionValue("verbose", undefined)
    process.exitCode = undefined
    publishManagedRelease.mockReset().mockResolvedValue(release)
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
    process.exitCode = undefined
  })

  async function run(flags: string[] = []) {
    await command.parseAsync(
      ["--slug", "starter", "--destination", "acme", ...flags],
      { from: "user" }
    )
  }

  it("writes JSON by default and keeps stdout clean", async () => {
    await run()
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, kind })
    expect(stderr.join("")).toBe("")
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("uses human output for --verbose", async () => {
    await run(["--verbose"])
    expect(stdout.join("")).toContain("Published starter@1.2.0")
    expect(() => JSON.parse(stdout.join(""))).toThrow()
    expect(stderr.join("")).toBe("")
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("keeps JSON when --verbose and --json are combined", async () => {
    await run(["--verbose", "--json"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, kind })
    expect(stdout.join("")).not.toContain("Published starter")
    expect(stderr.join("")).toBe("")
  })
})

describe("publish output failures", () => {
  let stdout: string[]
  let stderr: string[]
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdout = []
    stderr = []
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        stdout.push(chunk.toString())
        return true
      })
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk) => {
        stderr.push(chunk.toString())
        return true
      })
    templatePublishCommand.setOptionValue("json", undefined)
    templatePublishCommand.setOptionValue("verbose", undefined)
    process.exitCode = undefined
    publishManagedRelease.mockRejectedValue(new Error("upload rejected"))
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
    process.exitCode = undefined
  })

  it("returns a JSON error on stdout and a nonzero exit code", async () => {
    await templatePublishCommand.parseAsync(
      ["--slug", "starter", "--destination", "acme"],
      { from: "user" }
    )
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: false,
      command: "template publish",
      code: "publish_failed",
      message: "upload rejected",
    })
    expect(stderr.join("")).toBe("")
    expect(process.exitCode).toBe(1)
  })
})
