import { mkdtempSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createUpdatePlan,
  runGlobalUpdate,
} from "../../src/commands/update/action.js"
import { executeUpdateCommand } from "../../src/commands/update/command.js"
import { detectCliInstallation } from "../../src/commands/update/installation.js"
import type {
  CliInstallation,
  UpdateCommandDependencies,
} from "../../src/commands/update/types.js"
import { fetchLatestStableCliVersion } from "../../src/commands/update/version.js"

const temporaryPaths: string[] = []
const makeDirectory = (path: string): string => {
  mkdirSync(path, { recursive: true })
  return path
}

afterEach(() => {
  for (const path of temporaryPaths.splice(0))
    rmSync(path, { recursive: true, force: true })
})

describe("update plan", () => {
  it("selects explicit persistent and manual actions", () => {
    expect(
      createUpdatePlan(
        { kind: "global", manager: "npm", globalRoot: "/global" },
        "3.0.0",
        "3.1.0"
      )
    ).toMatchObject({
      kind: "run-global-update",
      command: "npm",
      args: ["install", "-g", "@deessejs/cli@latest"],
    })
    expect(
      createUpdatePlan(
        { kind: "global", manager: "pnpm", globalRoot: "/global" },
        "3.0.0",
        "3.1.0"
      )
    ).toMatchObject({
      kind: "run-global-update",
      command: "pnpm",
      args: ["add", "-g", "@deessejs/cli@latest"],
    })
    expect(
      createUpdatePlan({ kind: "ephemeral", launcher: "npx" }, "3.0.0", "3.1.0")
    ).toMatchObject({
      kind: "show-manual-command",
      manualCommand: "npx @deessejs/cli@latest",
    })
    expect(
      createUpdatePlan(
        { kind: "ephemeral", launcher: "pnpm-dlx" },
        "3.0.0",
        "3.1.0"
      )
    ).toMatchObject({
      kind: "show-manual-command",
      manualCommand: "pnpm dlx @deessejs/cli@latest",
    })
    expect(
      createUpdatePlan({ kind: "unknown" }, "3.0.0", "3.1.0")
    ).toMatchObject({
      kind: "show-manual-command",
      manualCommand: "npm install -g @deessejs/cli@latest",
    })
  })

  it("does not probe package-manager roots when already current", async () => {
    const detectInstallation = vi.fn(async (): Promise<CliInstallation> => ({
      kind: "unknown",
    }))
    const writeJson = vi.fn()
    const exitCode = await executeUpdateCommand(
      false,
      dependencies({ latest: "3.0.0", detectInstallation, writeJson })
    )
    expect(exitCode).toBe(0)
    expect(detectInstallation).not.toHaveBeenCalled()
    expect(writeJson).toHaveBeenCalledWith(
      expect.objectContaining({ status: "up-to-date", updated: false })
    )
  })

  it.each([
    ["npm", ["install", "-g", "@deessejs/cli@latest"]],
    ["pnpm", ["add", "-g", "@deessejs/cli@latest"]],
  ] as const)(
    "uses expected %s update arguments",
    async (manager, expectedArgs) => {
      const runCommand = vi.fn(async () => ({ code: 0, signal: null }))
      const plan = createUpdatePlan(
        { kind: "global", manager, globalRoot: "/global" },
        "3.0.0",
        "3.1.0"
      )
      if (plan.kind !== "run-global-update")
        throw new Error("expected global update plan")
      const result = await runGlobalUpdate(plan, runCommand as never)
      expect(runCommand).toHaveBeenCalledWith(manager, expectedArgs, {
        stdio: "pipe",
      })
      expect(result.status).toBe("updated")
    }
  )

  it("prints a distinct useful verbose failure and returns nonzero", async () => {
    const writeHuman = vi.fn()
    const runUpdate = vi.fn(
      async (plan: Parameters<typeof runGlobalUpdate>[0]) =>
        runGlobalUpdate(plan, async () => ({ code: 7, signal: null }))
    )
    const exitCode = await executeUpdateCommand(
      true,
      dependencies({
        latest: "3.1.0",
        detectInstallation: async () => ({
          kind: "global",
          manager: "npm",
          globalRoot: "/global",
        }),
        runUpdate,
        writeHuman,
      })
    )
    expect(exitCode).toBe(1)
    expect(writeHuman).toHaveBeenCalledWith(
      expect.stringContaining("Update to 3.1.0 failed")
    )
    expect(writeHuman).toHaveBeenCalledWith(
      expect.stringContaining("npm install -g @deessejs/cli@latest")
    )
  })

  it("emits a structured JSON failure and nonzero result for a failed installer", async () => {
    const writeJson = vi.fn()
    const exitCode = await executeUpdateCommand(
      false,
      dependencies({
        latest: "3.1.0",
        detectInstallation: async () => ({
          kind: "global",
          manager: "pnpm",
          globalRoot: "/global",
        }),
        runUpdate: async (plan) =>
          runGlobalUpdate(plan, async () => ({ code: 2, signal: null })),
        writeJson,
      })
    )
    expect(exitCode).toBe(1)
    expect(writeJson).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "update-failed",
        ok: false,
        code: "update_failed",
        manualCommand: "pnpm add -g @deessejs/cli@latest",
      })
    )
  })

  it.each([
    [{ kind: "ephemeral", launcher: "npx" }, "npx @deessejs/cli@latest"],
    [
      { kind: "ephemeral", launcher: "pnpm-dlx" },
      "pnpm dlx @deessejs/cli@latest",
    ],
    [{ kind: "unknown" }, "npm install -g @deessejs/cli@latest"],
  ] as const)(
    "returns manual guidance for %s without spawning an installer",
    async (installation, manualCommand) => {
      const runUpdate = vi.fn()
      const writeJson = vi.fn()
      await executeUpdateCommand(
        false,
        dependencies({
          latest: "3.1.0",
          detectInstallation: async () => installation,
          runUpdate,
          writeJson,
        })
      )
      expect(runUpdate).not.toHaveBeenCalled()
      expect(writeJson).toHaveBeenCalledWith(
        expect.objectContaining({ manualCommand })
      )
    }
  )
})

describe("installation detection", () => {
  it.each([
    [
      "npm/11 node/v22",
      "/cache/_npx/abc/node_modules/@deessejs/cli/bin.js",
      "npx",
    ],
    [
      "pnpm/10 node/v22",
      "/cache/dlx/abc/node_modules/@deessejs/cli/bin.js",
      "pnpm-dlx",
    ],
  ] as const)(
    "recognizes ephemeral launcher context",
    async (userAgent, executablePath, launcher) => {
      const result = await detectCliInstallation({
        userAgent,
        executablePath,
        runCommand: vi.fn(),
      })
      expect(result).toEqual({ kind: "ephemeral", launcher })
    }
  )

  it("recognizes a matching global npm package root", async () => {
    const base = mkdtempSync(join(tmpdir(), "deessejs-update-"))
    temporaryPaths.push(base)
    const root = makeDirectory(join(base, "node_modules"))
    const packageRoot = makeDirectory(join(root, "@deessejs", "cli"))
    const result = await detectCliInstallation({
      packageRoot,
      executablePath: "/usr/bin/deessejs",
      userAgent: "",
      runCommand: async () => ({ code: 0, stdout: `${root}\n` }),
    })
    expect(result).toEqual({ kind: "global", manager: "npm", globalRoot: root })
  })
})

describe("stable npm version lookup", () => {
  it("distinguishes malformed metadata from registry/network errors", async () => {
    await expect(
      fetchLatestStableCliVersion(async () => new Response("{}"))
    ).rejects.toMatchObject({ code: "invalid_registry_response" })
    await expect(
      fetchLatestStableCliVersion(async () => new Response("", { status: 503 }))
    ).rejects.toMatchObject({ code: "registry_error" })
    await expect(
      fetchLatestStableCliVersion(async () => {
        throw new Error("offline")
      })
    ).rejects.toThrow("Could not reach the npm registry: offline")
  })
})

function dependencies(
  overrides: Partial<UpdateCommandDependencies> & { latest?: string } = {}
) {
  const { latest = "3.1.0", ...rest } = overrides
  return {
    readCurrentVersion: () => "3.0.0",
    fetchLatestVersion: async () => latest,
    detectInstallation: async (): Promise<CliInstallation> => ({
      kind: "unknown",
    }),
    runUpdate: runGlobalUpdate,
    writeJson: vi.fn(),
    writeHuman: vi.fn(),
    writeError: vi.fn(),
    ...rest,
  }
}
