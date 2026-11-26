import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
  readAuth,
  resolveTemplateSource,
  resolveManagedTemplateInstallationPlan,
  materializeTemplatePlan,
  resolveProjectConfig,
} = vi.hoisted(() => ({
  readAuth: vi.fn(() => ({ access_token: "org-token" })),
  resolveTemplateSource: vi.fn(),
  resolveManagedTemplateInstallationPlan: vi.fn(),
  materializeTemplatePlan: vi.fn(),
  resolveProjectConfig: vi.fn(),
}))
vi.mock("../../src/lib/auth/store/store.js", () => ({ readAuth }))
vi.mock("../../src/utils/resolve-template.js", () => ({
  resolveTemplateSource,
}))
vi.mock("../../src/utils/template-plan.js", () => ({
  resolveManagedTemplateInstallationPlan,
}))
vi.mock("../../src/utils/materialize.js", () => ({ materializeTemplatePlan }))
vi.mock("../../src/utils/project-config.js", () => ({ resolveProjectConfig }))
vi.mock("../../src/utils/detect-pm.js", () => ({
  detectPackageManager: vi.fn(() => null),
}))
vi.mock("ora", () => ({
  default: () => ({
    start() {
      return this
    },
    succeed() {
      return this
    },
    fail() {
      return this
    },
  }),
}))

import { initCommand } from "../../src/commands/init.js"

describe("organization template init output", () => {
  let stdout: string[]
  let stderr: string[]
  let out: ReturnType<typeof vi.spyOn>
  let err: ReturnType<typeof vi.spyOn>
  let log: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdout = []
    stderr = []
    out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout.push(chunk.toString())
      return true
    })
    err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr.push(chunk.toString())
      return true
    })
    log = vi.spyOn(console, "log").mockImplementation((...values) => {
      stdout.push(`${values.join(" ")}\n`)
    })
    initCommand.setOptionValue("json", undefined)
    initCommand.setOptionValue("verbose", undefined)
    initCommand.setOptionValue("organization", undefined)
    initCommand.setOptionValue("install", undefined)
    process.exitCode = undefined
    const plan = { source: { revision: "abc123" }, files: [] }
    resolveManagedTemplateInstallationPlan
      .mockReset()
      .mockResolvedValue({ plan, requiresManaged: true })
    materializeTemplatePlan.mockReset().mockResolvedValue(undefined)
    resolveProjectConfig.mockReset().mockReturnValue({
      match: (handlers: { ok: (value: unknown) => unknown }) =>
        handlers.ok({ plan, generated: false }),
    })
    resolveTemplateSource.mockReset()
  })

  afterEach(() => {
    out.mockRestore()
    err.mockRestore()
    log.mockRestore()
    process.exitCode = undefined
  })

  async function run(flags: string[] = []) {
    await initCommand.parseAsync(
      ["starter", "--organization", "acme", "--no-install", ...flags],
      { from: "user" }
    )
  }

  it("resolves the explicit organization scope and emits JSON by default", async () => {
    await run()
    expect(resolveTemplateSource).not.toHaveBeenCalled()
    expect(resolveManagedTemplateInstallationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "starter",
        organizationSlug: "acme",
        accessToken: "org-token",
      })
    )
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      slug: "starter",
      installed: false,
    })
    expect(stderr.join("")).toBe("")
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("uses human output for --verbose and keeps JSON when --json overrides it", async () => {
    await run(["--verbose"])
    expect(stdout.join("")).toContain("Initializing starter")
    expect(stdout.join("")).toContain("Next steps")
    expect(stderr.join("")).toContain("Template source")

    stdout = []
    stderr = []
    log.mockClear()
    await run(["--verbose", "--json"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      slug: "starter",
    })
    expect(log).not.toHaveBeenCalled()
    expect(stderr.join("")).toContain("Template source")
  })

  it("returns a JSON error and nonzero exit for managed resolution failures", async () => {
    resolveManagedTemplateInstallationPlan.mockRejectedValue(
      new Error("managed resolver unavailable")
    )
    const exit = vi.spyOn(process, "exit").mockImplementation(((
      code?: number
    ) => {
      throw Object.assign(new Error("exit"), { exitCode: code })
    }) as never)
    try {
      await expect(run()).rejects.toMatchObject({ exitCode: 1 })
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        code: "internal",
      })
      expect(stderr.join("")).toBe("")
    } finally {
      exit.mockRestore()
    }
  })
})
