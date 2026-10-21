import { describe, expect, it } from "vitest"

import { quoteForPowerShell, quoteForShell } from "../../src/install/quote.js"

describe("quoteForShell", () => {
  it("quotes POSIX arguments and escapes embedded single quotes", () => {
    expect(quoteForShell("")).toBe("''")
    expect(quoteForShell("a b")).toBe("'a b'")
    expect(quoteForShell("o'reilly")).toBe("'o'\\''reilly'")
    expect(quoteForShell("a\\b")).toBe("'a\\b'")
    expect(quoteForShell("$1")).toBe("'$1'")
  })
})

describe("quoteForPowerShell", () => {
  it("quotes a literal argument and preserves metacharacters", () => {
    expect(quoteForPowerShell("")).toBe("''")
    expect(quoteForPowerShell("C:\\Users\\100%done & forever^oops")).toBe(
      "'C:\\Users\\100%done & forever^oops'",
    )
    expect(quoteForPowerShell("$env:HOME; Get-ChildItem")).toBe(
      "'$env:HOME; Get-ChildItem'",
    )
  })

  it("escapes embedded apostrophes by doubling them", () => {
    expect(quoteForPowerShell("O'Brien")).toBe("'O''Brien'")
    expect(quoteForPowerShell("C:\\Users\\Dave's folder")).toBe(
      "'C:\\Users\\Dave''s folder'",
    )
  })
})
