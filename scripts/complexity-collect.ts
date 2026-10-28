#!/usr/bin/env tsx
/**
 * Walk every workspace under apps/* and packages/* and run Oxlint with its
 * JSON formatter, writing `reports/complexity/<pkg>.json`.
 *
 * Run via `pnpm complex:collect`. The aggregator `scripts/complexity-report.ts`
 * consumes the resulting files. Designed for the Turbo task `complexity:json`.
 */

import { readdir, mkdir, writeFile, readFile } from "node:fs/promises"
import { join, resolve, dirname } from "node:path"
import { spawn } from "node:child_process"

const REPORTS_DIR = "reports/complexity"

interface Workspace {
  name: string
  path: string
}

const ENTRY_GLOBS = ["apps", "packages"]

function packageSlug(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase()
}

async function resolveWorkspaces(): Promise<Workspace[]> {
  const workspaces = await Promise.all(ENTRY_GLOBS.map(resolveRootWorkspaces))
  return workspaces.flat()
}

async function resolveRootWorkspaces(root: string): Promise<Workspace[]> {
  let entries: string[]
  try {
    entries = await readdir(root, { withFileTypes: false })
  } catch {
    return []
  }

  const workspaces: Workspace[] = []
  for (const entry of entries) {
    const workspace = await readWorkspaceManifest(join(root, entry))
    if (workspace) workspaces.push(workspace)
  }
  return workspaces
}

async function readWorkspaceManifest(path: string): Promise<Workspace | null> {
  let raw: string
  try {
    raw = await readFile(join(path, "package.json"), "utf8")
  } catch {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null || !("name" in parsed)) {
    return null
  }
  return typeof parsed.name === "string" ? { name: parsed.name, path } : null
}

function runOxlintJson(workspace: Workspace, outFile: string): Promise<number> {
  return new Promise((resolveRun, rejectRun) => {
    let stdout = ""
    const child = spawn(
      "pnpm",
      [
        "exec",
        "oxlint",
        "--config",
        ".oxlintrc.json",
        "--format",
        "json",
        workspace.path,
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "inherit"],
        env: { ...process.env, NODE_ENV: "production" },
      }
    )
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.on("error", rejectRun)
    child.on("close", async (code) => {
      try {
        let report: {
          diagnostics?: { filename: string }[]
          number_of_files?: number
          number_of_rules?: number
        }
        try {
          report = JSON.parse(stdout)
        } catch (error) {
          if (!stdout.includes("No files found to lint")) throw error
          report = { diagnostics: [], number_of_files: 0, number_of_rules: 0 }
        }
        await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8")
        // Oxlint exits 1 when it reports lint findings; the JSON remains valid.
        resolveRun(code === 0 || code === 1 ? 0 : (code ?? 0))
      } catch (error) {
        rejectRun(error)
      }
    })
  })
}

async function main(): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true })
  const workspaces = await resolveWorkspaces()
  if (workspaces.length === 0) {
    console.error(
      "[complexity-collect] no workspaces found under apps/* or packages/*"
    )
    process.exit(2)
  }

  const failures: string[] = []
  for (const workspace of workspaces) {
    const slug = packageSlug(workspace.name)
    const outFile = resolve(REPORTS_DIR, `${slug}.json`)
    try {
      const code = await runOxlintJson(workspace, outFile)
      if (code !== 0 && code !== 2) {
        failures.push(`${workspace.name} (exit ${code})`)
        continue
      }
      // Oxlint writes a JSON object for clean and populated runs.
      console.log(
        `[complexity-collect] wrote ${dirname(outFile)}/${slug}.json (workspace=${workspace.name})`
      )
    } catch (error) {
      failures.push(
        `${workspace.name} (${error instanceof Error ? error.message : String(error)})`
      )
    }
  }

  // Touch the aggregator result file so the workflow's `hashFiles` check works
  // even when no JSON was produced (e.g. all packages clean).
  if (failures.length > 0) {
    await writeFile(
      join(REPORTS_DIR, "collector-errors.json"),
      `${JSON.stringify({ failures }, null, 2)}\n`,
      "utf8"
    )
  }

  if (failures.length > 0) {
    console.error(
      "[complexity-collect] failed to report in:",
      failures.join(", ")
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error("[complexity-collect] unexpected failure:", error)
  process.exit(2)
})
