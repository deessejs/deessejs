import {
  fetchTemplates,
  resolveTemplateBySlug,
  type Template,
} from "../api/index.js"
import { networkError, notFound, templateInvalid } from "../errors/index.js"
import { looksLikeUrl, parseGitHubRepositoryUrl } from "./github-repository.js"

export type TemplateSource = Pick<Template, "slug" | "owner" | "repo"> & {
  community?: true
  sourceCommit?: string
  templateSlug?: string
}

export type ResolvedTemplateSource = {
  template: TemplateSource
  directRepository: ReturnType<typeof parseGitHubRepositoryUrl>
}

async function fetchTemplatesForInfo(): Promise<Template[]> {
  try {
    return await fetchTemplates({ skipVersionCheck: true })
  } catch (error) {
    if (error instanceof Error && error.name === "CliError") throw error
    const detail =
      error instanceof Error && "code" in error
        ? `${String(error.code)}: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error)
    throw networkError(detail)
  }
}

export async function resolveTemplateSource(
  slugOrUrl: string,
  options: { skipVersionCheck?: boolean; fastCatalogLookup?: boolean } = {}
): Promise<ResolvedTemplateSource> {
  const directRepository = parseGitHubRepositoryUrl(slugOrUrl)
  if (looksLikeUrl(slugOrUrl) && !directRepository) {
    throw templateInvalid(
      slugOrUrl,
      "expected an HTTPS URL to a GitHub repository root, such as https://github.com/owner/repository"
    )
  }

  if (directRepository) {
    return {
      directRepository,
      template: {
        slug: directRepository.repo,
        owner: directRepository.owner,
        repo: directRepository.repo,
      },
    }
  }

  let template: TemplateSource | undefined
  if (options.fastCatalogLookup && !slugOrUrl.startsWith("@")) {
    let catalogTemplates: Template[] | undefined
    try {
      template = (await resolveTemplateBySlug(slugOrUrl)) ?? undefined
    } catch {
      // Older deployed API versions do not yet expose templates.resolve.
      // Fall back to the existing list route until that API deploys.
      catalogTemplates = await fetchTemplatesForInfo()
      template = catalogTemplates.find((item) => item.slug === slugOrUrl)
    }
    if (!template) {
      catalogTemplates ??= await fetchTemplatesForInfo()
      throw notFound(
        slugOrUrl,
        catalogTemplates.map((item) => item.slug)
      )
    }
  } else {
    const templates = await fetchTemplates({
      skipVersionCheck: options.skipVersionCheck ?? false,
    })
    template = templates.find((item) => item.slug === slugOrUrl)
    if (!template) {
      throw notFound(
        slugOrUrl,
        templates.map((item) => item.slug)
      )
    }
  }

  return {
    template,
    directRepository: null,
  }
}
