import { relative, resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import {
  PROJECT_CONFIG_SCHEMA_URL,
  parseProjectConfig,
  type TemplateInstallationPlan,
} from "@workspace/registry/v1"
import {
  CliError,
  installFailed,
  internal,
  templateInvalid,
} from "../errors/index.js"
import { printError, printJson } from "../output/index.js"
import {
  detectPackageManager,
  getInstallCommand,
  type PackageManagerInfo,
} from "../utils/detect-pm.js"
import { spawn } from "../utils/spawn.js"
import { materializeTemplatePlan } from "../utils/materialize.js"
import {
  resolveTemplateSource,
  type TemplateSource,
} from "../utils/resolve-template.js"
import { resolveTemplateInstallationPlan } from "../utils/template-plan.js"

const VALID_PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
type ValidPackageManager = (typeof VALID_PACKAGE_MANAGERS)[number]

function isValidPackageManager(value: string): value is ValidPackageManager {
  return VALID_PACKAGE_MANAGERS.some((pm) => pm === value)
}

function logVerbose(enabled: boolean, message: string): void {
  if (enabled) process.stderr.write(`[verbose] ${message}\n`)
}

function resolvePackageManager(
  requestedPm: string | undefined,
  dir: string
): PackageManagerInfo | null {
  if (requestedPm && isValidPackageManager(requestedPm)) {
    return { pm: requestedPm }
  }
  return detectPackageManager(dir)
}

function printNextSteps(
  dir: string,
  packageManager: PackageManagerInfo | null,
  needsInstall: boolean
): void {
  const nextDir = relative(process.cwd(), dir) || "."
  console.log(`\n${pc.bold("Next steps")}`)
  console.log(pc.dim(`  cd ${nextDir}`))
  if (!packageManager) {
    console.log(pc.dim("  Install dependencies, then run the dev script.\n"))
    return
  }
  if (needsInstall)
    console.log(pc.dim(`  ${getInstallCommand(packageManager)}`))
  console.log(pc.dim(`  ${packageManager.pm} run dev\n`))
}

function printMissingPackageManagerNotice(): void {
  console.log(
    pc.yellow(
      "\nNo package manager detected (no packageManager field or lockfile)."
    )
  )
  console.log(
    pc.dim(
      "Skipping install. Install dependencies manually inside the project directory.\n"
    )
  )
}

function prepareProjectConfig(
  plan: TemplateInstallationPlan,
  templateSlug: string,
  verbose: boolean
): TemplateInstallationPlan {
  const projectConfig = plan.files.find((file) =>
    process.platform === "win32"
      ? file.path.toLowerCase() === "deesse.json"
      : file.path === "deesse.json"
  )

  if (!projectConfig) {
    const generatedConfig = {
      $schema: PROJECT_CONFIG_SCHEMA_URL,
      formatVersion: 1,
    }
    logVerbose(verbose, 'Generated a default "deesse.json"')
    return {
      ...plan,
      files: [
        ...plan.files,
        {
          path: "deesse.json",
          contents: new TextEncoder().encode(
            `${JSON.stringify(generatedConfig, null, 2)}\n`
          ),
        },
      ],
    }
  }

  let config: unknown
  try {
    config = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(projectConfig.contents)
    )
  } catch (error) {
    throw templateInvalid(
      templateSlug,
      `the root "deesse.json" could not be read as UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const parsedConfig = parseProjectConfig(config)
  if (!parsedConfig.success) {
    const detail = parsedConfig.diagnostics
      .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
      .join("\n")
    throw templateInvalid(
      templateSlug,
      `the root "deesse.json" is invalid:\n${detail}`
    )
  }

  logVerbose(verbose, 'Using the template\'s validated "deesse.json"')
  return plan
}

async function installDependencies(
  packageManager: PackageManagerInfo,
  dir: string,
  verbose: boolean,
  json: boolean
): Promise<void> {
  const command = getInstallCommand(packageManager)
  const [bin = "npm", ...args] = command.split(" ")
  const spinner =
    verbose || json
      ? undefined
      : ora(
          `Installing dependencies with ${pc.cyan(packageManager.pm)}…`
        ).start()

  if (verbose && !json) {
    console.log(
      `\nInstalling dependencies with ${pc.cyan(packageManager.pm)} (verbose)…`
    )
    console.log(pc.dim(`  ${command}`))
  }

  const startedAt = Date.now()
  const code = await spawn(bin, args, {
    cwd: dir,
    stdio: verbose ? (json ? "pipe" : "inherit") : "ignore",
    reject: false,
  })
  if (code !== 0) {
    spinner?.fail("Dependency installation failed")
    if (!spinner && !json) {
      console.error(pc.red("✖ Dependency installation failed"))
    }
    throw installFailed(packageManager.pm, code, dir)
  }

  const duration = `${Math.round((Date.now() - startedAt) / 1000)}s`
  if (spinner) spinner.succeed(`Dependencies installed · ${duration}`)
  else if (!json)
    console.log(pc.green(`✔ Dependencies installed · ${duration}`))
}

async function createTemplateProject(
  template: TemplateSource,
  dir: string,
  ref: string | undefined,
  force: boolean,
  showProgress: boolean,
  verbose: boolean
): Promise<string> {
  const repository = `${template.owner}/${template.repo}`
  if (template.community && ref) {
    throw templateInvalid(
      template.slug,
      "published community templates use their approved revision; remove --ref"
    )
  }
  const resolvedRef = template.community ? template.sourceCommit : ref
  logVerbose(verbose, `Source repository: https://github.com/${repository}`)
  logVerbose(verbose, `Requested ref: ${resolvedRef ?? "default branch"}`)
  logVerbose(verbose, `Target directory: ${dir}`)
  const downloadSpinner = showProgress
    ? ora(`Downloading template from ${pc.cyan(repository)}…`).start()
    : undefined
  let plan
  try {
    plan = await resolveTemplateInstallationPlan(repository, resolvedRef)
  } catch (error) {
    downloadSpinner?.fail("Template download failed")
    throw error
  }

  const projectPlan = prepareProjectConfig(plan, template.slug, verbose)

  downloadSpinner?.succeed("Template downloaded")
  logVerbose(verbose, `Resolved commit: ${plan.source.revision}`)
  logVerbose(
    verbose,
    `Files selected by deesse-template.json: ${plan.files.length}`
  )
  if (showProgress) {
    console.log(pc.dim(`  ${repository} · ${plan.source.revision.slice(0, 7)}`))
  }

  const createSpinner = showProgress
    ? ora("Creating project files…").start()
    : undefined
  try {
    await materializeTemplatePlan(projectPlan, dir, { force })
    const revision = plan.source.revision
    createSpinner?.succeed("Project files created")
    return revision
  } catch (error) {
    createSpinner?.fail("Project file creation failed")
    throw error
  }
}

export const initCommand = new Command("init")
  .description("Create a project from a template and install dependencies")
  .argument(
    "<slug-or-github-url>",
    "template slug or HTTPS URL to a GitHub repository"
  )
  .option(
    "--pm <name>",
    "override detected package manager (pnpm|npm|yarn|bun)"
  )
  .option("--dir <path>", "target directory (default: ./<template-name>)")
  .option(
    "--ref <branch>",
    "git ref to use (default: the repository's default branch)"
  )
  .option("--no-install", "skip the install step")
  .option("--force", "allow an existing empty target directory")
  .option("--verbose", "show initialization details and package manager output")
  .option("--json", "JSON output for scripting")
  .action((slugOrUrl: string, options: InitCommandOptions) =>
    runInitCommand(slugOrUrl, options)
  )

type InitCommandOptions = {
  pm?: string
  dir?: string
  ref?: string
  install: boolean
  force?: boolean
  verbose?: boolean
  json?: boolean
}

async function runInitCommand(
  slugOrUrl: string,
  options: InitCommandOptions
): Promise<void> {
  try {
    const state = await prepareTemplate(slugOrUrl, options)
    await installAndReport(state, options)
  } catch (error) {
    reportInitError(error, options.json ?? false)
  }
}

async function prepareTemplate(slugOrUrl: string, options: InitCommandOptions) {
  const { template, directRepository } = await resolveTemplateSource(slugOrUrl)
  const projectName =
    directRepository?.repo ?? template.templateSlug ?? template.slug
  const dir = resolve(process.cwd(), options.dir ?? `./${projectName}`)
  if (!options.json) {
    console.log()
    console.log(pc.bold(`Initializing ${projectName}`))
    console.log()
  }
  logVerbose(
    options.verbose ?? false,
    `Template source: ${directRepository ? "GitHub URL" : "catalog slug"}`
  )
  const revision = await createTemplateProject(
    template,
    dir,
    options.ref,
    options.force ?? false,
    !options.json,
    options.verbose ?? false
  )
  return { template, dir, revision }
}

async function installAndReport(
  state: Awaited<ReturnType<typeof prepareTemplate>>,
  options: InitCommandOptions
): Promise<void> {
  const { template, dir, revision } = state
  const packageManager = resolvePackageManager(options.pm, dir)

  if (!options.install) {
    logVerbose(
      options.verbose ?? false,
      "Dependency installation skipped (--no-install)"
    )
    if (options.json) {
      printJson({
        ok: true,
        slug: template.slug,
        dir,
        ref: revision,
        installed: false,
      })
    } else {
      printNextSteps(dir, packageManager, true)
    }
    return
  }

  if (!packageManager && !options.json) printMissingPackageManagerNotice()
  if (packageManager) {
    await installDependencies(
      packageManager,
      dir,
      options.verbose ?? false,
      !!options.json
    )
  }

  if (options.json) {
    printJson({
      ok: true,
      slug: template.slug,
      dir,
      ref: revision,
      installed: packageManager !== null,
      packageManager: packageManager?.pm ?? null,
    })
  } else {
    printNextSteps(dir, packageManager, false)
  }
}

function reportInitError(error: unknown, json: boolean): never {
  if (!(error instanceof CliError)) {
    throw internal(error instanceof Error ? error.message : String(error))
  }
  if (json) {
    printJson({
      ok: false,
      code: error.code,
      message: error.message,
      hint: error.hint,
    })
  } else {
    printError(error)
  }
  process.exit(error.exitCode())
}
