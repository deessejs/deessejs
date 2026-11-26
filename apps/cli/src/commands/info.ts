import { Command } from "commander"
import ora from "ora"
import { CliError, internal, templateInvalid } from "../errors/index.js"
import { printError, printJson, printTemplateInfo } from "../output/index.js"
import { resolveTemplateSource } from "../utils/resolve-template.js"
import {
  resolveManagedTemplateInstallationPlan,
  resolveTemplateDescriptorInfo,
} from "../utils/template-plan.js"
import type { TemplateSource } from "../utils/resolve-template.js"

type ResolvedTemplate = Awaited<ReturnType<typeof resolveTemplateSource>>

function getTemplateRef(
  template: TemplateSource,
  requestedRef: string | undefined
): string | undefined {
  if (template.community && requestedRef) {
    throw templateInvalid(
      template.slug,
      "published community templates use their approved revision; remove --ref"
    )
  }
  return template.community ? template.sourceCommit : requestedRef
}

async function resolveInfoForTemplate(
  resolved: ResolvedTemplate,
  requestedRef: string | undefined
) {
  if (resolved.template.sourceType === "managed") {
    if (requestedRef) {
      throw templateInvalid(
        resolved.template.slug,
        "managed templates use their published version; remove --ref"
      )
    }
    const managed = await resolveManagedTemplateInstallationPlan({
      slug: resolved.template.slug,
    })
    if (!managed.plan) {
      throw templateInvalid(
        resolved.template.slug,
        "no managed release has been published yet"
      )
    }
    return {
      descriptor: managed.plan.descriptor,
      source: managed.plan.source,
    }
  }

  if (!resolved.template.owner || !resolved.template.repo) {
    throw templateInvalid(
      resolved.template.slug,
      "this template has no GitHub source"
    )
  }
  return resolveTemplateDescriptorInfo(
    `${resolved.template.owner}/${resolved.template.repo}`,
    getTemplateRef(resolved.template, requestedRef)
  )
}

function reportInfoError(error: unknown, json: boolean): never {
  if (error instanceof CliError) {
    if (json) {
      printJson({
        ok: false,
        code: error.code,
        message: error.message,
        hint: error.hint,
      })
    } else {
      printError(error)
    }
    process.exit(error.exitCode())
  }
  throw internal(error instanceof Error ? error.message : String(error))
}

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
  .option("--refresh", "Bypass and refresh the local catalog cache")
  .option("--verbose", "show human-readable output")
  .action(
    async (
      slugOrUrl: string,
      opts: {
        ref?: string
        json?: boolean
        verbose?: boolean
        refresh?: boolean
      }
    ) => {
      const json = !opts.verbose || !!opts.json
      const spinner = json ? null : ora("Fetching template details...").start()

      try {
        const resolved = await resolveTemplateSource(slugOrUrl, {
          skipVersionCheck: true,
          fastCatalogLookup: true,
          useLocalCache: true,
          refresh: opts.refresh ?? false,
        })
        const info = await resolveInfoForTemplate(resolved, opts.ref)
        spinner?.succeed("Template details loaded")

        const installSource = resolved.directRepository
          ? `https://github.com/${resolved.directRepository.fullName}`
          : resolved.template.slug
        const refOption =
          opts.ref && !resolved.template.community ? ` --ref ${opts.ref}` : ""
        const installCommand = `deessejs templates init ${installSource}${refOption}`

        if (json) {
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
        reportInfoError(err, json)
      }
    }
  )
