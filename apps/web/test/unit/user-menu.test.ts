/**
 * Pure-helper unit tests for `apps/web/src/components/headers/user-menu.tsx`.
 *
 * The component itself is exercised end-to-end by the Playwright
 * suite at `tests/e2e/header-auth.spec.ts`. This file pins the
 * deterministic helpers (initials + avatar URL) so a future
 * contributor who edits them gets immediate feedback without a
 * browser roundtrip.
 *
 * The `appUrl` helper depends on `clientEnv.NEXT_PUBLIC_APP_URL`
 * which is only resolvable at the bundler level. It is exercised
 * by the e2e suite, not here — adding a vitest setup file to
 * pull `@workspace/env` would drag `@workspace/database →
 * postgres` into the unit-test graph (the same concern the
 * vitest.config.ts:34-36 comment calls out for the fetch
 * wrapper).
 */
import { describe, expect, it } from "vitest"

import { getAvatarUrl, getInitials } from "../../src/components/headers/user-menu-helpers.js"

describe("getInitials", () => {
	it("returns '?' for empty or null input", () => {
		expect(getInitials("")).toBe("?")
		expect(getInitials("   ")).toBe("?")
		expect(getInitials(null)).toBe("?")
		expect(getInitials(undefined)).toBe("?")
	})

	it("takes the first two characters when there is one word", () => {
		expect(getInitials("Alice")).toBe("AL")
		expect(getInitials("a")).toBe("A")
	})

	it("takes first letter of first and last word for multi-word names", () => {
		expect(getInitials("Alice Martin")).toBe("AM")
		expect(getInitials("  Alice   Martin  ")).toBe("AM")
		expect(getInitials("Jean-Pierre Dupont")).toBe("JD")
	})
})

describe("getAvatarUrl", () => {
	it("returns the explicit image when present", () => {
		expect(getAvatarUrl("alice@example.com", "https://example.com/me.png")).toBe(
			"https://example.com/me.png",
		)
	})

	it("falls back to the Vercel avatar endpoint otherwise", () => {
		const url = getAvatarUrl("alice@example.com", null)
		expect(url).toContain("vercel.com/api/www/avatar")
		expect(url).toContain("alice%40example.com")
	})

	it("falls back when image is the empty string (treated as falsy)", () => {
		const url = getAvatarUrl("bob@example.com", "")
		expect(url).toContain("vercel.com/api/www/avatar")
	})
})
