import { z } from "zod"

const GITHUB_API_VERSION = "2022-11-28"
const REPOSITORIES_PER_PAGE = 30

const githubRepositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1),
  private: z.boolean(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  default_branch: z.string().min(1).nullable(),
})

const repositoryPageSchema = z.object({
  total_count: z.number().int().nonnegative(),
  repositories: z.array(githubRepositorySchema),
})

export class GitHubRepositoryRequestError extends Error {
  constructor(readonly status: number) {
    super("GitHub repository request failed")
    this.name = "GitHubRepositoryRequestError"
  }
}

export async function listGitHubInstallationRepositories(input: {
  installationId: string
  accessToken: string
  page: number
}) {
  if (!/^\d{1,20}$/.test(input.installationId)) {
    throw new GitHubRepositoryRequestError(400)
  }

  const url = new URL(
    `/user/installations/${input.installationId}/repositories`,
    "https://api.github.com"
  )
  url.searchParams.set("per_page", String(REPOSITORIES_PER_PAGE))
  url.searchParams.set("page", String(input.page))

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${input.accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new GitHubRepositoryRequestError(response.status)
  }

  const payload = await response.json()
  const parsed = repositoryPageSchema.safeParse(payload)
  if (!parsed.success) {
    throw new GitHubRepositoryRequestError(502)
  }

  return {
    totalCount: parsed.data.total_count,
    page: input.page,
    perPage: REPOSITORIES_PER_PAGE,
    repositories: parsed.data.repositories.map((repository) => ({
      id: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      isPrivate: repository.private,
      description: repository.description,
      htmlUrl: repository.html_url,
      defaultBranch: repository.default_branch,
    })),
  }
}
