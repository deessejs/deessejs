import { Command } from "commander"
import ora from "ora"
import { fetchTemplates } from "../api.js"
import { DEFAULT_API_URL } from "../constants.js"
import { internal, notFound } from "../errors.js"
import { printError, printJson, printTemplateInfo } from "../output.js"

export const infoCommand = new Command("info")
  .description("Show details for one template")
  .argument("<slug>", "template slug")
  .option("--json", "JSON output for scripting")
  .action(
    async (slug: string, opts: { json?: boolean }, command: Command) => {
      const apiUrl = command.parent?.getOptionValue("apiUrl") as
        | string
        | undefined
      const offline = command.parent?.getOptionValue("offline") as
        | boolean
        | undefined

      const spinner = opts.json
        ? null
        : ora(offline ? "Reading cached template..." : "Fetching template...").start()

      try {
        const all = await fetchTemplates(
          apiUrl ?? process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL,
          { offline: Boolean(offline) },
        )
        const template = all.find((t) => t.slug === slug)
        spinner?.stop()

        if (!template) {
          throw notFound(slug, all.map((t) => t.slug))
        }

        if (opts.json) {
          printJson({ template })
        } else {
          printTemplateInfo(template)
          console.log()
          console.log(
            `Install: ${`deessejs init ${template.slug}`}`,
          )
        }
      } catch (err) {
        spinner?.fail("Failed to fetch template")
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
          process.exit(1)
        }
        throw internal(err instanceof Error ? err.message : String(err))
      }
    },
  )