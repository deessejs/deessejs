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
import type { GitHubCommit, GitHubReadme, GitHubRepo } from "./types.js"

const GITHUB_API = "https://api.github.com"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function isGitHubRepo(value: unknown): value is GitHubRepo {
  if (!isRecord(value)) return false
  if (typeof value.name !== "string" || typeof value.full_name !== "string") {
    return false
  }
  if (typeof value.description !== "string" && value.description !== null) {
    return false
  }
  if (value.private !== undefined && typeof value.private !== "boolean") {
    return false
  }
  if (!isGitHubLicense(value.license)) return false
  if (typeof value.stargazers_count !== "number") return false
  if (!Number.isInteger(value.stargazers_count) || value.stargazers_count < 0) {
    return false
  }
  if (typeof value.pushed_at !== "string" && value.pushed_at !== null) {
    return false
  }
  if (value.topics !== undefined && !isStringArray(value.topics)) return false
  if (
    value.default_branch !== undefined &&
    typeof value.default_branch !== "string"
  ) {
    return false
  }
  return typeof value.html_url === "string"
}

function isGitHubCommit(value: unknown): value is GitHubCommit {
  return (
    isRecord(value) &&
    typeof value.sha === "string" &&
    /^[a-f0-9]{40}$/i.test(value.sha)
  )
}

function isGitHubLicense(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value)) return false
  if (typeof value.spdx_id !== "string" && value.spdx_id !== null) return false
  return typeof value.name === "string"
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
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
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: headers(token) }
  )
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

export const fetchCommit = async (
  owner: string,
  repo: string,
  ref: string,
  token: string | undefined
): Promise<GitHubCommit> => {
  const response = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}`,
    { headers: headers(token) }
  )
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/commits/${ref} returned ${response.status}`
    )
  }
  const payload: unknown = await response.json()
  if (!isGitHubCommit(payload)) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/commits/${ref} returned an invalid response`
    )
  }
  return payload
}

export const fetchReadme = async (
  owner: string,
  repo: string,
  token: string | undefined,
  ref?: string
): Promise<string | undefined> => {
  const url = new URL(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`
  )
  if (ref) url.searchParams.set("ref", ref)
  const response = await fetch(url, { headers: headers(token) })
  if (response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/readme returned ${response.status}`
    )
  }
  const payload: unknown = await response.json()
  if (!isGitHubReadme(payload)) {
    throw new Error(
      `GitHub /repos/${owner}/${repo}/readme returned an invalid response`
    )
  }
  // GitHub returns base64 with embedded newlines every 60 chars.
  return Buffer.from(payload.content, "base64").toString("utf8")
}
