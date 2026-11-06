import { readFile } from "node:fs/promises"
import { join, relative } from "node:path"
import { detectPackageManager } from "./detect-pm.js"
import { resolveAddSource } from "./add-source.js"
import { resolveAddTarget } from "./add-target.js"
import { createAddPlan } from "./add-plan.js"
import { applyAddPlan } from "./add-executor.js"
import { BlockStateSchema, type AddOptions, type BlockState } from "./add-types.js"
import { getInstallCommand } from "./detect-pm.js"
import { spawn } from "./spawn.js"

async function readState(path: string): Promise<BlockState> {
  try {
    return BlockStateSchema.parse(JSON.parse(await readFile(path, "utf8")))
  } catch (error) {
    if (error instanceof SyntaxError || !(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw new Error("Cannot read valid .deesse/blocks.json installation state.")
    return { version: 1, installations: [] }
  }
}

function confirmPlan(): Promise<boolean> {
  if (!process.stdin.isTTY) throw new Error("Confirmation requires a TTY. Use --dry-run to preview without writes.")
  process.stdout.write("Apply this plan? [y/N] ")
  return new Promise((resolve) => process.stdin.once("data", (value) => {
    process.stdin.pause()
    resolve(["y", "yes"].includes(String(value).trim().toLowerCase()))
  }))
}

export async function runAddBlock(input: string, options: AddOptions): Promise<void> {
  const cwd = process.cwd()
  const [source, target, packageManager] = await Promise.all([
    resolveAddSource(input, options.ref),
    resolveAddTarget(cwd, options.target),
    Promise.resolve(detectPackageManager(cwd)),
  ])
  if (!packageManager) throw new Error("No supported package manager detected.")
  const statePath = join(cwd, ".deesse", "blocks.json")
  const state = await readState(statePath)
  const plan = await createAddPlan({ cwd, targetId: options.target, targetPath: target.path, targetManifest: target.manifest, descriptor: source.descriptor, files: source.files, identity: source.identity, revision: source.revision, state, statePath, packageManager })
  if (!plan.writes.length) { console.log("Already installed for this target and source revision."); return }
  console.log(`Plan ${source.descriptor.name} ${source.descriptor.version} -> ${options.target} (${target.manifest.name})`)
  for (const write of plan.writes) console.log(`  ${write.previous ? "update" : "create"} ${relative(cwd, write.path)}`)
  for (const step of plan.manualSteps) console.log(`  manual step: ${step}`)
  if (source.descriptor.name === "upstash-redis") console.log("  manual step: Create an Upstash Redis database and set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your local environment. This command never handles credential values or provisions an account.")
  if (options.dryRun) {
    console.log("Dry run complete. No files were changed.")
    return
  }
  if (!(await confirmPlan())) {
    console.log("Cancelled. No files were changed.")
    return
  }
  await applyAddPlan(cwd, plan.writes)
  console.log(`Added ${source.descriptor.name} to target ${options.target}.`)
  if (options.install) {
    const [command, ...args] = getInstallCommand(packageManager).split(" ")
    if (!command) throw new Error("Package manager install command is empty.")
    await spawn(command, args, { cwd, stdio: "inherit" })
    console.log("Dependencies installed.")
  }
}
