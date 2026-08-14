import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  printJson,
  printError,
  printTemplatesTable,
  printTemplateInfo,
} from "../../src/output/index.js"
import type { Template } from "../../src/api/index.js"
import { CliError } from "../../src/errors/index.js"

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

  it("printTemplateInfo prints all fields", () => {
    printTemplateInfo(sampleTemplate)
    const joined = stdoutWrites.join("")
    expect(joined).toContain("saas-starter")
    expect(joined).toContain("SaaS Starter")
    expect(joined).toContain("Production-ready")
    expect(joined).toContain("MIT")
    expect(joined).toContain("acme/saas-starter")
    expect(joined).toContain("nextjs, saas")
  })
})
