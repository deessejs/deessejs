/**
 * Pin the package's `exports` map (ADR-031 Decision #9, §"Strict
 * client/server separation via the `exports` map").
 *
 * The map declares six subpaths. A future contributor who removes
 * a subpath (e.g. by accident during a refactor) breaks the apps
 * silently: the import resolves to the package root instead of the
 * targeted file, and the failure surfaces at runtime. This test
 * pins each subpath to its expected entry so the breakage shows up
 * at PR time.
 *
 * `next-intl/navigation` is mocked at the package level because
 * Vitest 4 on Windows does not always resolve the bare `next/navigation`
 * specifier that next-intl internally imports. Mocking the public
 * surface (`next-intl/navigation`) covers both the createNavigation
 * barrel and its inner next/navigation transitive import.
 */
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: () => null,
    redirect: vi.fn(),
    usePathname: () => "/",
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    getPathname: () => "/",
  }),
}))

describe("package subpath exports (ADR-031)", () => {
  it("exposes the universal entry point", async () => {
    const mod = await import("../../src/index.js")
    expect(typeof mod.locales).toBe("function")
    expect(typeof mod.defaultLocale).toBe("function")
    expect(typeof mod.isSupportedLocale).toBe("function")
    expect(typeof mod.openGraphLocale).toBe("function")
    expect(typeof mod.availableLanguageLabel).toBe("function")
    expect(typeof mod.routing).toBe("object")
  })

  it("exposes the routing subpath", async () => {
    const mod = await import("../../src/routing.js")
    expect(mod.routing.locales).toEqual(["en", "fr"])
    expect(mod.routing.defaultLocale).toBe("en")
    expect(mod.routing.localePrefix).toBe("as-needed")
    expect(mod.routing.localeDetection).toBe(true)
  })

  it("exposes the navigation subpath", async () => {
    const mod = await import("../../src/navigation.js")
    expect(typeof mod.Link).toBe("function")
    expect(typeof mod.useRouter).toBe("function")
    expect(typeof mod.usePathname).toBe("function")
    expect(typeof mod.redirect).toBe("function")
  })

  it("exposes the shared subpath", async () => {
    const mod = await import("../../src/shared/index.js")
    expect(typeof mod.sharedMessages).toBe("object")
    expect(mod.sharedMessages.en.Common.Cancel).toBe("Cancel")
    expect(mod.sharedMessages.fr.Common.Cancel).toBe("Annuler")
  })

  it("exposes the switcher subpath (Client Component)", async () => {
    const mod = await import("../../src/locale-switcher.js")
    expect(typeof mod.LocaleSwitcher).toBe("function")
  })
})
