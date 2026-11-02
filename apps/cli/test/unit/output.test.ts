import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  printJson,
  printError,
  printTemplatesTable,
  printTemplateInfo,
  printOrganizationTemplatesTable,
} from "../../src/output/index.js"
import type { Template } from "../../src/api/index.js"
import { CliError } from "../../src/errors/index.js"
import type { NormalizedTemplateDescriptorV1 } from "@workspace/registry/v1"

const sampleTemplate: Template = {
  slug: "saas-starter",
  name: "SaaS Starter",
  description: "Production-ready Next.js + Auth + DB.",
  owner: "acme",
  repo: "saas-starter",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "saas"],
}

const sampleDescriptor: NormalizedTemplateDescriptorV1 = {
  $schema: "https://app.deessejs.com/schema/template/v1.json",
  formatVersion: 1,
  name: "saas-template",
  title: "SaaS Template",
  description: "Manifest description.",
  type: "template:app",
  version: "1.2.3",
  source: { repo: "acme/saas-starter" },
  includes: ["**/*"],
  excludes: ["deesse-template.json"],
  author: "Acme",
  license: "MIT",
  category: "saas",
  labels: ["nextjs", "auth"],
}

const sampleSource = {
  repository: "acme/saas-starter",
}

describe("print", () => {
  let stdoutWrites: string[]
  let stderrWrites: string[]
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdoutWrites = []
    stderrWrites = []
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        stdoutWrites.push(chunk.toString())
        return true
      })
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk) => {
        stderrWrites.push(chunk.toString())
        return true
      })
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  it("printJson produces valid JSON ending with newline", () => {
    printJson({ foo: "bar" })
    const joined = stdoutWrites.join("")
    expect(JSON.parse(joined)).toEqual({ foo: "bar" })
    expect(joined).toMatch(/\n$/)
  })

  it("printError includes code, message, and hint when present", () => {
    const err = new CliError("internal", "boom", "try this")
    printError(err)
    const joined = stderrWrites.join("")
    expect(joined).toContain("boom")
    expect(joined).toContain("try this")
    expect(joined).toContain("internal")
  })

  it("printError skips hint line when hint is absent", () => {
    const err = new CliError("internal", "boom")
    printError(err)
    const joined = stderrWrites.join("")
    expect(joined).toContain("boom")
    expect(joined).not.toContain("Hint")
  })

  it("printTemplatesTable renders header and rows", () => {
    printTemplatesTable([sampleTemplate])
    const joined = stdoutWrites.join("")
    expect(joined).toContain("slug")
    expect(joined).toContain("name")
    expect(joined).toContain("saas-starter")
    expect(joined).toContain("SaaS Starter")
  })

  it("printTemplatesTable prints fallback for empty array", () => {
    printTemplatesTable([])
    const joined = stdoutWrites.join("")
    expect(joined).toContain("No templates available")
  })

  it("prints organization templates using the shared aligned table format", () => {
    printOrganizationTemplatesTable([
      {
        id: "00000000-0000-4000-8000-000000000001",
        slug: "starter-kit",
        name: "A particularly long starter template name",
        description: "",
        owner: "acme",
        repo: "starter",
        category: "saas",
        labels: [],
        license: "MIT",
        canonicalUrl: "https://github.com/acme/starter",
        repositoryName: "starter",
        stars: null,
        fetchedAt: "2026-01-01T00:00:00.000Z",
        currentlyPublished: false,
        publication: null,
      },
    ])
    expect(stdoutWrites.join("")).toBe(
      "slug         name                                       ownership           publication  review       \n" +
        "starter-kit  A particularly long starter template name  organization-owned  unpublished  not submitted\n"
    )
  })

  it("printTemplateInfo only prints validated descriptor fields", () => {
    printTemplateInfo(sampleDescriptor, sampleSource)
    const joined = stdoutWrites.join("")
    expect(joined).toContain("Template descriptor")
    expect(joined).toContain("SaaS Template")
    expect(joined).toContain("Manifest description.")
    expect(joined).toContain("template:app")
    expect(joined).toContain("1.2.3")
    expect(joined).toContain("MIT")
    expect(joined).toContain("acme/saas-starter")
    expect(joined).toContain("source")
  })

  it("prints the same descriptor output regardless of catalog membership", () => {
    printTemplateInfo(sampleDescriptor, sampleSource)
    const joined = stdoutWrites.join("")
    expect(joined).toContain("Template descriptor")
    expect(joined).toContain("SaaS Template")
    expect(joined).toContain("acme/saas-starter")
  })
})
