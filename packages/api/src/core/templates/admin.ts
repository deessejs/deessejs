import { fetchReadme, fetchRepo } from "../github/client.js"
import type { GitHubRepo } from "../github/types.js"
import { serverEnv } from "@workspace/env/server"

export type GitHubRepositorySource = {
  owner: string
  repo: string
}

export class InvalidTemplateSourceError extends Error {
  constructor(message = "The source must be a public GitHub repository URL.") {
    super(message)
    this.name = "InvalidTemplateSourceError"
  }
}

export class TemplateSourceFetchError extends Error {
  constructor(cause: unknown) {
    super("GitHub repository data could not be fetched.", { cause })
    this.name = "TemplateSourceFetchError"
  }
}

/** Accept only a repository URL and build all outbound URLs from fixed hosts. */
export function parseGitHubRepositoryUrl(
  value: string
): GitHubRepositorySource | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (!isAllowedRepositoryUrl(url)) return null

  const [owner, rawRepo] = url.pathname.split("/").filter(Boolean)
  if (!owner || !rawRepo) return null
  const repo = rawRepo.replace(/\.git$/i, "")

  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
    !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    return null
  }

  return { owner, repo }
}

function isAllowedRepositoryUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false
  if (url.hostname.toLowerCase() !== "github.com") return false
  if (url.username || url.password || url.port) return false
  if (url.search || url.hash) return false
  return true
}

function isCanonicalGitHubRepository(repo: GitHubRepo): boolean {
  if (repo.private !== false) return false

  const [owner, name, ...extra] = repo.full_name.split("/")
  if (!owner || !name || extra.length > 0) return false

  try {
    const url = new URL(repo.html_url)
    return (
      url.protocol === "https:" &&
      url.hostname.toLowerCase() === "github.com" &&
      url.pathname.replace(/\/$/, "").toLowerCase() ===
        `/${owner}/${name}`.toLowerCase()
    )
  } catch {
    return false
  }
}

/** Fetch and validate the current repository observation before any write. */
export async function acquireTemplateRepository(sourceUrl: string) {
  const source = parseGitHubRepositoryUrl(sourceUrl)
  if (!source) throw new InvalidTemplateSourceError()

  const token = serverEnv.GITHUB_TOKEN
  try {
    const repository = await fetchRepo(source.owner, source.repo, token)
    if (!isCanonicalGitHubRepository(repository)) {
      throw new InvalidTemplateSourceError(
        "The URL must resolve to a public GitHub repository."
      )
    }

    const readme = await fetchReadme(source.owner, source.repo, token)
    const [owner, repo] = repository.full_name.split("/")
    if (!owner || !repo) {
      throw new InvalidTemplateSourceError(
        "GitHub returned an invalid repository name."
      )
    }
    const repositoryUpdatedAt = repository.pushed_at
      ? new Date(repository.pushed_at)
      : null

    if (
      repositoryUpdatedAt &&
      !Number.isFinite(repositoryUpdatedAt.getTime())
    ) {
      throw new Error("GitHub returned an invalid repository update time.")
    }

    return {
      owner,
      repo,
      snapshot: {
        repositoryName: repository.name,
        repositoryDescription: repository.description,
        canonicalUrl: repository.html_url,
        license:
          repository.license?.spdx_id ?? repository.license?.name ?? null,
        topics: repository.topics ?? [],
        readme: readme ?? null,
        repositoryUpdatedAt,
        stars: repository.stargazers_count,
        fetchedAt: new Date(),
      },
    }
  } catch (error) {
    if (error instanceof InvalidTemplateSourceError) throw error
    throw new TemplateSourceFetchError(error)
  }
}
