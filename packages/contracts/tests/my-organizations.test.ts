import { describe, expect, it } from "vitest"
import { MyOrganizationsListResponseV1 } from "../src/v1/index.js"

describe("my organizations response contract", () => {
  it("parses current membership roles and nullable logos", () => {
    expect(
      MyOrganizationsListResponseV1.parse({
        organizations: [
          {
            id: "org-1",
            slug: "acme",
            name: "Acme",
            logo: null,
            role: "owner,admin",
          },
        ],
      }).organizations[0]?.role
    ).toBe("owner,admin")
  })
})
