import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  resolveTemplateSource,
  resolveTemplateDescriptorInfo,
  resolveManagedTemplateInstallationPlan,
} = vi.hoisted(() => ({
  resolveTemplateSource: vi.fn(),
  resolveTemplateDescriptorInfo: vi.fn(),
  resolveManagedTemplateInstallationPlan: vi.fn(),
}))
vi.mock("../../src/utils/resolve-template.js", () => ({
  resolveTemplateSource,
}))
vi.mock("../../src/utils/template-plan.js", () => ({
  resolveTemplateDescriptorInfo,
  resolveManagedTemplateInstallationPlan,
}))

import { infoCommand } from "../../src/commands/info.js"

describe("info output modes", () => {
  let stdout: string[] = []
  beforeEach(() => {
    stdout = []
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout.push(chunk.toString())
      return true
    })
    resolveTemplateSource.mockResolvedValue({
      template: { owner: "acme", repo: "demo", slug: "demo", community: false },
      directRepository: null,
    })
    resolveTemplateDescriptorInfo.mockResolvedValue({
      descriptor: { title: "Demo" },
      source: { repository: "acme/demo" },
    })
    resolveManagedTemplateInstallationPlan.mockResolvedValue({
      plan: {
        descriptor: { title: "Managed" },
        source: { repository: "managed-release:id" },
      },
      requiresManaged: true,
      preview: null,
    })
  })
  it.each([{ args: [] }, { args: ["--json"] }])(
    "prints JSON $args",
    async ({ args }) => {
      infoCommand.setOptionValue("json", undefined)
      infoCommand.setOptionValue("verbose", undefined)
      await infoCommand.parseAsync(["demo", ...args], { from: "user" })
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        descriptor: { title: "Demo" },
      })
    }
  )
  it("prints human output with verbose", async () => {
    infoCommand.setOptionValue("json", undefined)
    infoCommand.setOptionValue("verbose", undefined)
    await infoCommand.parseAsync(["demo", "--verbose"], { from: "user" })
    expect(stdout.join("")).toContain("Template descriptor")
  })

  it("includes a managed archive preview in JSON info when available", async () => {
    resolveTemplateSource.mockResolvedValue({
      template: { slug: "private-starter", sourceType: "managed" },
      directRepository: null,
    })
    resolveManagedTemplateInstallationPlan.mockResolvedValue({
      plan: {
        descriptor: { title: "Private starter" },
        source: { repository: "managed-release:id" },
      },
      requiresManaged: true,
      preview: "https://r2.invalid/preview?signature=short",
    })
    infoCommand.setOptionValue("json", undefined)
    infoCommand.setOptionValue("verbose", undefined)

    await infoCommand.parseAsync(["private-starter"], { from: "user" })

    expect(JSON.parse(stdout.join(""))).toMatchObject({
      previewImageUrl: "https://r2.invalid/preview?signature=short",
    })
  })

  it("keeps managed info valid when its release has no preview", async () => {
    resolveTemplateSource.mockResolvedValue({
      template: { slug: "private-starter", sourceType: "managed" },
      directRepository: null,
    })
    infoCommand.setOptionValue("json", undefined)
    infoCommand.setOptionValue("verbose", undefined)

    await infoCommand.parseAsync(["private-starter", "--json"], {
      from: "user",
    })

    expect(JSON.parse(stdout.join(""))).not.toHaveProperty("previewImageUrl")
  })
})
