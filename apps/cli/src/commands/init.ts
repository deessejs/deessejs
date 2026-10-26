import { relative, resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { fetchTemplates } from "../api/index.js"
import type { Template } from "../api/index.js"
import {
  installFailed,
  internal,
  notFound,
  networkError,
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
  looksLikeUrl,
  parseGitHubRepositoryUrl,
} from "../utils/github-repository.js"
import {
  createGitHubTemplateSourceAdapter,
  createTemplateInstallationPlan,
} from "@workspace/registry/v1"

type TemplateSource = Pick<Template, "slug" | "owner" | "repo">
const VALID_PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
type ValidPackageManager = (typeof VALID_PACKAGE_MANAGERS)[number]

type ResolvedTemplate = {
  template: TemplateSource
  directRepository: ReturnType<typeof parseGitHubRepositoryUrl>
}

async function resolveTemplateSource(
  slugOrUrl: string
): Promise<ResolvedTemplate> {
  const directRepository = parseGitHubRepositoryUrl(slugOrUrl)
  if (looksLikeUrl(slugOrUrl) && !directRepository) {
    throw templateInvalid(
      slugOrUrl,
      "expected an HTTPS URL to a GitHub repository root, such as https://github.com/owner/repository"
    )
  }

  if (directRepository) {
    return {
      directRepository,
      template: {
        slug: directRepository.repo,
        owner: directRepository.owner,
        repo: directRepository.repo,
      },
    }
  }

  const templates = await fetchTemplates()
  const template = templates.find((item) => item.slug === slugOrUrl)
  if (!template)
    throw notFound(
      slugOrUrl,
      templates.map((item) => item.slug)
    )
  return { template, directRepository: null }
}

function resolvePackageManager(
  requestedPm: string | undefined,
  dir: string
): PackageManagerInfo | null {
  if (
    requestedPm &&
    (VALID_PACKAGE_MANAGERS as readonly string[]).includes(requestedPm)
  ) {
    return { pm: requestedPm as ValidPackageManager }
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
  showProgress: boolean
): Promise<string> {
  const repository = `${template.owner}/${template.repo}`
  const downloadSpinner = showProgress
    ? ora(`Downloading template from ${pc.cyan(repository)}…`).start()
    : undefined
  let planResult
  try {
    planResult = await createTemplateInstallationPlan(
      { repository, ...(ref ? { ref } : {}) },
      createGitHubTemplateSourceAdapter()
    )
  } catch (error) {
    downloadSpinner?.fail("Template download failed")
    throw error
  }

  if (planResult.success) {
    downloadSpinner?.succeed("Template downloaded")
    if (showProgress) {
      console.log(
        pc.dim(
          `  ${repository} · ${planResult.plan.source.revision.slice(0, 7)}`
        )
      )
    }

    const createSpinner = showProgress
      ? ora("Creating project files…").start()
      : undefined
    try {
      await materializeTemplatePlan(planResult.plan, dir, { force })
      const revision = planResult.plan.source.revision
      createSpinner?.succeed("Project files created")
      return revision
    } catch (error) {
      createSpinner?.fail("Project file creation failed")
      throw error
    }
  }

  downloadSpinner?.fail("Template download failed")

  const isMissingDescriptor =
    planResult.diagnostics.length === 1 &&
    planResult.diagnostics[0]?.code === "descriptor.missing"
  if (isMissingDescriptor) {
    throw templateInvalid(
      repository,
      'this GitHub repository does not contain a "deesse-template.json" file at its root'
    )
  }

  const detail = planResult.diagnostics
    .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
    .join("\n")
  const networkCodes = [
    "source.unavailable",
    "source.invalid_response",
    "source.incomplete_inventory",
    "source.inventory_limit_exceeded",
    "source.file_not_found",
    "source.file_read_failed",
  ]
  if (
    planResult.diagnostics.some((diagnostic) =>
      networkCodes.includes(diagnostic.code)
    )
  ) {
    throw networkError(detail)
  }
  throw templateInvalid(repository, detail)
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
  .option("--verbose", "show package manager output during installation")
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
        const revision = await createTemplateProject(
          template,
          dir,
          opts.ref,
          opts.force ?? false,
          !opts.json
        )

        const pmInfo = resolvePackageManager(opts.pm, dir)

        if (!opts.install) {
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
        if (err instanceof Error && err.name === "CliError") {
          if (opts.json) {
            printJson({
              ok: false,
              code: (err as { code?: string }).code,
              message: err.message,
              hint: (err as { hint?: string }).hint,
            })
          } else {
            printError(err as Parameters<typeof printError>[0])
          }
          process.exit((err as { exitCode?: () => number }).exitCode?.() ?? 1)
        }
        throw internal(err instanceof Error ? err.message : String(err))
      }
    }
  )
