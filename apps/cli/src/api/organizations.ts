import { CliError } from "../errors/index.js"
import { parseError } from "../errors/parse.js"
import { bearerFetch } from "../lib/auth/store/bearer-fetch.js"

export type Organization = {
  id: string
  name: string
  slug: string
  logo: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const hasOrganizationFields = (
  value: Record<string, unknown>
): value is Record<string, unknown> & Organization => {
  if (typeof value.id !== "string") return false
  if (typeof value.name !== "string") return false
  if (typeof value.slug !== "string") return false
  if (value.logo !== null && typeof value.logo !== "string") return false
  return true
}

const readOrganization = (value: unknown): Organization => {
  if (!isRecord(value) || !hasOrganizationFields(value)) {
    throw parseError(
      "Expected organization id, name, slug and nullable logo fields.",
      "Better Auth returned malformed organization data"
    )
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    logo: value.logo,
  }
}

const readError = async (
  response: Response
): Promise<Record<string, unknown>> => {
  try {
    const value: unknown = await response.json()
    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

async function fetchBetterAuthJson(
  path: string,
  accessToken: string
): Promise<unknown> {
  let response: Response
  try {
    response = await bearerFetch(path, accessToken, { method: "GET" })
  } catch (error) {
    throw new CliError(
      "network_error",
      "Could not reach the DeesseJS API.",
      error instanceof Error ? error.message : "Check your network connection."
    )
  }

  if (response.status === 401) {
    throw new CliError(
      "auth_required",
      "Your CLI session has expired.",
      "Run `deessejs auth login` to sign in again."
    )
  }
  if (response.status === 403 || response.status === 404) {
    throw new CliError(
      "organization_not_found",
      "You cannot access that organization.",
      "Run `deessejs organization list` to see your organizations."
    )
  }
  if (!response.ok) {
    const body = await readError(response)
    const serverCode = typeof body.code === "string" ? body.code : undefined
    throw new CliError(
      "organization_api_error",
      "The organization request failed.",
      serverCode
        ? `The server returned ${serverCode}.`
        : `HTTP ${response.status}.`
    )
  }

  try {
    return await response.json()
  } catch {
    throw parseError(
      "The response was not valid JSON.",
      "Better Auth returned malformed organization data"
    )
  }
}

export async function listOrganizations(
  accessToken: string
): Promise<Organization[]> {
  const value = await fetchBetterAuthJson("organization/list", accessToken)
  if (!Array.isArray(value)) {
    throw parseError(
      "Expected an array of organizations.",
      "Better Auth returned malformed organization data"
    )
  }
  return value.map(readOrganization)
}

export async function getOrganizationRole(
  organizationId: string,
  accessToken: string
): Promise<string> {
  const query = new URLSearchParams({ organizationId })
  const value = await fetchBetterAuthJson(
    `organization/get-active-member-role?${query.toString()}`,
    accessToken
  )
  if (!isRecord(value) || typeof value.role !== "string") {
    throw parseError(
      "Expected the current user's organization role.",
      "Better Auth returned malformed organization data"
    )
  }
  return value.role
}
