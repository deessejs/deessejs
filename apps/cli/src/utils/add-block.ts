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
import { printJson } from "../output/index.js"

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

type ConfirmationInput = {
  isTTY?: boolean
  once: (event: "data", listener: (value: Buffer) => void) => unknown
  pause: () => void
}

export function confirmPlan(
  input: ConfirmationInput = process.stdin,
  writePrompt: (message: string) => void = (message) => {
    process.stderr.write(message)
  }
): Promise<boolean> {
  if (!input.isTTY)
    throw new Error(
      "Confirmation requires a TTY. Use --yes to confirm noninteractive writes or --dry-run to preview without writing."
    )
  writePrompt("Apply this plan? [y/N] ")
  return new Promise((resolve) =>
    input.once("data", (value) => {
      input.pause()
      resolve(["y", "yes"].includes(String(value).trim().toLowerCase()))
    })
  )
}

export async function runAddBlock(
  input: string,
  options: AddOptions
): Promise<void> {
  const json = options.json ?? (!options.verbose || !!options.json)
  try {
    await executeAdd(input, options, json)
  } catch (error) {
    reportAddError(error, json)
  }
}

async function executeAdd(
  input: string,
  options: AddOptions,
  json: boolean
): Promise<void> {
  const prepared = await resolveAddPlan(input, options)
  if (reportAlreadyInstalled(prepared, options, json)) return
  showAddPlan(prepared, options, json)
  if (reportDryRun(prepared, options, json)) return
  if (!(await confirmAdd(prepared, options, json))) return
  await applyAddPlan(prepared.cwd, prepared.plan.writes)
  await installDependencies(prepared, options.install, json)
  reportAddSuccess(prepared, options, json)
}

function reportAlreadyInstalled(
  prepared: PreparedAdd,
  options: AddOptions,
  json: boolean
): boolean {
  if (prepared.plan.writes.length) return false
  if (json)
    printJson({
      ok: true,
      command: "add",
      applied: false,
      alreadyInstalled: true,
      target: options.target,
    })
  else console.log("Already installed for this target and source revision.")
  return true
}

function showAddPlan(
  prepared: PreparedAdd,
  options: AddOptions,
  json: boolean
): void {
  if (options.verbose && !json) printAddPlan(prepared, options.target)
}

function reportDryRun(
  prepared: PreparedAdd,
  options: AddOptions,
  json: boolean
): boolean {
  if (!options.dryRun) return false
  if (json)
    printJson({
      ok: true,
      command: "add",
      applied: false,
      dryRun: true,
      plan: summarizePlan(prepared, options.target),
    })
  else console.log("Dry run complete. No files were changed.")
  return true
}

async function confirmAdd(
  prepared: PreparedAdd,
  options: AddOptions,
  json: boolean
): Promise<boolean> {
  if (options.yes) return true
  if (json)
    process.stderr.write(
      `Plan: ${prepared.plan.writes.length} file change${prepared.plan.writes.length === 1 ? "" : "s"} for target ${options.target}.\n`
    )
  const confirmed = await confirmPlan()
  if (confirmed) return true
  if (json)
    printJson({ ok: true, command: "add", applied: false, cancelled: true })
  else console.log("Cancelled. No files were changed.")
  return false
}

function reportAddSuccess(
  prepared: PreparedAdd,
  options: AddOptions,
  json: boolean
): void {
  if (json) return void printJson(addSuccessPayload(prepared, options))
  console.log(
    `Added ${prepared.source.descriptor.name} to target ${options.target}.`
  )
}

function addSuccessPayload(prepared: PreparedAdd, options: AddOptions) {
  return {
    ok: true,
    command: "add",
    applied: true,
    target: options.target,
    block: {
      name: prepared.source.descriptor.name,
      version: prepared.source.descriptor.version,
    },
    writes: summarizePlan(prepared, options.target).writes,
    dependenciesInstalled: !!options.install,
  }
}

function reportAddError(error: unknown, json: boolean): void {
  const message = error instanceof Error ? error.message : String(error)
  if (json)
    printJson({ ok: false, command: "add", code: "add_failed", message })
  else process.stderr.write(`Error: ${message}\n`)
  process.exitCode = 1
}

function summarizePlan(prepared: PreparedAdd, targetId: string) {
  return {
    block: {
      name: prepared.source.descriptor.name,
      version: prepared.source.descriptor.version,
    },
    target: targetId,
    writes: prepared.plan.writes.map((write) => ({
      action: write.previous ? "update" : "create",
      path: relative(prepared.cwd, write.path),
    })),
    manualSteps: prepared.plan.manualSteps,
  }
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
    resolveAddSource(input, options.ref, options.organization),
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
  shouldInstall = false,
  json = false
): Promise<void> {
  if (!shouldInstall) return
  const [command, ...args] = getInstallCommand(prepared.packageManager).split(
    " "
  )
  if (!command) throw new Error("Package manager install command is empty.")
  await spawn(command, args, {
    cwd: prepared.cwd,
    stdio: json ? "pipe" : "inherit",
  })
  if (!json) console.log("Dependencies installed.")
}
