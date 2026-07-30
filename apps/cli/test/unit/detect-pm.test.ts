import { describe, it, expect, afterEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  parsePackageManagerField,
  getInstallCommand,
  detectPackageManager,
} from "../../src/utils/detect-pm.js"

let dir: string | null = null
afterEach(() => {
  if (dir) {
    rmSync(dir, { recursive: true, force: true })
    dir = null
  }
})

describe("parsePackageManagerField", () => {
  it("parses pnpm@9.0.0", () => {
    expect(parsePackageManagerField("pnpm@9.0.0")).toEqual({
      pm: "pnpm",
      raw: "pnpm@9.0.0",
    })
  })

  it("parses npm without version", () => {
    expect(parsePackageManagerField("npm")).toEqual({ pm: "npm", raw: "npm" })
  })

  it("returns null for unrecognized name", () => {
    expect(parsePackageManagerField("yarn-classic")).toBeNull()
  })
})

describe("getInstallCommand", () => {
  it("returns the right command per package manager", () => {
    expect(getInstallCommand({ pm: "pnpm" })).toBe("pnpm install")
    expect(getInstallCommand({ pm: "npm" })).toBe("npm install")
    expect(getInstallCommand({ pm: "yarn" })).toBe("yarn install")
    expect(getInstallCommand({ pm: "bun" })).toBe("bun install")
  })
})

describe("detectPackageManager", () => {
  it("respects packageManager field over lockfile", async () => {
    dir = mkdtempSync(join(tmpdir(), "detpm-"))
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ packageManager: "pnpm@9.0.0" }),
    )
    const result = await detectPackageManager(dir)
    expect(result).toEqual({ pm: "pnpm", raw: "pnpm@9.0.0" })
  })

  it("returns null when no package.json and no lockfile", async () => {
    dir = mkdtempSync(join(tmpdir(), "detpm-"))
    expect(await detectPackageManager(dir)).toBeNull()
  })
})
