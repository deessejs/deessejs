import { describe, expect, it } from "vitest"
import {
  looksLikeUrl,
  parseGitHubRepositoryUrl,
} from "../../src/utils/github-repository.js"

describe("parseGitHubRepositoryUrl", () => {
  it.each([
    [
      "https://github.com/deessejs/package-template",
      "deessejs/package-template",
    ],
    [
      "https://github.com/deessejs/package-template/",
      "deessejs/package-template",
    ],
    [
      "https://github.com/deessejs/package-template.git",
      "deessejs/package-template",
    ],
    [
      "https://github.com/deessejs/package-template.git/",
      "deessejs/package-template",
    ],
  ])("parses %s", (input, fullName) => {
    expect(parseGitHubRepositoryUrl(input)?.fullName).toBe(fullName)
  })

  it.each([
    "http://github.com/deessejs/package-template",
    "https://github.com/deessejs/package-template/tree/main",
    "https://github.com/deessejs/package-template/issues/1",
    "https://github.com/deessejs/package-template?tab=readme",
    "https://github.com.evil.example/deessejs/package-template",
    "https://user@github.com/deessejs/package-template",
    "https://github.com/../package-template",
    "https://github.com/deessejs/../other",
  ])("rejects non-repository URL %s", (input) => {
    expect(parseGitHubRepositoryUrl(input)).toBeNull()
  })
})

describe("looksLikeUrl", () => {
  it("distinguishes URLs from catalog slugs", () => {
    expect(looksLikeUrl("https://github.com/deessejs/package-template")).toBe(
      true
    )
    expect(looksLikeUrl("saas-starter")).toBe(false)
  })
})
