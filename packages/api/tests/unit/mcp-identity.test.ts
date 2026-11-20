import { describe, expect, it } from "vitest"
import { mapVerifiedMcpClaimsToIdentity } from "../../src/http/routes/mcp-identity.js"

describe("MCP OAuth identity mapping", () => {
  it("maps Better Auth's verified subject and scopes without creating a session", () => {
    expect(
      mapVerifiedMcpClaimsToIdentity({
        sub: "deesse-user-1",
        scope: "openid templates:read organizations:read",
      })
    ).toEqual({
      userId: "deesse-user-1",
      scopes: ["openid", "templates:read", "organizations:read"],
    })
  })

  it("does not accept an absent subject or non-string scope claim", () => {
    expect(
      mapVerifiedMcpClaimsToIdentity({ sub: 42, scope: ["organizations:read"] })
    ).toEqual({
      userId: null,
      scopes: [],
    })
  })
})
