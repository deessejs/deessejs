import { describe, expect, it } from "vitest"
import { APIError } from "better-auth/api"

import {
  assertCreatableOrganization,
  beforeCreateOrganizationWithMarker,
  beforeUpdateOrganizationProtectingMarker,
} from "../../src/organization/provisioning.js"

const verifiedUser = { id: "user-1", emailVerified: true }
const unverifiedUser = { id: "user-1", emailVerified: false }

const callValidator = (
  input: { name?: string; slug?: string; metadata?: unknown },
  user = verifiedUser,
) => assertCreatableOrganization(input, user)

const callHook = (
  input: { name?: string; slug?: string; metadata?: unknown },
  user = verifiedUser,
) => beforeCreateOrganizationWithMarker({ organization: input, user })

describe("assertCreatableOrganization", () => {
  it("rejects control characters in the raw name (no trim)", () => {
    expect(() =>
      callValidator({ name: "\nAcme\n", slug: "acme" }),
    ).toThrow(APIError)
  })

  it("rejects surrounding whitespace in the raw name (no trim)", () => {
    expect(() => callValidator({ name: " Acme ", slug: "acme" })).toThrow(
      APIError,
    )
  })

  it("rejects a control character mid-string", () => {
    expect(() =>
      callValidator({ name: "A\u0000cme", slug: "acme" }),
    ).toThrow(APIError)
  })

  it("rejects when the name is missing", () => {
    expect(() => callValidator({ slug: "acme" })).toThrow(APIError)
  })

  it("rejects when the slug is missing", () => {
    expect(() => callValidator({ name: "Acme" })).toThrow(APIError)
  })

  it("rejects an unverified account", () => {
    expect(() =>
      callValidator({ name: "Acme", slug: "acme" }, unverifiedUser),
    ).toThrow(APIError)
  })

  it("rejects reserved slugs", () => {
    expect(() => callValidator({ name: "Acme", slug: "admin" })).toThrow(
      APIError,
    )
  })

  it("accepts a valid name and slug", () => {
    expect(() =>
      callValidator({ name: "Acme", slug: "acme" }),
    ).not.toThrow()
  })
})

describe("beforeCreateOrganizationWithMarker", () => {
  it("rejects a metadata that is not a marker", async () => {
    // The metadata is the application's, and the only thing it
    // accepts is a marker. The refusal happens before anything is
    // read, so it needs no database.
    await expect(
      callHook({ name: "Acme", slug: "acme", metadata: {} }),
    ).rejects.toThrow(APIError)
  })

  it("rejects a metadata of null", async () => {
    await expect(
      callHook({ name: "Acme", slug: "acme", metadata: null }),
    ).rejects.toThrow(APIError)
  })

  it("rejects a metadata whose marker is not a string", async () => {
    await expect(
      callHook({ name: "Acme", slug: "acme", metadata: { provisioningAttempt: 7 } }),
    ).rejects.toThrow(APIError)
  })

  it("rejects a name the policy rejects", async () => {
    await expect(
      callHook({ name: " Acme ", slug: "acme", metadata: { provisioningAttempt: "op-1" } }),
    ).rejects.toThrow(APIError)
  })

  it("rejects an unverified account", async () => {
    await expect(
      callHook(
        { name: "Acme", slug: "acme", metadata: { provisioningAttempt: "op-1" } },
        unverifiedUser,
      ),
    ).rejects.toThrow(APIError)
  })
})

describe("beforeUpdateOrganizationProtectingMarker", () => {
  const update = (organization: { name?: unknown; slug?: unknown; logo?: unknown }) =>
    beforeUpdateOrganizationProtectingMarker({
      organization,
      member: { organizationId: "org-1" },
      user: { id: "user-1" },
    })

  it("validates names and HTTPS logo URLs before allowing an update", async () => {
    await expect(update({ name: "Acme", logo: "https://cdn.example.com/logo.png" })).resolves.toBeUndefined()
    await expect(update({ name: " Acme" })).rejects.toThrow(APIError)
    await expect(update({ logo: "http://cdn.example.com/logo.png" })).rejects.toThrow(APIError)
  })

  it("refuses any attempt to change the organization slug", async () => {
    await expect(update({ slug: "new-slug" })).rejects.toThrow(APIError)
  })
})
