import { readFile } from "node:fs/promises"
import { join, relative } from "node:path"
import { fromAsyncThrowable } from "@deessejs/fp"
import { detectPackageManager } from "./detect-pm.js"
import type { PackageManagerInfo } from "./detect-pm.js"
import { resolveAddSource } from "./add-source.js"
import { resolveAddTarget } from "./add-target.js"
import { createAddPlan } from "./add-plan.js"
import { applyAddPlan } from "./add-executor.js"
import {
  BlockStateSchema,
  type AddOptions,
  type BlockState,
  type CreateAddPlanArgs,
} from "./add-types.js"
import { getInstallCommand } from "./detect-pm.js"
import { spawn } from "./spawn.js"

type AddInputs = {
  cwd: string
  source: Awaited<ReturnType<typeof resolveAddSource>>
  target: Awaited<ReturnType<typeof resolveAddTarget>>
  packageManager: PackageManagerInfo
}

type PreparedAdd = AddInputs & {
  statePath: string
  plan: Awaited<ReturnType<typeof createAddPlan>>
}

async function readState(path: string): Promise<BlockState> {
  const result = await fromAsyncThrowable({
    onSuccess: async () =>
      BlockStateSchema.parse(JSON.parse(await readFile(path, "utf8"))),
    onError: (cause) => cause,
  })

  return result.match({
    ok: (state) => state,
    err: (cause) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
        return { version: 1, installations: [] }

      throw new Error(
        "Cannot read valid .deesse/blocks.json installation state."
      )
    },
  })
}

function confirmPlan(): Promise<boolean> {
  if (!process.stdin.isTTY)
    throw new Error(
      "Confirmation requires a TTY. Use --dry-run to preview without writes."
    )
  process.stdout.write("Apply this plan? [y/N] ")
  return new Promise((resolve) =>
    process.stdin.once("data", (value) => {
      process.stdin.pause()
      resolve(["y", "yes"].includes(String(value).trim().toLowerCase()))
    })
  )
}

export async function runAddBlock(
  input: string,
  options: AddOptions
): Promise<void> {
  const prepared = await resolveAddPlan(input, options)
  if (!prepared.plan.writes.length) {
    console.log("Already installed for this target and source revision.")
    return
  }
  printAddPlan(prepared, options.target)
  if (options.dryRun)
    return void console.log("Dry run complete. No files were changed.")
  if (!(await confirmPlan()))
    return void console.log("Cancelled. No files were changed.")
  await applyAddPlan(prepared.cwd, prepared.plan.writes)
  console.log(
    `Added ${prepared.source.descriptor.name} to target ${options.target}.`
  )
  await installDependencies(prepared, options.install)
}

async function resolveAddPlan(
  input: string,
  options: AddOptions
): Promise<PreparedAdd> {
  const cwd = process.cwd()
  const inputs = await resolveAddInputs(cwd, input, options)
  const statePath = join(cwd, ".deesse", "blocks.json")
  const state = await readState(statePath)
  const plan = await createAddPlan(
    buildPlanArguments(inputs, options.target, statePath, state)
  )
  return { ...inputs, statePath, plan }
}

function buildPlanArguments(
  inputs: AddInputs,
  targetId: string,
  statePath: string,
  state: BlockState
): CreateAddPlanArgs {
  return {
    cwd: inputs.cwd,
    targetId,
    targetPath: inputs.target.path,
    targetManifest: inputs.target.manifest,
    descriptor: inputs.source.descriptor,
    files: inputs.source.files,
    identity: inputs.source.identity,
    revision: inputs.source.revision,
    state,
    statePath,
    packageManager: inputs.packageManager,
  }
}

async function resolveAddInputs(
  cwd: string,
  input: string,
  options: AddOptions
): Promise<AddInputs> {
  const [source, target, packageManager] = await Promise.all([
    resolveAddSource(input, options.ref),
    resolveAddTarget(cwd, options.target),
    Promise.resolve(detectPackageManager(cwd)),
  ])
  if (!packageManager) throw new Error("No supported package manager detected.")
  return { cwd, source, target, packageManager }
}

function printAddPlan(prepared: PreparedAdd, targetId: string): void {
  const { cwd, source, target, plan } = prepared
  console.log(
    `Plan ${source.descriptor.name} ${source.descriptor.version} -> ${targetId} (${target.manifest.name})`
  )
  for (const write of plan.writes)
    console.log(
      `  ${write.previous ? "update" : "create"} ${relative(cwd, write.path)}`
    )
  for (const step of plan.manualSteps) console.log(`  manual step: ${step}`)
  if (source.descriptor.name === "upstash-redis")
    console.log(
      "  manual step: Create an Upstash Redis database and set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your local environment. This command never handles credential values or provisions an account."
    )
}

async function installDependencies(
  prepared: PreparedAdd,
  shouldInstall = false
): Promise<void> {
  if (!shouldInstall) return
  const [command, ...args] = getInstallCommand(prepared.packageManager).split(
    " "
  )
  if (!command) throw new Error("Package manager install command is empty.")
  await spawn(command, args, { cwd: prepared.cwd, stdio: "inherit" })
  console.log("Dependencies installed.")
}
