import { describe, expect, it } from "vitest"

import { CliError } from "../../src/errors/index.js"
import { validateProjectName } from "../../src/name/validate.js"

describe("validateProjectName", () => {
  const ok = (name: string) => {
    expect(() => validateProjectName(name)).not.toThrow()
  }
  const fails = (name: string, code: string = "invalid_name") => {
    try {
      validateProjectName(name)
      throw new Error(`expected validateProjectName(${JSON.stringify(name)}) to throw`)
    } catch (err) {
      expect(err).toBeInstanceOf(CliError)
      expect((err as CliError).code).toBe(code)
    }
  }

  it("accepts simple lowercase names", () => {
    ok("my-app")
    ok("foo")
    ok("a")
  })

  it("accepts names with dots, dashes, underscores, tildes", () => {
    ok("foo.bar")
    ok("foo_bar")
    ok("foo-bar")
    ok("foo~bar")
  })

  it("accepts the longest legal name (214 chars)", () => {
    const name = "a".repeat(214)
    ok(name)
  })

  it("rejects empty names", () => {
    fails("")
  })

  it("rejects names longer than 214 characters", () => {
    fails("a".repeat(215))
  })

  it("rejects names with leading dots", () => {
    fails(".foo")
  })

  it("rejects names with leading underscores", () => {
    fails("_foo")
  })

  it("rejects scoped names", () => {
    fails("@scope/foo")
  })

  it("rejects names with leading whitespace", () => {
    fails(" foo")
  })

  it("rejects names with trailing whitespace", () => {
    fails("foo ")
  })

  it("rejects uppercase names", () => {
    fails("MyApp")
  })

  it("rejects names with illegal characters", () => {
    fails("foo!")
    fails("foo bar") // space
    fails("foo/bar") // slash
  })
})