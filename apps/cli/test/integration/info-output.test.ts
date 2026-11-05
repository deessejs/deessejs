import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveTemplateSource, resolveTemplateDescriptorInfo } = vi.hoisted(() => ({
  resolveTemplateSource: vi.fn(),
  resolveTemplateDescriptorInfo: vi.fn(),
}))
vi.mock("../../src/utils/resolve-template.js", () => ({ resolveTemplateSource }))
vi.mock("../../src/utils/template-plan.js", () => ({ resolveTemplateDescriptorInfo }))

import { infoCommand } from "../../src/commands/info.js"

describe("info output modes", () => {
  let stdout: string[] = []
  beforeEach(() => {
    stdout = []
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { stdout.push(chunk.toString()); return true })
    resolveTemplateSource.mockResolvedValue({ template: { owner: "acme", repo: "demo", slug: "demo", community: false }, directRepository: null })
    resolveTemplateDescriptorInfo.mockResolvedValue({ descriptor: { title: "Demo" }, source: { repository: "acme/demo" } })
  })
  it.each([{ args: [] }, { args: ["--json"] }])("prints JSON $args", async ({ args }) => {
    infoCommand.setOptionValue("json", undefined); infoCommand.setOptionValue("verbose", undefined)
    await infoCommand.parseAsync(["demo", ...args], { from: "user" })
    expect(JSON.parse(stdout.join(""))).toMatchObject({ descriptor: { title: "Demo" } })
  })
  it("prints human output with verbose", async () => {
    infoCommand.setOptionValue("json", undefined); infoCommand.setOptionValue("verbose", undefined)
    await infoCommand.parseAsync(["demo", "--verbose"], { from: "user" })
    expect(stdout.join("")).toContain("Template descriptor")
  })
})
