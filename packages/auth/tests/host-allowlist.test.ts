import { describe, expect, it } from "vitest"

import { isHostAllowed } from "../src/host-allowlist.js"

describe("isHostAllowed", () => {
  it("allows first-party hosts and previews belonging to our Vercel projects", () => {
    expect(isHostAllowed("deessejs.com")).toBe(true)
    expect(isHostAllowed("app.deessejs.com")).toBe(true)
    // The team scope the organisation uses today.
    expect(
      isHostAllowed("deessejs-app-git-staging-deessejs.vercel.app"),
    ).toBe(true)
    expect(
      isHostAllowed("deessejs-web-git-feature-branch-deessejs.vercel.app"),
    ).toBe(true)
    // The scope the organisation used before the rename. A preview
    // branch that predates it keeps the old suffix.
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
    expect(
      isHostAllowed("attacker-git-staging-deessejs.vercel.app"),
    ).toBe(false)
  })
})
