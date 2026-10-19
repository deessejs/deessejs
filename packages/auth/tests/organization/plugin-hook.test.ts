import { describe, expect, it } from "vitest"
import { APIError } from "better-auth/api"
import { beforeCreateOrganizationHook } from "../../src/organization/plugin.js"

const baseUser = { emailVerified: true }
const verifiedUser = { emailVerified: true }
const unverifiedUser = { emailVerified: false }

const callHook = (input: { name?: string; slug?: string; metadata?: unknown }, user = verifiedUser) =>
  beforeCreateOrganizationHook({ organization: input, user })

describe("beforeCreateOrganizationHook", () => {
  it("rejects control characters in the raw name (no trim)", async () => {
    await expect(callHook({ name: "\nAcme\n", slug: "acme" })).rejects.toThrow(APIError)
  })

  it("rejects surrounding whitespace in the raw name (no trim)", async () => {
    await expect(callHook({ name: " Acme ", slug: "acme" })).rejects.toThrow(APIError)
  })

  it("accepts a valid name and slug and returns the no-op override", async () => {
    const result = await callHook({ name: "Acme", slug: "acme" })
    expect(result).toEqual({ data: { name: "Acme" } })
  })

  it("rejects a control character mid-string", async () => {
    await expect(callHook({ name: "A\u0000cme", slug: "acme" })).rejects.toThrow(APIError)
  })

  it("rejects when input.name is missing", async () => {
    await expect(callHook({ slug: "acme" })).rejects.toThrow(APIError)
  })

  it("rejects when input.slug is missing", async () => {
    await expect(callHook({ name: "Acme" })).rejects.toThrow(APIError)
  })

  it("rejects unverified users with FORBIDDEN", async () => {
    await expect(callHook({ name: "Acme", slug: "acme" }, unverifiedUser)).rejects.toThrow(APIError)
  })

  it("rejects when metadata is not null", async () => {
    await expect(callHook({ name: "Acme", slug: "acme", metadata: {} })).rejects.toThrow(APIError)
  })

  it("accepts metadata: null (default)", async () => {
    const result = await callHook({ name: "Acme", slug: "acme", metadata: null })
    expect(result).toEqual({ data: { name: "Acme" } })
  })

  it("rejects reserved slugs", async () => {
    await expect(callHook({ name: "Acme", slug: "admin" })).rejects.toThrow(APIError)
  })
})
