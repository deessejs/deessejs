import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.hoisted(() => ({
  resolve: vi.fn(),
  authenticated: vi.fn(),
  createManagedAdapter: vi.fn(),
  createInstallationPlan: vi.fn(),
  downloadArchive: vi.fn(),
}))
vi.mock("../../src/api/client.js", () => ({
  orpc: { managedReleases: { resolve: rpc.resolve } },
  createAuthenticatedORPCClient: rpc.authenticated,
}))
vi.mock("../../src/utils/download-managed-archive.js", () => ({
  downloadManagedArchive: rpc.downloadArchive,
}))
vi.mock("@workspace/registry/v1", () => ({
  createTemplateDescriptorInfo: vi.fn(),
  createGitHubTemplateSourceAdapter: vi.fn(),
  createTemplateInstallationPlan: rpc.createInstallationPlan,
  createManagedTemplateSourceAdapter: rpc.createManagedAdapter,
}))

import { resolveManagedTemplateInstallationPlan } from "../../src/utils/template-plan.js"

describe("managed template resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rpc.authenticated.mockReturnValue({
      managedReleases: { resolve: rpc.resolve },
    })
    rpc.resolve.mockResolvedValue({ release: null, requiresManaged: true })
    rpc.downloadArchive.mockResolvedValue(new Uint8Array([1]))
    rpc.createManagedAdapter.mockResolvedValue({})
    rpc.createInstallationPlan.mockResolvedValue({
      success: true,
      plan: {
        descriptor: { title: "Managed" },
        source: { repository: "managed" },
      },
    })
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
    expect(result).toEqual({ plan: null, requiresManaged: true, preview: null })
  })

  it("marks protected platform templates as managed-only when no release is ready", async () => {
    const result = await resolveManagedTemplateInstallationPlan({
      slug: "managed-starter",
    })
    expect(rpc.resolve).toHaveBeenCalledWith({
      kind: "template",
      slug: "managed-starter",
    })
    expect(result).toEqual({ plan: null, requiresManaged: true, preview: null })
  })

  it("passes the signed optional preview through the managed resolver", async () => {
    rpc.resolve.mockResolvedValue({
      release: {
        id: "release-id",
        version: "1.0.0",
        digest: "a".repeat(64),
        downloadUrl: "https://r2.invalid/archive?signature=short",
        preview: "https://r2.invalid/preview?signature=short",
      },
      requiresManaged: true,
    })

    const result = await resolveManagedTemplateInstallationPlan({
      slug: "managed-starter",
    })

    expect(result.preview).toBe("https://r2.invalid/preview?signature=short")
  })

  it("passes an absent preview through as null", async () => {
    rpc.resolve.mockResolvedValue({
      release: {
        id: "release-id",
        version: "1.0.0",
        digest: "a".repeat(64),
        downloadUrl: "https://r2.invalid/archive?signature=short",
        preview: null,
      },
      requiresManaged: true,
    })

    const result = await resolveManagedTemplateInstallationPlan({
      slug: "managed-starter",
    })

    expect(result.preview).toBeNull()
  })
})
