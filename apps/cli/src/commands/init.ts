/**
 * `deesse init <slug>` — initializes a new project from a template
 * via the `@workspace/registry-client` SDK.
 *
 * Current behaviour (download path):
 *   - Resolve the template via `client.resolveTemplate(slug)` — for
 *     GitHub-shape slugs the SDK fetches the descriptor + the GitHub
 *     tree and applies `includes[]` / `excludes[]` / `fileTypes{}`;
 *     for catalogue API slugs the API server resolves.
 *   - Download every resolved file in parallel
 *   - Write to disk under `--dir`
 *   - No prompts, no transforms, no hooks
 *
 * Planned evolution (follow-up commits):
 *   - Pre-flight with `client.info()` + confirmation
 *   - Prompt runner for `descriptor.prompts[]`
 *   - Transform engine for `descriptor.files[].transform`
 *   - Hook runner for `descriptor.hooks`
 *   - Install deps via the detected package manager
 */

import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import {
  type RegistryFailure,
  type ResolvedTemplate,
} from "@workspace/registry-client"

import { getRegistryClient } from "../registry/client.js"
import {
  CliError,
  installFailed,
  internal,
  notFound,
  parseError,
  targetExists,
} from "../errors/index.js"
import {
  buildInstallPlan,
  printError,
  printInstallPlan,
  printJson,
} from "../output/index.js"
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
 *
 * Each case maps a single `_tag` from the SDK's discriminated union
 * to the closest CLI error. The mapping is intentionally narrow:
 * the CLI's user-facing copy is the contract. Adding a new
 * `RegistryFailure` variant is breaking — both this function and
 * its TypeScript exhaustiveness check must be updated in the same
 * change.
 *
 * Special case — `RegistryIncompatibleTemplate`:
 *   The server returned 422 because the resolved GitHub repository
 *   exists but does not ship a `deesse-template.json`. The CLI uses
 *   the `repo` field (resolved `owner/repo`) instead of the user's
 *   original `slug` because the user often types a short alias
 *   (`saas-starter`) and the actual repo (`deessejs/saas-template`)
 *   is what they need to fix on GitHub.
 *
 *   Two sub-messages depending on `cause`:
 *     - `missing_descriptor`: the file is absent. Action: add it.
 *     - `invalid_descriptor`: the file is present but fails Zod.
 *       Action: fix it against `TemplateV2`.
 */
const toCliError = (
  failure: RegistryFailure,
  slug: string,
): Error => {
  switch (failure._tag) {
    case "RegistryNotFound":
      return notFound(slug, [] as string[])
    case "RegistryIncompatibleTemplate": {
      const repo = failure.repo !== "" ? failure.repo : slug
      if (failure.cause === "missing_descriptor") {
        return parseError(
          `Incompatible template: ${repo} exists on GitHub but does not ship a deesse-template.json at its root.\n` +
            `Add a deesse-template.json descriptor to make it a DeesseJS template.`,
          `Add a deesse-template.json file at the repo root.`,
        )
      }
      return parseError(
        `Incompatible template: ${repo} ships a deesse-template.json but it fails Zod validation.\n` +
          `Check that the descriptor matches the TemplateV2 schema.`,
        `Fix the descriptor against the TemplateV2 schema.`,
      )
    }
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
    case "RegistryTreeFailed":
      return parseError(
        `Tree fetch failed for "${slug}".`,
        `Check the repo exists and is public; very large repos return a truncated tree.`,
      )
    case "RegistryUnsupportedSource": {
      const host = failure.source.startsWith("unsupported_host:")
        ? failure.source.slice("unsupported_host:".length)
        : failure.source
      return parseError(
        `Unsupported source: ${host}. The CLI supports github.com repositories only.`,
        `Provide an owner/repo (e.g. deessejs/saas-template), an HTTPS URL on github.com, or an SSH URL.`,
      )
    }
  }
}

/**
 * Resolve the base URL for raw GitHub file fetches.
 *
 * Honours `DEESSEJS_GITHUB_RAW_BASE` (the same env var the SDK
 * reads in `registry-client/src/github.ts`) so integration tests
 * can redirect the file fetch to a fake server. In production the
 * env var is unset and the default `https://raw.githubusercontent.com`
 * is used.
 */
const githubRawBase = (): string =>
  process.env["DEESSEJS_GITHUB_RAW_BASE"] ??
  "https://raw.githubusercontent.com"

/**
 * Build the absolute URL the SDK / server uses to serve a single
 * template file. Mirrors the construction in
 * `packages/registry-client/src/github.ts` (GitHub-direct path)
 * and `packages/api/src/http/routes/registry.ts` (API path) so
 * the consumer-side `fetch` reaches the same host.
 *
 * `DEESSEJS_GITHUB_RAW_BASE` is the raw content host root — its
 * default is `https://raw.githubusercontent.com` (note: includes
 * the `/raw.githubusercontent.com` path segment, not just the
 * origin). The SDK's `getTemplateFromGithub` appends
 * `/<owner>/<repo>/<ref>/<path>` directly to that base. We follow
 * the same convention so a single `DEESSEJS_GITHUB_RAW_BASE`
 * override redirects the descriptor fetch, the per-file fetches,
 * and any future code path.
 */
const buildFileUrl = (
  rt: ResolvedTemplate,
  filePath: string,
): string => {
  const ref = rt.treeRef || rt.descriptor.source.ref
  const base = githubRawBase()
  // Strip a single trailing slash — the base may end with one
  // (some users set `DEESSEJS_GITHUB_RAW_BASE=http://.../`).
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base
  return `${trimmed}/${rt.descriptor.source.repo}/${ref}/${filePath}`
}

/**
 * Download every file in the resolved list, in parallel.
 *
 * The resolved list comes from `client.resolveTemplate(slug)` — for
 * GitHub-shape slugs the SDK has already fetched the tree and
 * applied `descriptor.includes/excludes/fileTypes`; for catalogue
 * API slugs the API server has resolved. We get plain paths (no URL
 * map) because the base URL is derived from `descriptor.source`
 * (`<raw>/<repo>`) — same on both paths.
 *
 * Each URL is fetched with the global `fetch`. Errors from any
 * single file fail the whole operation.
 */
const downloadResolvedFiles = async (
  rt: ResolvedTemplate,
): Promise<Array<{ path: string; content: string }>> => {
  if (rt.files.length === 0) return []

  return Promise.all(
    rt.files.map(async (f) => {
      const url = buildFileUrl(rt, f.path)
      const response = await fetch(url)
      if (!response.ok) {
        throw internal(
          `Failed to fetch ${f.path}: HTTP ${response.status}`,
        )
      }
      const content = await response.text()
      return { path: f.target ?? f.path, content }
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
  .option(
    "--dry-run",
    "preview the install plan without writing files or running installs",
  )
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
        dryRun?: boolean
        json?: boolean
      },
    ) => {
      try {
        // 1. Resolve template (descriptor + file list)
        const fetchSpinner = ora(
          `Fetching ${pc.cyan(slug)} from registry...`,
        ).start()
        const client = getRegistryClient()
        const tmplResult = await client.resolveTemplate(slug, {
          ...(opts.ref ? { ref: opts.ref } : {}),
        })
        if (tmplResult._tag === "Err") {
          fetchSpinner.fail("Fetch failed")
          throw toCliError(tmplResult.error, slug)
        }
        const rt = tmplResult.value
        fetchSpinner.succeed(
          `Got ${pc.cyan(rt.descriptor.title)} v${rt.descriptor.version}`,
        )

        // 2. Resolve target directory
        const defaultDirName = slug.replace(/^@[^/]+\//, "")
        const dir = resolve(
          process.cwd(),
          opts.dir ?? `./${defaultDirName}`,
        )

        // 2.5. Dry-run — build the plan, print or JSON it, exit.
        // The plan reads the descriptor fields AND the resolved file
        // list so the user sees what `init` WOULD do (including the
        // glob-resolved file paths).
        if (opts.dryRun) {
          const plan = buildInstallPlan(
            rt.descriptor,
            slug,
            dir,
            undefined,
            rt.files.map((f) =>
              f.target === undefined
                ? { path: f.path }
                : { path: f.path, target: f.target },
            ),
          )
          if (opts.json) {
            printJson({ ok: true, dryRun: true, plan })
          } else {
            printInstallPlan(plan)
          }
          return
        }

        // 3. Check target directory
        const { existsSync } = await import("node:fs")
        if (existsSync(dir) && !opts.force) {
          throw targetExists(dir)
        }

        // 4. Download all resolved files in parallel
        const downloadSpinner = ora(
          `Downloading ${rt.files.length} files...`,
        ).start()
        let files: Array<{ path: string; content: string }>
        try {
          files = await downloadResolvedFiles(rt)
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
              files: rt.files.map((f) => f.target ?? f.path),
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
            files: rt.files.map((f) => f.target ?? f.path),
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
    },
  )
