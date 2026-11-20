import { describe, expect, it } from "vitest"
import { getApiRequestPath } from "@/lib/api-route-path"
import { API_BASE_PATH } from "@workspace/api/base-path"

describe("getApiRequestPath", () => {
  it("maps OAuth protected resource discovery aliases into the Hono mount", () => {
    expect(
      getApiRequestPath("/.well-known/oauth-protected-resource/api/v1/mcp"),
    ).toBe(
      `${API_BASE_PATH}/.well-known/oauth-protected-resource/api/v1/mcp`,
    )
  })

  it("maps the project schema alias into the Hono mount", () => {
    expect(getApiRequestPath("/schema/project/v1.json")).toBe(
      `${API_BASE_PATH}/schema/project/v1.json`,
    )
  })

  it("leaves API routes and unrelated paths unchanged", () => {
    expect(getApiRequestPath(`${API_BASE_PATH}/health`)).toBe(
      `${API_BASE_PATH}/health`,
    )
    expect(getApiRequestPath("/ordinary-page")).toBe("/ordinary-page")
  })
})
