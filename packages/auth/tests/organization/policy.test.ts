import { describe, expect, it } from "vitest"
import { APIError } from "better-auth/api"
import { assertOrganizationName, assertOrganizationSlug } from "../../src/organization/policy.js"

describe("assertOrganizationSlug", () => {
  it("accepts well-formed slugs", () => {
    expect(() => assertOrganizationSlug("acme")).not.toThrow()
    expect(() => assertOrganizationSlug("acme-corp")).not.toThrow()
    expect(() => assertOrganizationSlug("a1")).not.toThrow()
    expect(() => assertOrganizationSlug("a-b-c-d")).not.toThrow()
  })

  it("rejects empty, too-short, too-long, malformed, and reserved slugs", () => {
    expect(() => assertOrganizationSlug("")).toThrow(APIError)
    expect(() => assertOrganizationSlug("a")).toThrow(APIError)
    expect(() => assertOrganizationSlug("a".repeat(39))).toThrow(APIError)
    expect(() => assertOrganizationSlug("Acme")).toThrow(APIError)
    expect(() => assertOrganizationSlug("acmé")).toThrow(APIError)
    expect(() => assertOrganizationSlug("-acme")).toThrow(APIError)
    expect(() => assertOrganizationSlug("acme-")).toThrow(APIError)
    expect(() => assertOrganizationSlug("ac me")).toThrow(APIError)
    expect(() => assertOrganizationSlug("admin")).toThrow(APIError)
    expect(() => assertOrganizationSlug("deessejs")).toThrow(APIError)
  })

  it("throws APIError with code invalid_slug", () => {
    try {
      assertOrganizationSlug("Acme")
      expect.fail("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      const body = (error as APIError).body as { code?: string }
      expect(body.code).toBe("invalid_slug")
    }
  })
})

describe("assertOrganizationName", () => {
  it("accepts ASCII, Unicode, single-char, and emoji names", () => {
    expect(() => assertOrganizationName("Acme Corp")).not.toThrow()
    expect(() => assertOrganizationName("Société Générale")).not.toThrow()
    expect(() => assertOrganizationName("a")).not.toThrow()
    expect(() => assertOrganizationName("🚀 Studio")).not.toThrow()
    expect(() => assertOrganizationName("a b")).not.toThrow()
  })

  it("accepts boundary length in code points (100 chars and 100 emoji)", () => {
    expect(() => assertOrganizationName("a".repeat(100))).not.toThrow()
    expect(() => assertOrganizationName("🚀".repeat(100))).not.toThrow()
  })

  it("rejects 101 code points (both ASCII and emoji)", () => {
    expect(() => assertOrganizationName("a".repeat(101))).toThrow(APIError)
    expect(() => assertOrganizationName("🚀".repeat(101))).toThrow(APIError)
  })

  it("rejects non-strings", () => {
    expect(() => assertOrganizationName(null)).toThrow(APIError)
    expect(() => assertOrganizationName(undefined)).toThrow(APIError)
    expect(() => assertOrganizationName(42)).toThrow(APIError)
    expect(() => assertOrganizationName({})).toThrow(APIError)
  })

  it("rejects empty and whitespace-only", () => {
    expect(() => assertOrganizationName("")).toThrow(APIError)
    expect(() => assertOrganizationName("   ")).toThrow(APIError)
  })

  it("rejects leading or trailing whitespace", () => {
    expect(() => assertOrganizationName(" Acme")).toThrow(APIError)
    expect(() => assertOrganizationName("Acme ")).toThrow(APIError)
  })

  it("rejects control characters anywhere in the string", () => {
    expect(() => assertOrganizationName("\u0000")).toThrow(APIError)
    expect(() => assertOrganizationName("\u0001")).toThrow(APIError)
    expect(() => assertOrganizationName("\u001f")).toThrow(APIError)
    expect(() => assertOrganizationName("\u007f")).toThrow(APIError)
    expect(() => assertOrganizationName("\u0080")).toThrow(APIError)
    expect(() => assertOrganizationName("\u009f")).toThrow(APIError)
    expect(() => assertOrganizationName("A\u0000cme")).toThrow(APIError)
  })

  it("rejects surrounding whitespace plus control character", () => {
    expect(() => assertOrganizationName(" \u0000 ")).toThrow(APIError)
  })

  it("throws APIError with code invalid_name", () => {
    try {
      assertOrganizationName(" Acme")
      expect.fail("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      const body = (error as APIError).body as { code?: string }
      expect(body.code).toBe("invalid_name")
    }
  })

  it("does not mutate its argument on rejection", () => {
    const original = " Acme "
    try {
      assertOrganizationName(original)
      expect.fail("expected throw")
    } catch {
      // expected
    }
    expect(original).toBe(" Acme ")
  })
})
