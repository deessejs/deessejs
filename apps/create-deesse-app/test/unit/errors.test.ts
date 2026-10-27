import { describe, expect, it } from "vitest"

import {
  CliError,
  destinationExists,
  gitNotInstalled,
  installFailed,
  internal,
  invalidName,
  networkError,
  sourceFailed,
  unsupportedManager,
  unsafeArchive,
} from "../../src/errors/index.js"
import { EXIT_ERROR } from "../../src/constants/exit.js"

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

  it("exitCode() returns EXIT_ERROR", () => {
    expect(new CliError("internal", "boom").exitCode()).toBe(EXIT_ERROR)
  })
})

describe("error factories", () => {
  it("invalidName returns invalid_name with the reason in the message", () => {
    const err = invalidName("Bad..Name", "contains illegal characters")
    expect(err.code).toBe("invalid_name")
    expect(err.message).toContain("Bad..Name")
    expect(err.message).toContain("illegal characters")
  })

  it("destinationExists hints at --dir", () => {
    const err = destinationExists("/tmp/foo")
    expect(err.code).toBe("destination_exists")
    expect(err.message).toContain("/tmp/foo")
    expect(err.hint).toContain("--dir")
  })

  it("unsafeArchive reports count and first reason", () => {
    const err = unsafeArchive([
      "a/../escape: path traversal",
      "symlink-x: symbolic links are rejected",
    ])
    expect(err.code).toBe("unsafe_archive")
    expect(err.message).toContain("2 unsafe entries")
    expect(err.hint).toContain("path traversal")
  })

  it("unsafeArchive singularizes for one entry", () => {
    const err = unsafeArchive(["a: bad"])
    expect(err.message).toContain("1 unsafe entry")
    expect(err.message).not.toContain("entries")
  })

  it("unsupportedManager suggests pnpm dlx", () => {
    const err = unsupportedManager("npm")
    expect(err.code).toBe("unsupported_manager")
    expect(err.hint).toContain("pnpm dlx")
  })

  it("networkError carries a detail string", () => {
    const err = networkError("503 service unavailable")
    expect(err.code).toBe("network_error")
    expect(err.hint).toContain("503")
  })

  it("sourceFailed and gitNotInstalled share the source_failed code", () => {
    expect(sourceFailed("nope").code).toBe("source_failed")
    expect(gitNotInstalled().code).toBe("source_failed")
  })

  it("installFailed reports manager and exit code", () => {
    const err = installFailed("pnpm", 1)
    expect(err.code).toBe("install_failed")
    expect(err.message).toContain("pnpm")
    expect(err.message).toContain("code 1")
  })

  it("installFailed tolerates null exit code", () => {
    const err = installFailed("pnpm", null)
    expect(err.message).toContain("unknown")
  })

  it("internal produces the internal code", () => {
    expect(internal("oops").code).toBe("internal")
  })
})
