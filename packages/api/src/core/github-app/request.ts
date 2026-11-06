export const GITHUB_REQUEST_TIMEOUT_MS = 12_000
export const MAX_GITHUB_RESPONSE_BYTES = 128 * 1024
export const MAX_GITHUB_TOKEN_RESPONSE_BYTES = 16 * 1024

export type GitHubAppRequestFailure =
  | "timeout"
  | "network"
  | "upstream"
  | "response_too_large"
  | "invalid_json"

export class GitHubAppRequestError extends Error {
  constructor(
    readonly failure: GitHubAppRequestFailure,
    readonly status?: number,
    options?: ErrorOptions
  ) {
    super("GitHub App request failed", options)
    this.name = "GitHubAppRequestError"
  }
}

type RequestOptions = {
  timeoutMs?: number
  maxResponseBytes?: number
  allowErrorResponse?: boolean
}

function cancelBody(body: ReadableStream<Uint8Array> | null): void {
  void body?.cancel().catch(() => undefined)
}

function rejectKnownOversizedBody(
  response: Response,
  maxBytes: number
): void {
  const contentLength = response.headers.get("content-length")
  if (
    contentLength &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > maxBytes
  ) {
    cancelBody(response.body)
    throw new GitHubAppRequestError("response_too_large")
  }
}

async function readBodyBytes(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        void reader.cancel().catch(() => undefined)
        throw new GitHubAppRequestError("response_too_large")
      }
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof GitHubAppRequestError) throw error
    if (signal.aborted) {
      throw new GitHubAppRequestError("timeout", undefined, { cause: error })
    }
    throw new GitHubAppRequestError("network", undefined, { cause: error })
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function readBoundedBody(
  response: Response,
  signal: AbortSignal,
  maxBytes: number
): Promise<string> {
  rejectKnownOversizedBody(response, maxBytes)
  if (!response.body) return ""

  const bytes = await readBodyBytes(response.body, signal, maxBytes)
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch (error) {
    throw new GitHubAppRequestError("invalid_json", undefined, { cause: error })
  }
}

export async function requestGitHubAppJson(
  input: string | URL,
  init: RequestInit,
  options: RequestOptions = {}
): Promise<{ response: Response; data: unknown }> {
  const timeoutMs = options.timeoutMs ?? GITHUB_REQUEST_TIMEOUT_MS
  const maxBytes = options.maxResponseBytes ?? MAX_GITHUB_RESPONSE_BYTES
  const signal = AbortSignal.timeout(timeoutMs)

  let response: Response
  try {
    response = await fetch(input, { ...init, signal })
  } catch (error) {
    if (signal.aborted) {
      throw new GitHubAppRequestError("timeout", undefined, { cause: error })
    }
    throw new GitHubAppRequestError("network", undefined, { cause: error })
  }

  const body = await readBoundedBody(response, signal, maxBytes)
  let data: unknown
  try {
    data = JSON.parse(body) as unknown
  } catch (error) {
    throw new GitHubAppRequestError("invalid_json", undefined, { cause: error })
  }

  if (!response.ok && !options.allowErrorResponse) {
    throw new GitHubAppRequestError("upstream", response.status)
  }

  return { response, data }
}
