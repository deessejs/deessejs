export type GitHubRepository = {
  owner: string
  repo: string
  fullName: string
}

const OWNER_PATTERN = /^[A-Za-z0-9-]+$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+$/

/** Parse a canonical HTTPS URL to a GitHub repository root. */
export const parseGitHubRepositoryUrl = (
  input: string
): GitHubRepository | null => {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return null
  }

  const match = /^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url.pathname)
  const owner = match?.[1]
  const repo = match?.[2]
  if (
    !owner ||
    !repo ||
    !OWNER_PATTERN.test(owner) ||
    !REPOSITORY_PATTERN.test(repo) ||
    owner === "." ||
    repo === "." ||
    repo === ".."
  ) {
    return null
  }

  return { owner, repo, fullName: `${owner}/${repo}` }
}

export const looksLikeUrl = (input: string): boolean =>
  /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(input)
