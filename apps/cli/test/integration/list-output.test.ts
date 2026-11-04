import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { fetchTemplates } = vi.hoisted(() => ({ fetchTemplates: vi.fn() }))
vi.mock("../../src/api/index.js", () => ({ fetchTemplates }))

import { listCommand } from "../../src/commands/list.js"

describe("list output modes", () => {
  let stdout: string[] = []
  let stderr: string[] = []
  let out: ReturnType<typeof vi.spyOn>
  let err: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { stdout.push(chunk.toString()); return true })
    err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => { stderr.push(chunk.toString()); return true })
  })
  async function run(args: string[]) {
    listCommand.setOptionValue("json", undefined)
    listCommand.setOptionValue("verbose", undefined)
    stdout = []; stderr = []
    await listCommand.parseAsync(args, { from: "user" })
  }
  afterEach(() => { out.mockRestore(); err.mockRestore(); vi.clearAllMocks() })
  it.each([
    { name: "default", args: [] },
    { name: "--json", args: ["--json"] },
  ])("prints one JSON result in $name mode", async ({ args }) => {
    fetchTemplates.mockResolvedValue([{ slug: "demo", name: "Demo", description: "", owner: "acme", repo: "demo", license: "MIT", category: "saas", labels: [] }])
    await run(args)
    expect(JSON.parse(stdout.join(""))).toEqual({
      templates: [expect.objectContaining({ slug: "demo", name: "Demo" })],
    })
    expect(stderr.join("")).toBe("")
  })
  it("keeps the human table in verbose mode", async () => {
    fetchTemplates.mockResolvedValue([])
    await run(["--verbose"])
    expect(stdout.join("")).toContain("No templates available")
    expect(stdout.join("")).not.toContain("Fetching templates")
  })
})
