const PACKAGE_NAME = "@deessejs/cli"
const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

export class UpdateCheckError extends Error {
  readonly code: "registry_error" | "invalid_registry_response"

  constructor(code: UpdateCheckError["code"], message: string) {
    super(message)
    this.name = "UpdateCheckError"
    this.code = code
  }
}

export const fetchLatestStableCliVersion = async (
  fetcher: typeof fetch = fetch
): Promise<string> => {
  let response: Response
  try {
    response = await fetcher(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`)
  } catch (error) {
    throw new UpdateCheckError(
      "registry_error",
      `Could not reach the npm registry: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  if (!response.ok) {
    throw new UpdateCheckError(
      "registry_error",
      `The npm registry returned HTTP ${response.status}.`
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new UpdateCheckError(
      "invalid_registry_response",
      "The npm registry returned invalid JSON for the latest stable version."
    )
  }
  const version = parseStableVersion(body)
  if (!version) {
    throw new UpdateCheckError(
      "invalid_registry_response",
      "The npm registry response did not contain a stable X.Y.Z version."
    )
  }
  return version
}

const parseStableVersion = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null || !("version" in value)) {
    return null
  }
  return typeof value.version === "string" && STABLE_VERSION_PATTERN.test(value.version)
    ? value.version
    : null
}

export const compareStableCliVersions = (a: string, b: string): number => {
  const left = a.split(".").map(Number)
  const right = b.split(".").map(Number)
  for (let index = 0; index < 3; index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}
