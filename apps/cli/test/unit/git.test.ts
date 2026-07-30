import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("../../src/utils/spawn.js", () => ({
  spawn: vi.fn(),
}))

import { cloneRepo } from "../../src/utils/git.js"
import { spawn } from "../../src/utils/spawn.js"

const mockSpawn = vi.mocked(spawn)

describe("cloneRepo", () => {
  beforeEach(() => {
    mockSpawn.mockReset()
  })

  it("falls back to master when main fails", async () => {
    mockSpawn
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
    const result = await cloneRepo("file:///fake", "/tmp/dest")
    expect(result.ref).toBe("master")
    expect(result.attempts).toEqual(["main", "master"])
    expect(mockSpawn).toHaveBeenCalledTimes(2)
  })

  it("uses explicit ref without fallback", async () => {
    mockSpawn.mockResolvedValue(0)
    const result = await cloneRepo("file:///fake", "/tmp/dest", "develop")
    expect(result.ref).toBe("develop")
    expect(mockSpawn).toHaveBeenCalledTimes(1)
  })

  it("throws gitNotInstalled when git binary is missing", async () => {
    mockSpawn
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(127)
    await expect(
      cloneRepo("file:///fake", "/tmp/dest"),
    ).rejects.toMatchObject({
      code: "git_not_installed",
    })
  })
})
