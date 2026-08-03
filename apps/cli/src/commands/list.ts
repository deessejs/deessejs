import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"
import { fetchTemplates } from "../api.js"
import { DEFAULT_API_URL } from "../constants.js"
import { internal } from "../errors.js"
import { printError, printJson, printTemplatesTable } from "../output.js"

export const listCommand = new Command("list")
  .description("List available templates")
  .option("--category <name>", "filter to a single category")
  .option("--json", "JSON output for scripting")
  .action(
    async (
      opts: { category?: string; json?: boolean },
      command: Command,
    ) => {
      const apiUrl = command.parent?.getOptionValue("apiUrl") as
        | string
        | undefined
      const offline = command.parent?.getOptionValue("offline") as
        | boolean
        | undefined

      const spinner = opts.json
        ? null
        : ora(offline ? "Reading cached templates..." : "Fetching templates...").start()

      try {
        const all = await fetchTemplates(
          apiUrl ?? process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL,
          { offline: Boolean(offline) },
        )
        const filtered = opts.category
          ? all.filter((t) => t.category === opts.category)
          : all

        spinner?.stop()

        if (opts.json) {
          printJson({ templates: filtered })
        } else {
          if (opts.category) {
            console.log(pc.dim(`Category: ${opts.category}`))
          }
          printTemplatesTable(filtered)
          console.log()
          console.log(
            pc.dim(
              `${filtered.length} template${filtered.length === 1 ? "" : "s"}.` +
                (opts.category
                  ? ""
                  : " Use --category <name> to filter, --json for scripting."),
            ),
          )
        }
      } catch (err) {
        spinner?.fail("Failed to fetch templates")
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