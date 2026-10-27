import { Command } from "commander"
import ora from "ora"
import { internal } from "../errors/index.js"
import { printError, printJson, printTemplateInfo } from "../output/index.js"
import { resolveTemplateSource } from "../utils/resolve-template.js"
import { resolveTemplateDescriptorInfo } from "../utils/template-plan.js"

export const infoCommand = new Command("info")
  .description("Show details for one template")
  .argument(
    "<slug-or-github-url>",
    "template slug or HTTPS URL to a GitHub repository"
  )
  .option(
    "--ref <branch>",
    "Git ref to inspect (default: the repository's default branch)"
  )
  .option("--json", "JSON output for scripting")
  .action(async (slugOrUrl: string, opts: { ref?: string; json?: boolean }) => {
    const spinner = opts.json
      ? null
      : ora("Fetching template details...").start()

    try {
      const resolved = await resolveTemplateSource(slugOrUrl, {
        skipVersionCheck: true,
        fastCatalogLookup: true,
      })
      const repository = `${resolved.template.owner}/${resolved.template.repo}`
      const info = await resolveTemplateDescriptorInfo(repository, opts.ref)
      spinner?.succeed("Template details loaded")

      const installSource = resolved.directRepository
        ? `https://github.com/${resolved.directRepository.fullName}`
        : resolved.template.slug
      const refOption = opts.ref ? ` --ref ${opts.ref}` : ""
      const installCommand = `deessejs init ${installSource}${refOption}`

      if (opts.json) {
        printJson({
          descriptor: info.descriptor,
          source: info.source,
        })
      } else {
        printTemplateInfo(info.descriptor, info.source)
        console.log()
        console.log(`Install: ${installCommand}`)
      }
    } catch (err) {
      spinner?.fail("Failed to fetch template details")
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
  })
