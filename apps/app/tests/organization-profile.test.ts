import { describe, expect, it } from "vitest"
import { organizationProfileSchema } from "../components/settings/organization-profile"

describe("organization profile form validation", () => {
  it("accepts a valid name and HTTPS logo URL", () => {
    expect(
      organizationProfileSchema.safeParse({
        name: "Acme",
        logo: "https://example.com/logo.png",
      }).success,
    ).toBe(true)
  })

  it.each([
    ["empty name", { name: "", logo: "" }],
    ["trimmed name", { name: " Acme ", logo: "" }],
    ["control characters", { name: "Acme\nCorp", logo: "" }],
    ["non-HTTPS logo", { name: "Acme", logo: "http://example.com/logo.png" }],
    ["logo credentials", { name: "Acme", logo: "https://user:pass@example.com/logo.png" }],
  ])("rejects %s", (_label, value) => {
    expect(organizationProfileSchema.safeParse(value).success).toBe(false)
  })
})
