import { describe, expect, it } from "vitest"

import { validateEntry, type Entry } from "../../src/extract/validate-entry.js"

describe("validateEntry", () => {
  const ok = (entry: Entry) => {
    expect(validateEntry(entry)).toEqual({ ok: true })
  }
  const fails = (entry: Entry, reasonMatch: RegExp | string) => {
    const result = validateEntry(entry)
    expect(result.ok).toBe(false)
    if (result.ok) return
    const allReasons = result.failures.map((f) => f.reason).join(" | ")
    if (typeof reasonMatch === "string") {
      expect(allReasons).toContain(reasonMatch)
    } else {
      expect(reasonMatch.test(allReasons)).toBe(true)
    }
  }

  it("accepts a regular file", () => {
    ok({ path: "LICENSE", type: "File" })
    ok({ path: "package.json", type: "File" })
    ok({ path: "src/index.ts", type: "File" })
  })

  it("accepts a directory", () => {
    ok({ path: "src", type: "Directory" })
    ok({ path: "src/utils", type: "Directory" })
  })

  it("accepts OldFile alias", () => {
    ok({ path: "LICENSE", type: "OldFile" })
  })

  it("rejects symbolic links", () => {
    fails({ path: "link", type: "SymbolicLink" }, "symbolic links")
  })

  it("rejects absolute POSIX paths", () => {
    fails({ path: "/etc/passwd", type: "File" }, "absolute path")
  })

  it("rejects absolute Windows paths", () => {
    fails({ path: "C:/Windows", type: "File" }, "absolute path")
    fails({ path: "D:\\foo", type: "File" }, /backslash|absolute path/)
  })

  it("rejects path traversal", () => {
    fails({ path: "../../etc/passwd", type: "File" }, /traversal|absolute/i)
  })

  it("rejects empty path segments", () => {
    fails({ path: "foo//bar", type: "File" }, "empty path segment")
  })

  it("rejects block devices, FIFOs, char devices, contiguous files", () => {
    fails(
      { path: "dev", type: "BlockDevice" },
      /unsupported entry type|absolute path/
    )
    fails(
      { path: "pipe", type: "FIFO" },
      /unsupported entry type|absolute path/
    )
    fails(
      { path: "chr", type: "CharacterDevice" },
      /unsupported entry type|absolute path/
    )
    fails(
      { path: "ctg", type: "ContiguousFile" },
      /unsupported entry type|absolute path/
    )
  })

  it("accepts a path that just happens to normalize to itself", () => {
    // "src/index.ts" normalizes to "/src/index.ts" on path.posix, but
    // the entry is relative — the path matches the input so it stays valid.
    ok({ path: "src/index.ts", type: "File" })
  })
})
