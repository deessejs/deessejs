import { TemplatesListResponseV1 } from "@workspace/contracts/v1"
import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"

export type Template = TemplatesListResponseV1["templates"][number]

export const fetchTemplates = async (apiUrl: string): Promise<Template[]> => {
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

  const result = TemplatesListResponseV1.safeParse(body)
  if (!result.success) {
    throw parseError(
      `response shape mismatch: ${result.error.issues.map((i) => `${i.path.join(".")} (${i.code})`).join(", ")}`,
    )
  }

  return result.data.templates
}
