import { existsSync } from "node:fs"
import { lstat, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { fetchTemplates } from "../api/index.js"
import type { Template } from "../api/index.js"
import {
  installFailed,
  internal,
  invalidTarget,
  notFound,
  networkError,
  templateInvalid,
  targetExists,
  targetNotEmpty,
} from "../errors/index.js"
import { printError, printJson } from "../output/index.js"
import { cloneRepo } from "../utils/git.js"
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

type TemplateSource = Pick<Template, "slug" | "owner" | "repo" | "cloneUrl">

async function createTemplateProject(
  template: TemplateSource,
  dir: string,
  ref: string | undefined,
  force: boolean,
  descriptorRequired = false
): Promise<string> {
  const repository = `${template.owner}/${template.repo}`
  const planResult = await createTemplateInstallationPlan(
    { repository, ...(ref ? { ref } : {}) },
    createGitHubTemplateSourceAdapter()
  )

  if (planResult.success) {
    const spinner = ora(
      `Creating project from ${pc.cyan(repository)}...`
    ).start()
    try {
      await materializeTemplatePlan(planResult.plan, dir, { force })
      const revision = planResult.plan.source.revision
      spinner.succeed(`Created in ${pc.cyan(dir)} (revision: ${revision})`)
      return revision
    } catch (error) {
      spinner.fail("Project creation failed")
      throw error
    }
  }

  const isMissingDescriptor =
    planResult.diagnostics.length === 1 &&
    planResult.diagnostics[0]?.code === "descriptor.missing"
  if (!isMissingDescriptor) {
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

  if (descriptorRequired) {
    throw templateInvalid(
      repository,
      'this GitHub repository does not contain a "deesse-template.json" file at its root'
    )
  }

  if (existsSync(dir)) {
    let details
    try {
      details = await lstat(dir)
    } catch {
      details = undefined
    }
    if (!details)
      throw invalidTarget(
        dir,
        "the target path changed while it was being checked"
      )
    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw invalidTarget(
        dir,
        "the target must be a regular directory, not a file or symbolic link"
      )
    }
    if (!force) throw targetExists(dir)
    if ((await readdir(dir)).length > 0) throw targetNotEmpty(dir)
  }

  const repoUrl = template.cloneUrl ?? `https://github.com/${repository}`
  const spinner = ora(`Cloning ${pc.cyan(repository)}...`).start()
  try {
    const result = await cloneRepo(repoUrl, dir, ref)
    spinner.succeed(`Cloned into ${pc.cyan(dir)} (ref: ${result.ref})`)
    return result.ref
  } catch (error) {
    spinner.fail("Clone failed")
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
        json?: boolean
      }
    ) => {
      try {
        const directRepository = parseGitHubRepositoryUrl(slugOrUrl)
        if (looksLikeUrl(slugOrUrl) && !directRepository) {
          throw templateInvalid(
            slugOrUrl,
            "expected an HTTPS URL to a GitHub repository root, such as https://github.com/owner/repository"
          )
        }

        let template: TemplateSource
        if (directRepository) {
          template = {
            slug: directRepository.repo,
            owner: directRepository.owner,
            repo: directRepository.repo,
            cloneUrl: `https://github.com/${directRepository.fullName}`,
          }
        } else {
          const templates = await fetchTemplates()
          const catalogTemplate = templates.find((t) => t.slug === slugOrUrl)
          if (!catalogTemplate) {
            throw notFound(
              slugOrUrl,
              templates.map((t) => t.slug)
            )
          }
          template = catalogTemplate
        }

        const projectName = directRepository?.repo ?? template.slug
        const dir = resolve(process.cwd(), opts.dir ?? `./${projectName}`)
        const revision = await createTemplateProject(
          template,
          dir,
          opts.ref,
          opts.force ?? false,
          directRepository !== null
        )

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
            console.log(
              pc.dim(`\nNext: cd ${dir} && <your package manager> install\n`)
            )
          }
          return
        }

        const VALID_PMS = ["pnpm", "npm", "yarn", "bun"] as const
        type ValidPm = (typeof VALID_PMS)[number]
        const pmInfo: PackageManagerInfo | null =
          opts.pm && (VALID_PMS as readonly string[]).includes(opts.pm)
            ? { pm: opts.pm as ValidPm }
            : detectPackageManager(dir)

        if (!pmInfo) {
          console.log(
            pc.yellow(
              "\nNo package manager detected (no packageManager field, no lockfile)."
            )
          )
          console.log(
            pc.dim(
              "Skipping install. Run your install command manually inside the directory.\n"
            )
          )
        } else {
          const installSpinner = ora(
            `Installing dependencies via ${pc.cyan(pmInfo.pm)}...`
          ).start()
          const cmd = getInstallCommand(pmInfo)
          const cmdParts = cmd.split(" ")
          const bin = cmdParts[0] ?? "npm"
          const args = cmdParts.slice(1)
          const code = await spawn(bin, args, {
            cwd: dir,
            stdio: "inherit",
            reject: false,
          })
          if (code !== 0) {
            installSpinner.fail(`${pmInfo.pm} install failed`)
            throw installFailed(pmInfo.pm, code)
          }
          installSpinner.succeed("Dependencies installed")
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
          console.log()
          console.log(pc.green("✓ Template ready"))
          console.log(pc.dim(`  cd ${dir}`))
          console.log(
            pc.dim(
              pmInfo
                ? `  ${getInstallCommand(pmInfo).split(" ")[0]} dev`
                : `  install deps, then start`
            )
          )
          console.log()
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
