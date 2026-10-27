import {
  fetchTemplates,
  resolveTemplateBySlug,
  type Template,
} from "../api/index.js"
import { notFound, templateInvalid } from "../errors/index.js"
import { looksLikeUrl, parseGitHubRepositoryUrl } from "./github-repository.js"

export type TemplateSource = Pick<Template, "slug" | "owner" | "repo">

export type ResolvedTemplateSource = {
  template: TemplateSource
  directRepository: ReturnType<typeof parseGitHubRepositoryUrl>
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
  if (options.fastCatalogLookup) {
    template = (await resolveTemplateBySlug(slugOrUrl)) ?? undefined
    if (!template) {
      const templates = await fetchTemplates({ skipVersionCheck: true })
      throw notFound(slugOrUrl, templates.map((item) => item.slug))
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
