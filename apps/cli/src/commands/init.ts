/**
 * `deesse init <slug>` — initialise un nouveau projet à partir d'un
 * template via le SDK `@workspace/registry-client`.
 *
 * V1 (ce commit) : download only.
 *   - Récupère le descriptor + URLs via `client.getTemplate()`
 *   - Télécharge les fichiers en parallèle
 *   - Écrit sur disque dans `--dir`
 *   - Aucun prompt, aucun transform, aucun hook
 *
 * Évolution prévue (commits suivants) :
 *   - Pré-flight avec `client.info()` + confirmation
 *   - Prompt runner pour `descriptor.prompts[]`
 *   - Transform engine pour `descriptor.files[].transform`
 *   - Hook runner pour `descriptor.hooks`
 *   - Install deps via le package manager détecté
 */

import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import {
  createClient,
  type FetchedTemplate,
  type RegistryFailure,
} from "@workspace/registry-client"

import {
  installFailed,
  internal,
  notFound,
  targetExists,
} from "../errors/index.js"
import { printError, printJson } from "../output/index.js"
import {
  detectPackageManager,
  getInstallCommand,
  type PackageManagerInfo,
} from "../utils/detect-pm.js"
import { spawn } from "../utils/spawn.js"

/**
 * Translate a `RegistryFailure` into the CLI's error vocabulary.
 *
 * The CLI has its own typed errors (`@deessejs/errors`) so the
 * downstream rendering (printError, exit codes) keeps working.
 */
const toCliError = (
  failure: RegistryFailure,
  slug: string,
): Error => {
  switch (failure._tag) {
    case "RegistryNotFound":
      return notFound(slug, [] as string[])
    case "RegistryAuthRequired":
      return new Error("This template requires authentication.")
    case "RegistryInvalidDescriptor":
      return internal(
        `The template ${slug} is corrupted on the registry. Please report this.`,
      )
    case "RegistryNetworkError":
      return internal(
        `Cannot reach the registry. Check your connection and try again.`,
      )
    case "RegistryFetchFailed":
      return internal(
        `The registry reported an upstream failure. Try again later.`,
      )
    case "RegistryUnsupportedSource":
      return internal(`Registry reported unsupported source: ${failure.source}`)
  }
}

/**
 * Download all files declared in `descriptor.files[]` in parallel.
 *
 * Each URL is fetched with the global `fetch` (no SDK indirection
 * here — the SDK has already done its job returning URLs). Errors
 * from any single file fail the whole operation.
 */
const downloadFiles = async (
  tmpl: FetchedTemplate,
): Promise<Array<{ path: string; content: string }>> => {
  const files = tmpl.descriptor.files ?? []
  if (files.length === 0) return []

  return Promise.all(
    files.map(async (spec) => {
      const url = tmpl.files[spec.path]
      if (url === undefined) {
        throw internal(`Descriptor references unknown file: ${spec.path}`)
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw internal(
          `Failed to fetch ${spec.path}: HTTP ${response.status}`,
        )
      }
      const content = await response.text()
      return { path: spec.target ?? spec.path, content }
    }),
  )
}

/**
 * Write downloaded files to `targetDir`, creating intermediate
 * directories as needed. The target path is relative to `targetDir`.
 */
const writeFiles = async (
  files: Array<{ path: string; content: string }>,
  targetDir: string,
): Promise<void> => {
  for (const { path, content } of files) {
    const fullPath = resolve(targetDir, path)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, content, "utf8")
  }
}

export const initCommand = new Command("init")
  .description(
    "Initialize a new project from a template via the registry SDK",
  )
  .argument("<slug>", "template slug (e.g. @deessejs/nextjs-saas)")
  .option("--pm <name>", "override detected package manager (pnpm|npm|yarn|bun)")
  .option("--dir <path>", "target directory (default: ./<slug-without-namespace>)")
  .option(
    "--ref <ref>",
    "pin to a specific version (tag, branch, or SHA)",
  )
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
      try {
        const apiUrl =
          process.env.DEESSEJS_API_URL ?? "https://app.deessejs.com"
        const client = createClient({ apiUrl })

        // 1. Fetch template
        const fetchSpinner = ora(
          `Fetching ${pc.cyan(slug)} from registry...`,
        ).start()
        const tmplResult = await client.getTemplate(slug, {
          ...(opts.ref ? { ref: opts.ref } : {}),
        })
        if (tmplResult._tag === "Err") {
          fetchSpinner.fail("Fetch failed")
          throw toCliError(tmplResult.error, slug)
        }
        const tmpl = tmplResult.value
        fetchSpinner.succeed(
          `Got ${pc.cyan(tmpl.descriptor.title)} v${tmpl.descriptor.version}`,
        )

        // 2. Resolve target directory
        const defaultDirName = slug.replace(/^@[^/]+\//, "")
        const dir = resolve(
          process.cwd(),
          opts.dir ?? `./${defaultDirName}`,
        )

        // 3. Check target directory
        const { existsSync } = await import("node:fs")
        if (existsSync(dir) && !opts.force) {
          throw targetExists(dir)
        }

        // 4. Download all files in parallel
        const downloadSpinner = ora(
          `Downloading ${tmpl.descriptor.files?.length ?? 0} files...`,
        ).start()
        let files: Array<{ path: string; content: string }>
        try {
          files = await downloadFiles(tmpl)
          downloadSpinner.succeed(`Downloaded ${files.length} files`)
        } catch (err) {
          downloadSpinner.fail("Download failed")
          throw err
        }

        // 5. Write to disk
        const writeSpinner = ora(`Writing to ${pc.cyan(dir)}...`).start()
        try {
          await writeFiles(files, dir)
          writeSpinner.succeed(`Created ${pc.cyan(dir)}`)
        } catch (err) {
          writeSpinner.fail("Write failed")
          throw err
        }

        // 6. Install deps (optional)
        if (!opts.install) {
          if (opts.json) {
            printJson({
              ok: true,
              slug,
              dir,
              installed: false,
            })
          } else {
            console.log(
              pc.dim(
                `\nNext: cd ${dir} && <your package manager> install\n`,
              ),
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
              "\nNo package manager detected (no packageManager field, no lockfile).",
            ),
          )
          console.log(
            pc.dim(
              "Skipping install. Run your install command manually inside the directory.\n",
            ),
          )
        } else {
          const installSpinner = ora(
            `Installing dependencies via ${pc.cyan(pmInfo.pm)}...`,
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

        // 7. Final output
        if (opts.json) {
          printJson({
            ok: true,
            slug,
            dir,
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
          process.exit(
            (err as { exitCode?: () => number }).exitCode?.() ?? 1,
          )
        }
        throw internal(err instanceof Error ? err.message : String(err))
      }
    },
  )
