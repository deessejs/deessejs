import { describe, expect, it } from "vitest"
import { safeRedirect } from "../src/safe-redirect.js"

describe("safeRedirect", () => {
  describe("accepts safe relative paths", () => {
    const safe = [
      "/",
      "/home",
      "/settings/account",
      "/verify-email?token=abc",
      "/verify-email#fragment",
      "/path/with/many/segments",
    ]
    for (const input of safe) {
      it(`returns input unchanged for ${JSON.stringify(input)}`, () => {
        expect(safeRedirect(input)).toBe(input)
      })
    }
  })

  describe("rejects fully-qualified URLs", () => {
    const unsafe = [
      "https://evil.com",
      "http://evil.com",
      "https://evil.com/path",
      "HTTPS://EVIL.COM",
      "//evil.com",
      "//evil.com/path",
      "//evil.com?next=/home",
      "///triple-slash",
      "/\\evil.com",
      "/\\\\evil.com",
      "/\\/evil.com",
    ]
    for (const input of unsafe) {
      it(`falls back for ${JSON.stringify(input)}`, () => {
        expect(safeRedirect(input)).toBe("/")
      })
    }
  })

  describe("rejects non-string inputs", () => {
    it("returns fallback for null", () => {
      expect(safeRedirect(null)).toBe("/")
    })
    it("returns fallback for undefined", () => {
      expect(safeRedirect(undefined)).toBe("/")
    })
    it("returns fallback for empty string", () => {
      expect(safeRedirect("")).toBe("/")
    })
  })

  describe("rejects scheme prefixes that are not URLs", () => {
    const unsafe = [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "about:blank",
    ]
    for (const input of unsafe) {
      it(`falls back for ${JSON.stringify(input)}`, () => {
        expect(safeRedirect(input)).toBe("/")
      })
    }
  })

  describe("uses custom fallback", () => {
    it("returns custom fallback for null", () => {
      expect(safeRedirect(null, "/login")).toBe("/login")
    })
    it("returns custom fallback for unsafe input", () => {
      expect(safeRedirect("//evil.com", "/home")).toBe("/home")
    })
    it("returns input unchanged for safe input even with custom fallback", () => {
      expect(safeRedirect("/safe", "/login")).toBe("/safe")
    })
  })

  describe("boundary cases", () => {
    it("accepts / alone", () => {
      expect(safeRedirect("/")).toBe("/")
    })
    it("rejects single backslash alone (treated as non-relative)", () => {
      expect(safeRedirect("\\evil")).toBe("/")
    })
    it("rejects empty-after-prefix inputs", () => {
      // "/" is valid; "//" is the protocol-relative bypass
      expect(safeRedirect("//")).toBe("/")
      expect(safeRedirect("/\\")).toBe("/")
    })
  })
})