import { afterEach, describe, expect, it, vi } from "vitest"

// Hoist the mock so the import of node:child_process inside resolveTemplateSha
// picks up the mocked module before the import is resolved.
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}))

import { execFile } from "node:child_process"

import { resolveTemplateSha } from "../../src/source/resolve-sha.js"

const mockedExecFile = vi.mocked(execFile)

describe("resolveTemplateSha", () => {
  afterEach(() => {
    mockedExecFile.mockReset()
  })

  it("parses the SHA from a normal git ls-remote output", async () => {
    const sha = "abcdef0123456789abcdef0123456789abcdef01"
    mockedExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      const callback = cb as unknown as (err: Error | null, out: string) => void
      callback(null, `${sha}\trefs/heads/main\n`)
      return undefined as unknown as ReturnType<typeof execFile>
    })

    const got = await resolveTemplateSha({
      owner: "deessejs",
      repo: "saas-template",
      ref: "main",
    })
    expect(got).toBe(sha)
  })

  it("throws source_failed when the response has no lines", async () => {
    mockedExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      const callback = cb as unknown as (err: Error | null, out: string) => void
      callback(null, "\n")
      return undefined as unknown as ReturnType<typeof execFile>
    })

    await expect(
      resolveTemplateSha({
        owner: "deessejs",
        repo: "saas-template",
        ref: "main",
      }),
    ).rejects.toThrow(/could not resolve template source/)
  })
})