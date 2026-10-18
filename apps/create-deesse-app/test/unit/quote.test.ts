import { describe, expect, it } from "vitest"

import { quoteForCmd, quoteForShell } from "../../src/install/quote.js"

describe("quoteForShell", () => {
  it("wraps every non-empty string in single quotes", () => {
    // POSIX shell semantics: even a string with no special
    // characters must be quoted so the quoting is uniform and
    // the parser knows where the argument starts and ends.
    expect(quoteForShell("foo")).toBe("'foo'")
  })

  it("returns '' for the empty string", () => {
    expect(quoteForShell("")).toBe("''")
  })

  it("wraps a string with spaces in single quotes", () => {
    expect(quoteForShell("foo bar")).toBe("'foo bar'")
  })

  it("escapes embedded single quotes (POSIX rule)", () => {
    // The standard "close, escape, reopen" pattern:
    //   'o'reilly' becomes 'o'\''reilly'
    expect(quoteForShell("o'reilly")).toBe("'o'\\''reilly'")
  })

  it("preserves shell metacharacters inside the quotes", () => {
    expect(quoteForShell("$1")).toBe("'$1'")
    expect(quoteForShell("a;b&c")).toBe("'a;b&c'")
  })

  it("handles backslashes literally inside the quotes", () => {
    // Backslashes are not special inside single quotes in sh.
    expect(quoteForShell("a\\b")).toBe("'a\\b'")
  })

  it("escapes every embedded single quote", () => {
    expect(quoteForShell("a'b'c")).toBe("'a'\\''b'\\''c'")
  })
})

describe("quoteForCmd", () => {
  it("wraps every non-empty string in double quotes", () => {
    expect(quoteForCmd("foo")).toBe('"foo"')
  })

  it('returns "" for the empty string', () => {
    expect(quoteForCmd("")).toBe('""')
  })

  it("wraps a string with spaces in double quotes", () => {
    expect(quoteForCmd("foo bar")).toBe('"foo bar"')
  })

  it("escapes embedded double quotes (cmd rule)", () => {
    // The "double-quote, backslash, double-quote" pattern.
    expect(quoteForCmd('a"b')).toBe('"a\\"b"')
  })

  it("escapes cmd metacharacters with a leading caret", () => {
    // & | < > ( ) % ! ^ are cmd metacharacters outside
    // double quotes. Inside our double-quoted argument we
    // prefix each with a caret so cmd treats them as literals.
    expect(quoteForCmd("a&b")).toBe('"a^&b"')
    expect(quoteForCmd("a|b")).toBe('"a^|b"')
    expect(quoteForCmd("a<b")).toBe('"a^<b"')
    expect(quoteForCmd("a>b")).toBe('"a^>b"')
    expect(quoteForCmd("a(b")).toBe('"a^(b"')
    expect(quoteForCmd("a)b")).toBe('"a^)b"')
    expect(quoteForCmd("a%b")).toBe('"a^%b"')
    expect(quoteForCmd("a!b")).toBe('"a^!b"')
    expect(quoteForCmd("a^b")).toBe('"a^^b"')
  })

  it("escapes multiple metacharacters in the same string", () => {
    expect(quoteForCmd("100%done & forever")).toBe(
      '"100^%done ^& forever"',
    )
  })

  it("escapes a leading caret so the resulting arg is literal", () => {
    // The escape of `^` itself is `^^`, which cmd renders as a
    // single literal `^`.
    expect(quoteForCmd("^flag")).toBe('"^^flag"')
  })
})
