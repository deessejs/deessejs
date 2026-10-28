import { relative, resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { CliError, installFailed, internal } from "../errors/index.js"
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
  logVerbose(verbose, `Source repository: https://github.com/${repository}`)
  logVerbose(verbose, `Requested ref: ${ref ?? "default branch"}`)
  logVerbose(verbose, `Target directory: ${dir}`)
  const downloadSpinner = showProgress
    ? ora(`Downloading template from ${pc.cyan(repository)}…`).start()
    : undefined
  let plan
  try {
    plan = await resolveTemplateInstallationPlan(repository, ref)
  } catch (error) {
    downloadSpinner?.fail("Template download failed")
    throw error
  }

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
    await materializeTemplatePlan(plan, dir, { force })
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
  .action(
    async (
      slugOrUrl: string,
      opts: {
        pm?: string
        dir?: string
        ref?: string
        install: boolean
        force?: boolean
        verbose?: boolean
        json?: boolean
      }
    ) => {
      try {
        const { template, directRepository } =
          await resolveTemplateSource(slugOrUrl)

        const projectName = directRepository?.repo ?? template.slug
        const dir = resolve(process.cwd(), opts.dir ?? `./${projectName}`)
        if (!opts.json) {
          console.log()
          console.log(pc.bold(`Initializing ${projectName}`))
          console.log()
        }
        logVerbose(
          opts.verbose ?? false,
          `Template source: ${directRepository ? "GitHub URL" : "catalog slug"}`
        )
        const revision = await createTemplateProject(
          template,
          dir,
          opts.ref,
          opts.force ?? false,
          !opts.json,
          opts.verbose ?? false
        )

        const pmInfo = resolvePackageManager(opts.pm, dir)

        if (!opts.install) {
          logVerbose(
            opts.verbose ?? false,
            "Dependency installation skipped (--no-install)"
          )
          if (opts.json) {
            printJson({
              ok: true,
              slug: template.slug,
              dir,
              ref: revision,
              installed: false,
            })
          } else {
            printNextSteps(dir, pmInfo, true)
          }
          return
        }

        if (!pmInfo) {
          if (!opts.json) printMissingPackageManagerNotice()
        } else {
          await installDependencies(
            pmInfo,
            dir,
            opts.verbose ?? false,
            !!opts.json
          )
        }

        if (opts.json) {
          printJson({
            ok: true,
            slug: template.slug,
            dir,
            ref: revision,
            installed: pmInfo !== null,
            packageManager: pmInfo?.pm ?? null,
          })
        } else {
          printNextSteps(dir, pmInfo, false)
        }
      } catch (err) {
        if (err instanceof CliError) {
          if (opts.json) {
            printJson({
              ok: false,
              code: err.code,
              message: err.message,
              hint: err.hint,
            })
          } else {
            printError(err)
          }
          process.exit(err.exitCode())
        }
        throw internal(err instanceof Error ? err.message : String(err))
      }
    }
  )
