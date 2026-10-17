import { afterEach, describe, expect, it, vi } from "vitest"

// Hoist the mock so the import of node:child_process inside resolveTemplateSha
// picks up the mocked module before the import is resolved.
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}))

import { execFile } from "node:child_process"

import { resolveTemplateSha } from "../../src/source/resolve-sha.js"

const mockedExecFile = vi.mocked(execFile)

const mockExecFile = (
  fn: (
    cmd: string,
    args: string[],
  ) =>
    | { kind: "ok"; stdout: string }
    | { kind: "err"; message: string }
    | { kind: "throw"; err: Error },
): void => {
  mockedExecFile.mockImplementation((cmd, args, _opts, cb) => {
    const result = fn(cmd as string, args as string[])
    const callback = cb as unknown as (
      err: Error | null,
      out: string,
    ) => void
    if (result.kind === "ok") {
      callback(null, result.stdout)
    } else if (result.kind === "err") {
      callback(new Error(result.message), "")
    } else {
      // Some invocations propagate via rejection rather than the callback.
      // We don't currently exercise that path; throw a clear error if hit.
      throw new Error("unhandled variant in test mock")
    }
    return undefined as unknown as ReturnType<typeof execFile>
  })
}

describe("resolveTemplateSha", () => {
  afterEach(() => {
    mockedExecFile.mockReset()
  })

  it("parses the SHA from a normal git ls-remote output", async () => {
    const sha = "abcdef0123456789abcdef0123456789abcdef01"
    mockExecFile((cmd, args) => {
      if (cmd === "git" && args[0] === "ls-remote") {
        return { kind: "ok", stdout: `${sha}\trefs/heads/main\n` }
      }
      return { kind: "err", message: "unexpected call" }
    })

    const got = await resolveTemplateSha({
      owner: "deessejs",
      repo: "saas-template",
      ref: "main",
    })
    expect(got).toBe(sha)
  })

  it("throws source_failed when the response has no lines and git is installed", async () => {
    mockExecFile((cmd, args) => {
      if (cmd === "git" && args[0] === "ls-remote") {
        return { kind: "ok", stdout: "\n" }
      }
      if (cmd === "git" && args[0] === "--version") {
        return { kind: "ok", stdout: "git version 2.42.0\n" }
      }
      return { kind: "err", message: "unexpected call" }
    })

    await expect(
      resolveTemplateSha({
        owner: "deessejs",
        repo: "saas-template",
        ref: "main",
      }),
    ).rejects.toThrow(/could not resolve template source/)
  })

  it("throws gitNotInstalled when git --version also fails (after a no-line response)", async () => {
    mockExecFile((cmd, args) => {
      if (cmd === "git" && args[0] === "ls-remote") {
        return { kind: "ok", stdout: "\n" }
      }
      if (cmd === "git" && args[0] === "--version") {
        return { kind: "err", message: "ENOENT" }
      }
      return { kind: "err", message: "unexpected call" }
    })

    await expect(
      resolveTemplateSha({
        owner: "deessejs",
        repo: "saas-template",
        ref: "main",
      }),
    ).rejects.toThrow(/not installed or not on PATH/)
  })

  it("throws source_failed when the SHA column is malformed", async () => {
    mockExecFile((cmd, args) => {
      if (cmd === "git" && args[0] === "ls-remote") {
        return { kind: "ok", stdout: "not-a-sha\trefs/heads/main\n" }
      }
      return { kind: "err", message: "unexpected call" }
    })

    await expect(
      resolveTemplateSha({
        owner: "deessejs",
        repo: "saas-template",
        ref: "main",
      }),
    ).rejects.toThrow(/malformed SHA/)
  })
})
