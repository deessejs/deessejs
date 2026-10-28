export type GitHubRepository = {
  owner: string
  repo: string
  fullName: string
}

const OWNER_PATTERN = /^[A-Za-z0-9-]+$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+$/

export function isCanonicalGitHubUrl(url: URL): boolean {
  if (url.protocol !== "https:" || url.hostname !== "github.com") return false
  if (url.port || url.username || url.password) return false
  return !url.search && !url.hash
}

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

  if (!isCanonicalGitHubUrl(url)) return null

  const match = /^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url.pathname)
  const owner = match?.[1]
  const repo = match?.[2]
  if (!owner || !repo) return null
  if (!OWNER_PATTERN.test(owner) || !REPOSITORY_PATTERN.test(repo)) return null
  if (owner === "." || repo === "." || repo === "..") return null

  return { owner, repo, fullName: `${owner}/${repo}` }
}

export const looksLikeUrl = (input: string): boolean =>
  /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(input)
