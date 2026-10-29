export type GitHubRepo = {
  name: string
  full_name: string
  private?: boolean
  description: string | null
  license: { spdx_id: string | null; name: string } | null
  stargazers_count: number
  pushed_at: string | null
  topics?: string[]
  html_url: string
  default_branch?: string
}

export type GitHubCommit = { sha: string }

export type GitHubReadme = {
  content: string
  encoding: "base64"
}
