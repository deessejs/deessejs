/**
 * Minimal GitHub REST client.
 *
 * Scope: only the two endpoints currently consumed
 * (`GET /repos/{owner}/{repo}` and `GET /repos/{owner}/{repo}/readme`).
 * Not a general-purpose GitHub SDK; do not extend without a consumer
 * that needs the new shape.
 *
 * Auth: the GITHUB_TOKEN env var (optional) lifts the anonymous rate
 * limit from 60 req/h to 5000 req/h. In production on Vercel, set
 * this as a project secret.
 */
import type { GitHubReadme, GitHubRepo } from "./types.js"

const GITHUB_API = "https://api.github.com"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function isGitHubRepo(value: unknown): value is GitHubRepo {
  if (!isRecord(value)) return false
  const license = value.license
  return (
    typeof value.name === "string" &&
    typeof value.full_name === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (license === null ||
      (isRecord(license) &&
        (typeof license.spdx_id === "string" || license.spdx_id === null) &&
        typeof license.name === "string")) &&
    typeof value.stargazers_count === "number" &&
    typeof value.pushed_at === "string" &&
    (value.topics === undefined ||
      (Array.isArray(value.topics) &&
        value.topics.every((topic) => typeof topic === "string"))) &&
    typeof value.html_url === "string"
  )
}

function isGitHubReadme(value: unknown): value is GitHubReadme {
  return (
    isRecord(value) &&
    typeof value.content === "string" &&
    value.encoding === "base64"
  )
}

const headers = (token: string | undefined): Record<string, string> => {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deessejs-api",
  }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

export const fetchRepo = async (
  owner: string,
  repo: string,
  token: string | undefined
): Promise<GitHubRepo> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: headers(token),
  })
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo} returned ${response.status}`
    )
  }
  const payload: unknown = await response.json()
  if (!isGitHubRepo(payload)) {
    throw new Error(
      `GitHub /repos/${owner}/${repo} returned an invalid response`
    )
  }
  return payload
}

export const fetchReadme = async (
  owner: string,
  repo: string,
  token: string | undefined
): Promise<string | undefined> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
    headers: headers(token),
  })
  if (response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/readme returned ${response.status}`
    )
  }
  const payload: unknown = await response.json()
  if (!isGitHubReadme(payload)) return undefined
  // GitHub returns base64 with embedded newlines every 60 chars.
  return Buffer.from(payload.content, "base64").toString("utf8")
}
