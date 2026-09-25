import { Command } from "commander"
import ora from "ora"

import { createClient } from "@workspace/registry-client"

import { internal } from "../errors/index.js"
import { printError, printJson, printTemplateInfo } from "../output/index.js"

/**
 * `deesse info <slug>` — show details for one template.
 *
 * Migrated to use `@workspace/registry-client`. The previous
 * implementation fetched the whole catalog then filtered
 * client-side (`fetchTemplates().find(...)`), which was wasteful.
 * The SDK exposes a dedicated `client.info(slug)` that calls
 * the registry's `/templates/:slug/info` endpoint directly.
 */
export const infoCommand = new Command("info")
  .description("Show details for one template")
  .argument("<slug>", "template slug")
  .option("--json", "JSON output for scripting")
  .action(async (slug: string, opts: { json?: boolean }) => {
    const spinner = opts.json ? null : ora("Fetching template...").start()

    try {
      const client = createClient({
        apiUrl: process.env.DEESSEJS_API_URL ?? "https://app.deessejs.com",
      })
      const result = await client.info(slug)
      spinner?.stop()

      if (result._tag === "Err") {
        if (result.error._tag === "RegistryNotFound") {
          throw new Error(`Template "${slug}" not found`)
        }
        throw internal(
          `Failed to fetch template info: ${result.error._tag}`,
        )
      }

      if (opts.json) {
        printJson({ template: result.value })
      } else {
        printTemplateInfo(result.value)
        console.log()
        console.log(`Install: ${`deessejs init ${slug}`}`)
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
  })
