import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { fetchTemplates } from "../api.js"
import { DEFAULT_API_URL } from "../constants.js"
import {
  installFailed,
  internal,
  notFound,
  targetExists,
} from "../errors.js"
import { printError, printJson } from "../output.js"
import { cloneRepo } from "../utils/git.js"
import {
  detectPackageManager,
  getInstallCommand,
  type PackageManagerInfo,
} from "../utils/detect-pm.js"
import { spawn } from "../utils/spawn.js"

export const initCommand = new Command("init")
  .description("Clone a template repo + install dependencies")
  .argument("<slug>", "template slug (use `deessejs list` to see options)")
  .option("--pm <name>", "override detected package manager (pnpm|npm|yarn|bun)")
  .option("--dir <path>", "target directory (default: ./<slug>)")
  .option("--ref <branch>", "git ref to clone (default: tries main, falls back to master)")
  .option("--no-install", "skip the install step")
  .option("--force", "overwrite target directory if it exists")
  .option("--json", "JSON output for scripting")
  .action(
    async (
      slug: string,
      opts: {
        pm?: string
        dir?: string
        ref?: string
        install: boolean
        force?: boolean
        json?: boolean
      },
    ) => {
      const apiUrl = initCommand.parent?.getOptionValue("apiUrl") as
        | string
        | undefined

      try {
        const templates = await fetchTemplates(
          apiUrl ?? process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL,
        )
        const template = templates.find((t) => t.slug === slug)
        if (!template) {
          throw notFound(
            slug,
            templates.map((t) => t.slug),
          )
        }

        const dir = resolve(process.cwd(), opts.dir ?? `./${slug}`)
        if (existsSync(dir) && !opts.force) {
          throw targetExists(dir)
        }

        const repoUrl =
          template.cloneUrl ?? `https://github.com/${template.owner}/${template.repo}`

        const cloneSpinner = ora(`Cloning ${pc.cyan(template.owner + "/" + template.repo)}...`).start()
        let cloneResult
        try {
          cloneResult = await cloneRepo(repoUrl, dir, opts.ref)
          cloneSpinner.succeed(`Cloned into ${pc.cyan(dir)} (ref: ${cloneResult.ref})`)
        } catch (err) {
          cloneSpinner.fail("Clone failed")
          throw err
        }

        if (!opts.install) {
          if (opts.json) {
            printJson({
              ok: true,
              slug: template.slug,
              dir,
              ref: cloneResult.ref,
              installed: false,
            })
          } else {
            console.log(pc.dim(`\nNext: cd ${dir} && <your package manager> install\n`))
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
              "\nNo package manager detected (no packageManager field, no lockfile).",
            ),
          )
          console.log(
            pc.dim("Skipping install. Run your install command manually inside the directory.\n"),
          )
        } else {
          const installSpinner = ora(
            `Installing dependencies via ${pc.cyan(pmInfo.pm)}...`,
          ).start()
          const cmd = getInstallCommand(pmInfo)
          const cmdParts = cmd.split(" ")
          const bin = cmdParts[0] ?? "npm"
          const args = cmdParts.slice(1)
          const code = await spawn(bin, args, { cwd: dir, stdio: "inherit", reject: false })
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
            ref: cloneResult.ref,
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
                : `  install deps, then start`,
            ),
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
    },
  )