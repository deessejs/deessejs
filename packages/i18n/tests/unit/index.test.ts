/**
 * Pin the typed accessors exposed by `@workspace/i18n` (ADR-031 Decision #9).
 *
 * These helpers are the typed accessor layer over `@workspace/env`'s
 * raw CSV strings. The tests verify the runtime parsing, the type
 * narrowing, and the BCP-47 / OpenGraph mappings.
 */
import { describe, expect, it, vi } from "vitest"

// The index module transitively imports `./routing.js` which calls
// `defineRouting` from `next-intl`. That function pulls in
// `next-intl/navigation`, which transitively requires
// `next/navigation` — a module Vitest 4 cannot resolve on Windows
// (`next\navigation` vs `next/navigation.js`). Mocking both next-intl
// subpaths at the module boundary short-circuits the chain; the
// accessors under test (locales, defaultLocale, openGraphLocale, ...)
// live in `_locales.ts` and don't touch next-intl.
vi.mock("next-intl", () => ({
  defineRouting: () => ({}),
}))
vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({}),
}))

const {
  availableLanguageLabel,
  defaultLocale,
  isSupportedLocale,
  LOCALE_LABELS,
  locales,
  openGraphLocale,
} = await import("../../src/index.js")

describe("typed accessors (ADR-031)", () => {
  describe("locales()", () => {
    it("returns the V1 locale list", () => {
      expect(locales()).toEqual(["en", "fr"])
    })
  })

  describe("defaultLocale()", () => {
    it("returns 'en'", () => {
      expect(defaultLocale()).toBe("en")
    })
  })

  describe("isSupportedLocale()", () => {
    it("accepts a supported locale", () => {
      expect(isSupportedLocale("en")).toBe(true)
      expect(isSupportedLocale("fr")).toBe(true)
    })

    it("rejects an unknown locale", () => {
      expect(isSupportedLocale("xx")).toBe(false)
      expect(isSupportedLocale("")).toBe(false)
    })
  })

  describe("openGraphLocale()", () => {
    it("maps 'en' to 'en_US'", () => {
      expect(openGraphLocale("en")).toBe("en_US")
    })

    it("maps 'fr' to 'fr_FR'", () => {
      expect(openGraphLocale("fr")).toBe("fr_FR")
    })
  })

  describe("availableLanguageLabel()", () => {
    it("returns 'English' for 'en'", () => {
      expect(availableLanguageLabel("en")).toBe("English")
    })

    it("returns 'Français' for 'fr'", () => {
      expect(availableLanguageLabel("fr")).toBe("Français")
    })
  })

  describe("LOCALE_LABELS", () => {
    it("exposes the in-own-language label", () => {
      expect(LOCALE_LABELS.en).toBe("English")
      expect(LOCALE_LABELS.fr).toBe("Français")
    })
  })
})
