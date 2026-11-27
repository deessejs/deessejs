import { describe, expect, it } from "vitest"
import {
  OrganizationProjectDetailResponseV1,
  OrganizationProjectsListResponseV1,
} from "../src/v1/index.js"

const project = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "starter",
  repositoryId: "1234",
  repositoryFullName: "acme/starter",
  repositoryUrl: "https://github.com/acme/starter",
  isPrivate: true,
  defaultBranch: "main",
  configurationPath: "deesse.json",
  status: "valid" as const,
  lastCheckedAt: "2026-01-01T00:00:00.000Z",
}

describe("organization project read contracts", () => {
  it("parses bounded list pages", () => {
    expect(
      OrganizationProjectsListResponseV1.parse({
        projects: [project],
        pagination: { page: 1, pageSize: 1, hasMore: true },
      }).pagination?.hasMore
    ).toBe(true)
  })

  it("parses the project detail observation", () => {
    expect(
      OrganizationProjectDetailResponseV1.parse({
        project: {
          ...project,
          commitSha: null,
          formatVersion: 1,
          pathCount: 3,
          aliasCount: 0,
        },
      }).project.repositoryFullName
    ).toBe("acme/starter")
  })
})
