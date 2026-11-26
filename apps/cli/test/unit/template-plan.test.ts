import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.hoisted(() => ({ resolve: vi.fn(), authenticated: vi.fn() }))
vi.mock("../../src/api/client.js", () => ({
  orpc: { managedReleases: { resolve: rpc.resolve } },
  createAuthenticatedORPCClient: rpc.authenticated,
}))

import { resolveManagedTemplateInstallationPlan } from "../../src/utils/template-plan.js"

describe("managed template resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rpc.authenticated.mockReturnValue({
      managedReleases: { resolve: rpc.resolve },
    })
    rpc.resolve.mockResolvedValue({ release: null, requiresManaged: true })
  })

  it("uses the explicit organization scope and authenticated client", async () => {
    const result = await resolveManagedTemplateInstallationPlan({
      slug: "starter",
      repository: "owner/repo",
      organizationSlug: "acme",
      accessToken: "fixture-token",
    })
    expect(rpc.authenticated).toHaveBeenCalledWith("fixture-token")
    expect(rpc.resolve).toHaveBeenCalledWith({
      kind: "template",
      slug: "starter",
      organizationSlug: "acme",
    })
    expect(result).toEqual({ plan: null, requiresManaged: true })
  })

  it("marks protected platform templates as managed-only when no release is ready", async () => {
    const result = await resolveManagedTemplateInstallationPlan({
      slug: "managed-starter",
    })
    expect(rpc.resolve).toHaveBeenCalledWith({
      kind: "template",
      slug: "managed-starter",
    })
    expect(result).toEqual({ plan: null, requiresManaged: true })
  })
})
