import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { resolveAddSource, resolveAddTarget, createAddPlan, applyAddPlan } =
  vi.hoisted(() => ({
    resolveAddSource: vi.fn(),
    resolveAddTarget: vi.fn(),
    createAddPlan: vi.fn(),
    applyAddPlan: vi.fn(),
  }))
vi.mock("../../src/utils/add-source.js", () => ({ resolveAddSource }))
vi.mock("../../src/utils/add-target.js", () => ({ resolveAddTarget }))
vi.mock("../../src/utils/add-plan.js", () => ({ createAddPlan }))
vi.mock("../../src/utils/add-executor.js", () => ({ applyAddPlan }))
vi.mock("../../src/utils/detect-pm.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/utils/detect-pm.js")>()
  return {
    ...actual,
    detectPackageManager: vi.fn(() => ({
      name: "pnpm",
      lockFile: "pnpm-lock.yaml",
    })),
  }
})

import { addCommand } from "../../src/commands/add.js"
import { confirmPlan } from "../../src/utils/add-block.js"

describe("add output and consent", () => {
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
    addCommand.setOptionValue("json", undefined)
    addCommand.setOptionValue("verbose", undefined)
    addCommand.setOptionValue("yes", undefined)
    addCommand.setOptionValue("dryRun", undefined)
    process.exitCode = undefined
    resolveAddSource.mockReset().mockResolvedValue({
      descriptor: { name: "Redis", version: "1.0.0" },
      files: [],
      identity: "redis",
      revision: "abc123",
    })
    resolveAddTarget
      .mockReset()
      .mockResolvedValue({
        path: "/tmp/project/packages/api",
        manifest: { name: "@acme/api" },
      })
    createAddPlan.mockReset().mockResolvedValue({
      writes: [
        {
          path: "/tmp/project/packages/api/redis.ts",
          contents: Buffer.from("export {}"),
        },
      ],
      manualSteps: [],
    })
    applyAddPlan.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    out.mockRestore()
    err.mockRestore()
    log.mockRestore()
    process.exitCode = undefined
  })

  async function run(flags: string[] = []) {
    await addCommand.parseAsync(["redis", "--target", "api", ...flags], {
      from: "user",
    })
  }

  it("emits a JSON dry-run by default with no human text on stdout", async () => {
    await run(["--dry-run"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      command: "add",
      applied: false,
      dryRun: true,
    })
    expect(stderr.join("")).toBe("")
    expect(applyAddPlan).not.toHaveBeenCalled()
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("passes the explicit organization scope into managed block resolution", async () => {
    await run(["--organization", "acme", "--dry-run"])
    expect(resolveAddSource).toHaveBeenCalledWith("redis", undefined, "acme")
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      dryRun: true,
    })
  })

  it("prints the plan in verbose mode and lets --json override verbose", async () => {
    await run(["--dry-run", "--verbose"])
    expect(stdout.join("")).toContain("Plan Redis 1.0.0")
    expect(stdout.join("")).toContain("Dry run complete")

    stdout = []
    log.mockClear()
    await run(["--dry-run", "--verbose", "--json"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({ dryRun: true })
    expect(log).not.toHaveBeenCalled()
  })

  it("requires explicit --yes for noninteractive JSON writes and keeps the prompt off stdout", async () => {
    await run()
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: false,
      command: "add",
      code: "add_failed",
      message: expect.stringContaining("--yes"),
    })
    expect(stdout.join("")).not.toContain("Apply this plan?")
    expect(stderr.join("")).toContain("Plan: 1 file change")
    expect(applyAddPlan).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it("applies writes only after explicit --yes consent", async () => {
    await run(["--yes"])
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      applied: true,
      target: "api",
    })
    expect(applyAddPlan).toHaveBeenCalledOnce()
    expect(stderr.join("")).toBe("")
    expect(process.exitCode ?? 0).toBe(0)
  })

  it("sends interactive confirmation to the provided prompt stream", async () => {
    const prompts: string[] = []
    const input = {
      isTTY: true,
      once: (_event: "data", listener: (value: Buffer) => void) =>
        listener(Buffer.from("y\n")),
      pause: vi.fn(),
    }
    await expect(
      confirmPlan(input, (message) => prompts.push(message))
    ).resolves.toBe(true)
    expect(prompts).toEqual(["Apply this plan? [y/N] "])
    expect(input.pause).toHaveBeenCalledOnce()
  })
})
