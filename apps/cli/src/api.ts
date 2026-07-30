import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"

export type Template = {
  slug: string
  name: string
  description: string
  owner: string
  repo: string
  license: string
  category: string
  labels: string[]
  image?: string
  /** Optional override for the clone URL. Falls back to `https://github.com/<owner>/<repo>`. */
  cloneUrl?: string
}

export type ApiResponse = { templates: Template[] }

export const fetchTemplates = async (
  apiUrl: string,
): Promise<Template[]> => {
  let res: Response
  try {
    res = await fetch(apiUrl, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
    })
  } catch (e) {
    throw networkError(
      `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (!res.ok) {
    throw networkError(
      `endpoint returned HTTP ${res.status} ${res.statusText}`,
    )
  }

  let body: unknown
  try {
    body = await res.json()
  } catch (e) {
    throw parseError(
      `endpoint returned non-JSON body: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (!isApiResponse(body)) {
    throw parseError('response is missing "templates" array')
  }

  return body.templates
}

const isApiResponse = (value: unknown): value is ApiResponse => {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  if (!Array.isArray(obj.templates)) return false
  return obj.templates.every(isTemplate)
}

const isTemplate = (value: unknown): value is Template => {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.slug === "string" &&
    typeof obj.name === "string" &&
    typeof obj.description === "string" &&
    typeof obj.owner === "string" &&
    typeof obj.repo === "string" &&
    typeof obj.license === "string" &&
    typeof obj.category === "string" &&
    Array.isArray(obj.labels) &&
    obj.labels.every((l) => typeof l === "string") &&
    (obj.cloneUrl === undefined || typeof obj.cloneUrl === "string")
  )
}