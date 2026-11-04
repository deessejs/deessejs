import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveBlockDescriptorInfo, checkBlockSource } = vi.hoisted(() => ({ resolveBlockDescriptorInfo: vi.fn(), checkBlockSource: vi.fn() }))
vi.mock("../../src/utils/resolve-block-info.js", () => ({ resolveBlockDescriptorInfo, checkBlockSource }))
vi.mock("ora", () => ({ default: () => ({ start() { return this }, succeed() {}, fail() {}, stop() {} }) }))

import { blockCommand } from "../../src/commands/block.js"

describe("block output modes", () => {
  let stdout: string[] = []
  beforeEach(() => {
    stdout = []
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { stdout.push(chunk.toString()); return true })
    resolveBlockDescriptorInfo.mockResolvedValue({
      descriptor: { name: "Demo", description: "Demo block", version: "1.0.0", formatVersion: 1, provides: [{ capability: "ui", provider: "demo", package: "demo" }], install: { packages: [], files: [] } },
      source: { type: "local", path: "." },
      packages: [],
    })
    checkBlockSource.mockResolvedValue({ source: { type: "local", path: "." }, descriptor: null, filesDeclared: 0, filesChecked: 0, packages: [], diagnostics: [] })
  })
  it("defaults block info to JSON and supports verbose", async () => {
    const info = blockCommand.commands.find((command) => command.name() === "info")
    expect(info).toBeDefined()
    if (!info) throw new Error("block info command missing")
    info.setOptionValue("json", undefined); info.setOptionValue("verbose", undefined)
    await blockCommand.parseAsync(["info", "."], { from: "user" })
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, command: "block info" })
    stdout = []
    info.setOptionValue("json", undefined); info.setOptionValue("verbose", undefined)
    await blockCommand.parseAsync(["info", ".", "--verbose"], { from: "user" })
    expect(stdout.join("")).toContain("Block")
  })
  it("defaults block check to JSON and supports verbose", async () => {
    const check = blockCommand.commands.find((command) => command.name() === "check")
    expect(check).toBeDefined()
    if (!check) throw new Error("block check command missing")
    check.setOptionValue("json", undefined); check.setOptionValue("verbose", undefined)
    await blockCommand.parseAsync(["check", "."], { from: "user" })
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, command: "block check" })
    stdout = []
    check.setOptionValue("json", undefined); check.setOptionValue("verbose", undefined)
    await blockCommand.parseAsync(["check", ".", "--verbose"], { from: "user" })
    expect(stdout.join("")).toContain("valid")
  })
})
