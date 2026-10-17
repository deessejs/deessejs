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

  it("pnpm install command is `pnpm install`", () => {
    expect(pnpm.installCommand()).toEqual({ bin: "pnpm", args: ["install"] })
  })

  it("pnpm lockfile name is pnpm-lock.yaml", () => {
    expect(pnpm.lockfileName).toBe("pnpm-lock.yaml")
  })
})