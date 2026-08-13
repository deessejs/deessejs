export type GitHubRepo = {
  name: string
  full_name: string
  description: string | null
  license: { spdx_id: string | null; name: string } | null
  stargazers_count: number
  pushed_at: string
  topics?: string[]
  html_url: string
}

export type GitHubReadme = {
  content: string
  encoding: "base64"
}
