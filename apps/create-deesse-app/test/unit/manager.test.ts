import { describe, expect, it } from "vitest"

import { SUPPORTED_MANAGERS, getManager } from "../../src/pm/index.js"
import { pnpm } from "../../src/pm/pnpm.js"

describe("pm registry", () => {
  it("SUPPORTED_MANAGERS contains only pnpm in this increment", () => {
    expect(SUPPORTED_MANAGERS).toEqual(["pnpm"])
  })

  it("getManager('pnpm') returns the pnpm implementation", () => {
    expect(getManager("pnpm").id).toBe("pnpm")
  })

  it("pnpm install command is `corepack pnpm install` for the corepack strategy", () => {
    expect(pnpm.installCommand("corepack", "11.0.0")).toEqual({
      bin: "corepack",
      args: ["pnpm", "install"],
    })
  })

  it("pnpm install command is `npm exec --yes -- pnpm@<v> install` for the npm-exec strategy", () => {
    expect(pnpm.installCommand("npm-exec", "11.0.0")).toEqual({
      bin: "npm",
      args: ["exec", "--yes", "--", "pnpm@11.0.0", "install"],
    })
  })

  it("pnpm install command is `pnpm install` for the pnpm-direct strategy", () => {
    expect(pnpm.installCommand("pnpm-direct", "11.0.0")).toEqual({
      bin: "pnpm",
      args: ["install"],
    })
  })

  it("pnpm lockfile name is pnpm-lock.yaml", () => {
    expect(pnpm.lockfileName).toBe("pnpm-lock.yaml")
  })

  it("pnpm requiresCorepack is false in this increment", () => {
    // The flag is informational: the install command itself
    // decides. See pm/manager.ts for the rationale.
    expect(pnpm.requiresCorepack).toBe(false)
  })
})
