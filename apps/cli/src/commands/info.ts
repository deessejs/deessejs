/**
 * `deesse info <slug>` — show details for one template.
 *
 * Backed by `client.resolveTemplate(slug)`. On GitHub-shape slugs the
 * SDK fetches the descriptor + the GitHub tree and applies the
 * `includes[]` / `excludes[]` / `fileTypes{}` pipeline. On catalogue
 * API slugs the SDK returns descriptor-only metadata (no tree).
 */

import { Command } from "commander"
import ora from "ora"

import { getRegistryClient } from "../registry/client.js"
import { CliError, internal, parseError } from "../errors/index.js"
import { printError, printJson, printResolvedTemplate } from "../output/index.js"

export const infoCommand = new Command("info")
  .description("Show details for one template (descriptor + resolved files)")
  .argument("<slug>", "template slug (GitHub-shape or catalogue)")
  .option("--json", "JSON output for scripting")
  .action(async (slug: string, opts: { json?: boolean }) => {
    const spinner = opts.json ? null : ora("Fetching template...").start()

    try {
      const client = getRegistryClient()
      const result = await client.resolveTemplate(slug)
      spinner?.stop()

      if (result._tag === "Err") {
        const err = result.error
        if (err._tag === "RegistryNotFound") {
          throw parseError(
            `Template "${slug}" not found`,
            `Check the slug spelling or pick a GitHub-shape owner/repo.`,
          )
        }
        if (err._tag === "RegistryUnsupportedSource") {
          const host =
            err.source.startsWith("unsupported_host:")
              ? err.source.slice("unsupported_host:".length)
              : err.source
          throw parseError(
            `Unsupported source: ${host}. The CLI supports github.com repositories only.`,
            `Provide an owner/repo (e.g. deessejs/saas-template), an HTTPS URL on github.com, or an SSH URL.`,
          )
        }
        if (err._tag === "RegistryIncompatibleTemplate") {
          const repo = err.repo !== "" ? err.repo : slug
          if (err.cause === "missing_descriptor") {
            throw parseError(
              `Incompatible template: ${repo} exists on GitHub but does not ship a deesse-template.json.`,
              `Add a deesse-template.json file at the repo root.`,
            )
          }
          throw parseError(
            `Incompatible template: ${repo} ships a deesse-template.json but it fails Zod validation.`,
            `Fix the descriptor against the TemplateV2 schema.`,
          )
        }
        if (err._tag === "RegistryTreeFailed") {
          throw parseError(
            `Tree fetch failed for "${slug}".`,
            `Check the repo exists and is public; very large repos return a truncated tree.`,
          )
        }
        if (err._tag === "RegistryNetworkError") {
          throw parseError(
            `Cannot reach the registry. Check your connection and try again.`,
            `Retry, or check network access to api.github.com / app.deessejs.com.`,
          )
        }
        if (err._tag === "RegistryAuthRequired") {
          throw parseError(
            `This template requires authentication.`,
            `Private templates are not yet supported.`,
          )
        }
        throw internal(
          `Failed to fetch template info: ${err._tag}`,
        )
      }

      if (opts.json) {
        printJson({
          descriptor: result.value.descriptor,
          files: result.value.files,
          source: result.value.source,
          treeRef: result.value.treeRef,
        })
      } else {
        printResolvedTemplate(result.value)
        console.log()
        console.log(`Install: ${`deessejs init ${slug}`}`)
      }
    } catch (err) {
      spinner?.fail("Failed to fetch template")
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
        process.exit(1)
      }
      throw internal(err instanceof Error ? err.message : String(err))
    }
  })