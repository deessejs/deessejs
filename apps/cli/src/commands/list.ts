import { Command } from "commander"
import ora from "ora"
import pc from "picocolors"

import { createClient } from "@workspace/registry-client"

import { internal } from "../errors/index.js"
import { printError, printJson, printTemplatesTable } from "../output/index.js"

/**
 * `deesse list` — list available templates from the registry.
 *
 * Migrated to use `@workspace/registry-client`. The previous
 * implementation called `fetchTemplates()` against the oRPC API,
 * which returned an enriched V1 shape (with owner/repo/image).
 * The SDK returns `CatalogEntry[]` (slug, title, layer,
 * latestVersion), which is what the catalog screen needs.
 */
export const listCommand = new Command("list")
  .description("List available templates")
  .option("--layer <name>", "filter to a single layer (open-community | pro | enterprise)")
  .option("--json", "JSON output for scripting")
  .action(
    async (opts: {
      layer?: "open-community" | "pro" | "enterprise"
      json?: boolean
    }) => {
      const spinner = opts.json ? null : ora("Fetching templates...").start()

      try {
        const client = createClient({
          apiUrl: process.env.DEESSEJS_API_URL ?? "https://app.deessejs.com",
        })
        const result = await client.listTemplates()
        spinner?.stop()

        if (result._tag === "Err") {
          throw internal(
            `Failed to list templates: ${result.error._tag}`,
          )
        }

        const filtered = opts.layer
          ? result.value.filter((t) => t.layer === opts.layer)
          : result.value

        if (opts.json) {
          printJson({ templates: filtered })
        } else {
          if (opts.layer) {
            console.log(pc.dim(`Layer: ${opts.layer}`))
          }
          printTemplatesTable(filtered)
          console.log()
          console.log(
            pc.dim(
              `${filtered.length} template${filtered.length === 1 ? "" : "s"}.` +
                (opts.layer
                  ? ""
                  : " Use --layer <name> to filter, --json for scripting."),
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
