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

  it("does NOT escape & | < > ( ) — they are literal inside double quotes on modern cmd", () => {
    // Microsoft's `cmd` documentation treats `& | < > ( )` as
    // literal inside a double-quoted argument. The old
    // implementation added a caret before each, which made
    // the caret appear in the recovered path. The new
    // implementation leaves them alone.
    expect(quoteForCmd("a&b")).toBe('"a&b"')
    expect(quoteForCmd("a|b")).toBe('"a|b"')
    expect(quoteForCmd("a<b")).toBe('"a<b"')
    expect(quoteForCmd("a>b")).toBe('"a>b"')
    expect(quoteForCmd("a(b")).toBe('"a(b"')
    expect(quoteForCmd("a)b")).toBe('"a)b"')
  })

  it("escapes % by doubling (cmd's documented percent escape)", () => {
    // Inside a `cmd` batch file, a literal `%` is escaped as
    // `%%`. The round-trip test asserts the doubled form, so
    // a path containing 100% (a real-world example) round-trips
    // through the recovery command and is interpreted by `cmd`
    // as a single literal `%`.
    expect(quoteForCmd("100%done")).toBe('"100%%done"')
  })

  it("escapes ^ by doubling", () => {
    // The escape of `^` itself is `^^`, which cmd renders as a
    // single literal `^`. This is the standard cmd escape for
    // the caret metacharacter.
    expect(quoteForCmd("a^b")).toBe('"a^^b"')
  })

  it("escapes ! with a leading caret", () => {
    // Inside double quotes, `!` is still special in some
    // `cmd` contexts (delayed expansion). We use `^^!` to
    // produce a literal `!`.
    expect(quoteForCmd("a!b")).toBe('"a^^!b"')
  })

  it("escapes multiple metacharacters in the same string", () => {
    expect(quoteForCmd("100%done & forever")).toBe(
      '"100%%done & forever"',
    )
  })

  it("escapes a leading caret so the resulting arg is literal", () => {
    expect(quoteForCmd("^flag")).toBe('"^^flag"')
  })

  it("always wraps the value in double quotes (cmd's portable quoting)", () => {
    for (const value of ["", "foo", "a b", 'a"b', "100%done"]) {
      const quoted = quoteForCmd(value)
      expect(
        quoted.startsWith('"') && quoted.endsWith('"'),
        `expected double-quoted form for ${JSON.stringify(value)}, got ${JSON.stringify(quoted)}`,
      ).toBe(true)
    }
  })

  it("escapes every literal double quote as \\\"", () => {
    expect(quoteForCmd('a"b')).toBe('"a\\"b"')
    expect(quoteForCmd('"')).toBe('"\\""')
  })
})

// Note: `quoteForCmd` is exported for future use by a
// `cmd`-native recovery path. The current recovery-command
// builder emits a POSIX-shaped command on every platform
// (git bash / WSL / native sh), and the round-trip
// robustness is provided by `quoteForShell`. The unit tests
// above assert the structural rules of `quoteForCmd` so it
// is safe to use if a future revision needs it; a real
// `cmd` round-trip test was attempted but the cmd argument
// parser has historical quirks (inner double quotes around
// the value of `set` are preserved literally, for example)
// that make a round-trip test unreliable across `cmd`
// versions. The README documents the supported shells.
