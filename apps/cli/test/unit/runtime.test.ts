import { beforeEach, describe, expect, it } from "vitest"

import {
  getApiBaseUrl,
  getApiRpcUrl,
  getApiVersionUrl,
  resetApiBaseUrlCache,
} from "../../src/api/runtime.js"

describe("runtime API URL resolution", () => {
  beforeEach(() => {
    delete process.env.API_BASE_URL
    resetApiBaseUrlCache()
  })

  it("1. API_BASE_URL unset → returns the production default", () => {
    delete process.env.API_BASE_URL
    const url = getApiBaseUrl()
    expect(url).toBe("https://deessejs.com")
  })

  it("2. API_BASE_URL set to a valid URL → returns the URL", () => {
    process.env.API_BASE_URL = "https://self-hosted.example.com"
    const url = getApiBaseUrl()
    expect(url).toBe("https://self-hosted.example.com")
  })

  it("3. API_BASE_URL set to an empty string → throws", () => {
    process.env.API_BASE_URL = ""
    expect(() => getApiBaseUrl()).toThrow(/API_BASE_URL/)
  })

  it("4. API_BASE_URL set to a malformed value → throws", () => {
    process.env.API_BASE_URL = "not a url with whitespace"
    expect(() => getApiBaseUrl()).toThrow(/not a valid URL/)
  })

  it("5. getApiRpcUrl and getApiVersionUrl join paths correctly", () => {
    process.env.API_BASE_URL = "http://localhost:4873"
    expect(getApiRpcUrl()).toBe("http://localhost:4873/api/v1/rpc")
    expect(getApiVersionUrl()).toBe("http://localhost:4873/api/v1/version")
  })
})
