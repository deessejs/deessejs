/**
 * Pin the contract of the inter-app URL fields introduced in
 * ADR-021. The fields appear on both `clientSchema` and
 * `serverInputShape`; the validation rules are shared via the
 * `canonicalUrl` helper in `packages/env/src/schema.ts`. This
 * file tests the schema directly (no env loader, no snapshot)
 * so each field's behaviour localises to a single case.
 *
 * Per ADR-011 §47, every test file fits one of the three tiers
 * and ties to one concept; this file pins the URL contract.
 */
import { describe, expect, it } from "vitest"

import { canonicalUrl, clientSchema, serverInputShape } from "../../src/schema.js"

describe("inter-app URL fields (ADR-021)", () => {
  describe("canonicalUrl helper", () => {
    it("accepts a valid URL without a trailing slash", () => {
      const result = canonicalUrl.safeParse("https://app.deessejs.com")
      expect(result.success).toBe(true)
    })

    it("accepts a valid URL with a path (no trailing slash)", () => {
      const result = canonicalUrl.safeParse(
        "https://app.deessejs.com/some/path",
      )
      expect(result.success).toBe(true)
    })

    it("rejects a URL ending with a trailing slash", () => {
      const result = canonicalUrl.safeParse("https://app.deessejs.com/")
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) => /trailing slash/i.test(i.message)),
        ).toBe(true)
      }
    })

    it("rejects a non-URL string", () => {
      const result = canonicalUrl.safeParse("not-a-url")
      expect(result.success).toBe(false)
    })

    it("rejects an empty string", () => {
      const result = canonicalUrl.safeParse("")
      expect(result.success).toBe(false)
    })
  })

  describe("clientSchema NEXT_PUBLIC_* URL fields", () => {
    it("all four URL fields default to localhost ports in dev", () => {
      const parsed = clientSchema.parse({})
      expect(parsed.NEXT_PUBLIC_WEB_URL).toBe("http://localhost:3000")
      expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3001")
      expect(parsed.NEXT_PUBLIC_DOCS_URL).toBe("http://localhost:3002")
      expect(parsed.NEXT_PUBLIC_API_BASE_URL).toBe("http://localhost:3001")
    })

    it("accepts production URLs (https, no trailing slash)", () => {
      const parsed = clientSchema.parse({
        NEXT_PUBLIC_WEB_URL: "https://deessejs.com",
        NEXT_PUBLIC_APP_URL: "https://app.deessejs.com",
        NEXT_PUBLIC_DOCS_URL: "https://docs.deessejs.com",
        NEXT_PUBLIC_API_BASE_URL: "https://app.deessejs.com",
      })
      expect(parsed.NEXT_PUBLIC_WEB_URL).toBe("https://deessejs.com")
      expect(parsed.NEXT_PUBLIC_API_BASE_URL).toBe("https://app.deessejs.com")
    })

    it("rejects a NEXT_PUBLIC_* URL with a trailing slash", () => {
      const result = clientSchema.safeParse({
        NEXT_PUBLIC_API_BASE_URL: "https://app.deessejs.com/",
      })
      expect(result.success).toBe(false)
    })

    it("rejects a NEXT_PUBLIC_* URL that is not a URL", () => {
      const result = clientSchema.safeParse({
        NEXT_PUBLIC_WEB_URL: "not-a-url",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("serverInputShape URL fields", () => {
    it("accepts production URLs for WEB_URL, APP_URL, DOCS_URL, API_BASE_URL", () => {
      const parsed = serverInputShape.parse({
        WEB_URL: "https://deessejs.com",
        APP_URL: "https://app.deessejs.com",
        DOCS_URL: "https://docs.deessejs.com",
        API_BASE_URL: "https://app.deessejs.com",
      })
      expect(parsed.WEB_URL).toBe("https://deessejs.com")
      expect(parsed.APP_URL).toBe("https://app.deessejs.com")
      expect(parsed.DOCS_URL).toBe("https://docs.deessejs.com")
      expect(parsed.API_BASE_URL).toBe("https://app.deessejs.com")
    })

    it("rejects a server URL with a trailing slash", () => {
      const result = serverInputShape.safeParse({
        API_BASE_URL: "https://app.deessejs.com/",
      })
      expect(result.success).toBe(false)
    })

    it("rejects a server URL that is not a URL", () => {
      const result = serverInputShape.safeParse({
        WEB_URL: "not-a-url",
      })
      expect(result.success).toBe(false)
    })
  })
})