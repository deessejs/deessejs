import {
  fetchTemplateByAddress,
  fetchTemplates,
  type Template,
  type TemplateSummary,
} from "../api/index.js"
import { networkError, notFound, templateInvalid } from "../errors/index.js"
import { looksLikeUrl, parseGitHubRepositoryUrl } from "./github-repository.js"

export type TemplateSource = Pick<Template, "slug"> &
  Partial<Pick<Template, "owner" | "repo">> & {
    community?: true
    requiresManaged?: boolean | undefined
    sourceCommit?: string
    templateSlug?: string
    sourceType?: "github" | "managed"
    installable?: boolean
  }

export type ResolvedTemplateSource = {
  template: TemplateSource
  directRepository: ReturnType<typeof parseGitHubRepositoryUrl>
}

async function fetchTemplatesForInfo(
  useLocalCache = false,
  refresh = false
): Promise<TemplateSummary[]> {
  try {
    return await fetchTemplates({
      skipVersionCheck: true,
      useLocalCache,
      refresh,
    })
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
  options: {
    skipVersionCheck?: boolean
    fastCatalogLookup?: boolean
    useLocalCache?: boolean
    refresh?: boolean
  } = {}
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
  if (options.fastCatalogLookup !== false) {
    let catalogTemplates: TemplateSummary[] | undefined
    template =
      (await fetchTemplateByAddress(slugOrUrl, {
        useLocalCache: options.useLocalCache ?? false,
        refresh: options.refresh ?? false,
      })) ?? undefined
    if (!template) {
      catalogTemplates ??= await fetchTemplatesForInfo(
        options.useLocalCache ?? false,
        options.refresh ?? false
      )
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
