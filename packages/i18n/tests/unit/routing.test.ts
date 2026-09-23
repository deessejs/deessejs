/**
 * Pin the contract of the routing shape (ADR-031 Decision #9).
 *
 * The router and middleware in `apps/web` and `apps/app` consume
 * `routing` directly via `createMiddleware(routing)`. A future
 * contributor who silently widens the locale list (e.g. by editing
 * the env schema without locking the routing) would break the
 * per-app `(unprefixed)` URL assumptions. This test catches the
 * regression at PR time.
 */
import { describe, expect, it } from "vitest"

import { routing } from "../../src/routing.js"

describe("routing shape (ADR-031)", () => {
  it("locks locales to ['en', 'fr']", () => {
    expect(routing.locales).toEqual(["en", "fr"])
  })

  it("locks defaultLocale to 'en'", () => {
    expect(routing.defaultLocale).toBe("en")
  })

  it("locks localePrefix to 'as-needed'", () => {
    expect(routing.localePrefix).toBe("as-needed")
  })

  it("locks localeDetection to true", () => {
    expect(routing.localeDetection).toBe(true)
  })
})
