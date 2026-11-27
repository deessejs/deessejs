import { describe, expect, it } from "vitest"
import {
  repositoryUrlForSource,
  switchTemplateSource,
} from "../lib/template-source-form"

const withGitHubUrl = {
  sourceType: "github" as const,
  repositoryUrl: "https://github.com/acme/starter",
  slug: "starter",
}

describe("managed template source form state", () => {
  it("preserves the URL while switching and omits it from managed creates", () => {
    expect(switchTemplateSource(withGitHubUrl, "managed")).toEqual({
      ...withGitHubUrl,
      sourceType: "managed",
      repositoryUrl: withGitHubUrl.repositoryUrl,
    })
    expect(
      repositoryUrlForSource("managed", withGitHubUrl.repositoryUrl)
    ).toEqual({})
  })

  it("omits stale repository values for managed creates and keeps GitHub creates intact", () => {
    expect(
      repositoryUrlForSource("managed", withGitHubUrl.repositoryUrl)
    ).toEqual({})
    expect(
      repositoryUrlForSource("github", withGitHubUrl.repositoryUrl)
    ).toEqual({ repositoryUrl: withGitHubUrl.repositoryUrl })
  })
})
