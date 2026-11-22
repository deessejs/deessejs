import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

let isHostAllowed: typeof import("../src/host-allowlist.js").isHostAllowed

beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "development")
  const hostAllowlist = await import("../src/host-allowlist.js")
  isHostAllowed = hostAllowlist.isHostAllowed
})

afterAll(() => vi.unstubAllEnvs())

describe("isHostAllowed", () => {
  it("allows first-party hosts and previews belonging to our Vercel projects", () => {
    expect(isHostAllowed("deessejs.com")).toBe(true)
    expect(isHostAllowed("app.deessejs.com")).toBe(true)
    expect(
      isHostAllowed("deessejs-app-git-staging-aliiibenns-projects.vercel.app"),
    ).toBe(true)
    expect(
      isHostAllowed("deessejs-web-git-feature-branch-aliiibenns-projects.vercel.app"),
    ).toBe(true)
  })

  it("rejects arbitrary Vercel projects and lookalike team suffixes", () => {
    expect(isHostAllowed("attacker.vercel.app")).toBe(false)
    expect(
      isHostAllowed("deessejs-app-git-pr-123-attacker.vercel.app"),
    ).toBe(false)
    expect(
      isHostAllowed("deessejs-app-git-pr-123-someone-elses-projects.vercel.app"),
    ).toBe(false)
    expect(
      isHostAllowed("attacker-git-staging-aliiibenns-projects.vercel.app"),
    ).toBe(false)
  })

  it("allows localhost hosts with a port in development", () => {
    expect(isHostAllowed("localhost:3001")).toBe(true)
    expect(isHostAllowed("localhost:43127")).toBe(true)
    expect(isHostAllowed("notlocalhost:3001")).toBe(false)
  })

  it("rejects values that are not host names", () => {
    expect(isHostAllowed("https://localhost:3001")).toBe(false)
    expect(isHostAllowed("user@localhost:3001")).toBe(false)
  })
})
