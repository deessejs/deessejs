import { fetchTemplates, type Template } from "../api/index.js"
import { notFound, templateInvalid } from "../errors/index.js"
import { looksLikeUrl, parseGitHubRepositoryUrl } from "./github-repository.js"

export type TemplateSource = Pick<Template, "slug" | "owner" | "repo">

export type ResolvedTemplateSource = {
  template: TemplateSource
  catalogTemplate: Template | null
  directRepository: ReturnType<typeof parseGitHubRepositoryUrl>
}

export async function resolveTemplateSource(
  slugOrUrl: string
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
      catalogTemplate: null,
      template: {
        slug: directRepository.repo,
        owner: directRepository.owner,
        repo: directRepository.repo,
      },
    }
  }

  const templates = await fetchTemplates()
  const template = templates.find((item) => item.slug === slugOrUrl)
  if (!template) {
    throw notFound(
      slugOrUrl,
      templates.map((item) => item.slug)
    )
  }

  return {
    template,
    catalogTemplate: template,
    directRepository: null,
  }
}
