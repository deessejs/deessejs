import { parseProjectConfig } from "@workspace/registry"
import { z } from "zod"

const GITHUB_API_VERSION = "2022-11-28"
const MAX_GITHUB_RESPONSE_BYTES = 128 * 1024
const MAX_PROJECT_CONFIG_BYTES = 64 * 1024
const GITHUB_REQUEST_TIMEOUT_MS = 12_000

const branchSchema = z.object({
  commit: z.object({
    sha: z.string().regex(/^[a-f0-9]{40,64}$/i),
  }),
})

const contentSchema = z.object({
  type: z.literal("file"),
  path: z.literal("deesse.json"),
  encoding: z.literal("base64"),
  size: z.number().int().nonnegative(),
  content: z.string(),
})

export class GitHubProjectConfigRequestError extends Error {
  constructor(
    readonly status: number,
    readonly reason: "request_failed" | "invalid_response" | "response_too_large" =
      "request_failed"
  ) {
    super("GitHub project configuration request failed")
    this.name = "GitHubProjectConfigRequestError"
  }
}

async function readGitHubJson(
  response: Response,
  maxBytes = MAX_GITHUB_RESPONSE_BYTES
): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new GitHubProjectConfigRequestError(502, "response_too_large")
  }

  const body = await response.text()
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new GitHubProjectConfigRequestError(502, "response_too_large")
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }
}

async function requestGitHubJson(
  url: URL,
  accessToken: string,
  signal: AbortSignal
): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new GitHubProjectConfigRequestError(response.status)
  }

  return readGitHubJson(response)
}

function decodeProjectConfig(content: string, size: number): string {
  const encoded = content.replace(/\s/g, "")
  const isValidBase64 =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded
    )
  if (!isValidBase64) {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }

  const bytes = Buffer.from(encoded, "base64")
  if (bytes.byteLength !== size) {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }
}

export async function inspectGitHubProjectConfig(input: {
  fullName: string
  defaultBranch: string
  accessToken: string
}) {
  const [owner, repository, ...extraParts] = input.fullName.split("/")
  if (!owner || !repository || extraParts.length > 0) {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }

  const repositoryPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`
  const signal = AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS)
  const branchUrl = new URL(
    `${repositoryPath}/branches/${encodeURIComponent(input.defaultBranch)}`,
    "https://api.github.com"
  )
  const branchPayload = await requestGitHubJson(
    branchUrl,
    input.accessToken,
    signal
  )
  const branchResult = branchSchema.safeParse(branchPayload)
  if (!branchResult.success) {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }

  const commitSha = branchResult.data.commit.sha
  const contentUrl = new URL(
    `${repositoryPath}/contents/deesse.json`,
    "https://api.github.com"
  )
  contentUrl.searchParams.set("ref", commitSha)

  const response = await fetch(contentUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${input.accessToken}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
    signal,
  })

  if (response.status === 404) {
    return {
      commitSha,
      configuration: { status: "missing" as const },
    }
  }
  if (!response.ok) {
    throw new GitHubProjectConfigRequestError(response.status)
  }

  let payload: unknown
  try {
    payload = await readGitHubJson(response)
  } catch (error) {
    if (
      error instanceof GitHubProjectConfigRequestError &&
      error.reason === "response_too_large"
    ) {
      return {
        commitSha,
        configuration: { status: "too_large" as const },
      }
    }
    throw error
  }

  const contentResult = contentSchema.safeParse(payload)
  if (!contentResult.success) {
    throw new GitHubProjectConfigRequestError(502, "invalid_response")
  }
  if (contentResult.data.size > MAX_PROJECT_CONFIG_BYTES) {
    return {
      commitSha,
      configuration: { status: "too_large" as const },
    }
  }

  const source = decodeProjectConfig(
    contentResult.data.content,
    contentResult.data.size
  )
  let value: unknown
  try {
    value = JSON.parse(source) as unknown
  } catch {
    return {
      commitSha,
      configuration: { status: "invalid_json" as const },
    }
  }

  const parsed = parseProjectConfig(value)
  if (!parsed.success) {
    return {
      commitSha,
      configuration: {
        status: "invalid" as const,
        diagnostics: parsed.diagnostics,
      },
    }
  }

  return {
    commitSha,
    configuration: {
      status: "valid" as const,
      formatVersion: parsed.data.formatVersion,
      pathCount: Object.keys(parsed.data.paths ?? {}).length,
      aliasCount: Object.keys(parsed.data.aliases ?? {}).length,
    },
  }
}
