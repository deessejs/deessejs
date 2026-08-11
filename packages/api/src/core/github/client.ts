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
  token: string | undefined,
): Promise<GitHubRepo> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: headers(token),
  })
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo} returned ${response.status}`,
    )
  }
  return response.json() as Promise<GitHubRepo>
}

export const fetchReadme = async (
  owner: string,
  repo: string,
  token: string | undefined,
): Promise<string | undefined> => {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/readme`,
    { headers: headers(token) },
  )
  if (response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/readme returned ${response.status}`,
    )
  }
  const payload = (await response.json()) as GitHubReadme
  if (payload.encoding !== "base64") return undefined
  // GitHub returns base64 with embedded newlines every 60 chars.
  return Buffer.from(payload.content, "base64").toString("utf8")
}
