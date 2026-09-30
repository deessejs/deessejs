import { Command } from "commander"
import ora from "ora"

import { getRegistryClient } from "../registry/client.js"
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
      const client = getRegistryClient()
      const result = await client.info(slug)
      spinner?.stop()

      if (result._tag === "Err") {
        if (result.error._tag === "RegistryNotFound") {
          throw new Error(`Template "${slug}" not found`)
        }
        if (result.error._tag === "RegistryUnsupportedSource") {
          // Mirrors the init command's mapping. The SDK's router
          // emits `source: "unsupported_host:<host>"` for non-GitHub
          // URLs (gitlab.com, bitbucket.org). Strip the prefix for
          // a clean user message.
          const host =
            result.error.source.startsWith("unsupported_host:")
              ? result.error.source.slice("unsupported_host:".length)
              : result.error.source
          throw new Error(
            `Unsupported source: ${host}. The CLI supports github.com repositories only.`,
          )
        }
        if (result.error._tag === "RegistryIncompatibleTemplate") {
          const repo = result.error.repo !== "" ? result.error.repo : slug
          if (result.error.cause === "missing_descriptor") {
            throw new Error(
              `Incompatible template: ${repo} exists on GitHub but does not ship a deesse-template.json.`,
            )
          }
          throw new Error(
            `Incompatible template: ${repo} ships a deesse-template.json but it fails Zod validation.`,
          )
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
