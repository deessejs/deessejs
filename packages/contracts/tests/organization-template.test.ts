import { describe, expect, it } from "vitest"
import {
  OrganizationTemplateCreateInputV1,
  OrganizationTemplatesListResponseV1,
} from "../src/v1/index.js"

const template = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "starter",
  name: "Starter",
  description: "",
  owner: "acme",
  repo: "starter",
  category: "saas",
  labels: [],
  license: "MIT",
  canonicalUrl: "https://github.com/acme/starter",
  repositoryName: "starter",
  stars: null,
  fetchedAt: "2026-01-01T00:00:00.000Z",
  currentlyPublished: false,
  publication: null,
}

describe("organization template contracts", () => {
  it("parses organization-owned templates without publication", () => {
    expect(
      OrganizationTemplatesListResponseV1.parse({ templates: [template] })
        .templates[0]?.publication
    ).toBeNull()
  })

  it("accepts a pending publication independently of ownership", () => {
    const result = OrganizationTemplatesListResponseV1.parse({
      templates: [
        {
          ...template,
          publication: {
            reviewStatus: "pending",
            publicationState: "unpublished",
            submittedAt: "2026-01-01T00:00:00.000Z",
            reviewReason: null,
          },
        },
      ],
    })
    expect(result.templates[0]?.currentlyPublished).toBe(false)
    expect(result.templates[0]?.publication?.reviewStatus).toBe("pending")
  })

  it("validates creation category and required repository details", () => {
    const valid = {
      organizationSlug: "acme",
      slug: "starter",
      name: "Starter",
      repositoryUrl: "https://github.com/acme/starter",
      category: "saas",
      labels: [],
    }
    expect(OrganizationTemplateCreateInputV1.parse(valid).category).toBe("saas")
    expect(() =>
      OrganizationTemplateCreateInputV1.parse({ ...valid, category: "invalid" })
    ).toThrow()
    expect(() =>
      OrganizationTemplateCreateInputV1.parse({ ...valid, name: "" })
    ).toThrow()
  })
})
