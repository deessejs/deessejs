import { describe, it, expect } from "vitest"
import {
  CliError,
  installFailed,
  internal,
  networkError,
  notFound,
  parseError,
  targetExists,
} from "../../src/errors/index.js"

describe("CliError", () => {
  it("constructor sets code, message, and hint", () => {
    const err = new CliError("internal", "boom", "try this")
    expect(err.code).toBe("internal")
    expect(err.message).toBe("boom")
    expect(err.hint).toBe("try this")
  })

  it("constructor accepts missing hint", () => {
    const err = new CliError("internal", "boom")
    expect(err.hint).toBeUndefined()
  })

  it("exitCode() returns 1", () => {
    expect(new CliError("internal", "boom").exitCode()).toBe(1)
  })
})

describe("error factories", () => {
  it("notFound includes available slugs in hint", () => {
    const err = notFound("foo", ["bar", "baz"])
    expect(err.code).toBe("not_found")
    expect(err.message).toContain("foo")
    expect(err.hint).toContain("bar")
    expect(err.hint).toContain("baz")
  })

  it("targetExists hints at --force", () => {
    const err = targetExists("/tmp/foo")
    expect(err.code).toBe("target_exists")
    expect(err.message).toContain("/tmp/foo")
    expect(err.hint).toContain("--force")
  })

  it("each factory returns the expected code", () => {
    expect(networkError("x").code).toBe("network_error")
    expect(installFailed("pnpm", 1, "project").code).toBe("install_failed")
    expect(installFailed("pnpm", 1, "project").hint).toContain(
      'Run "pnpm install" from "project"'
    )
    expect(parseError("x").code).toBe("parse_error")
    expect(internal("x").code).toBe("internal")
  })
})
