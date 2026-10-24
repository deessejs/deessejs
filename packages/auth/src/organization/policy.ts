import { APIError } from "better-auth/api"

/**
 * Organization policy helpers.
 *
 * Only `assertOrganizationSlug` is exposed. It rejects malformed or
 * reserved slugs with `APIError('BAD_REQUEST', { code: 'invalid_slug' })`.
 * The reserved set covers the application's top-level route segments
 * (so an organization can never shadow `/account`, `/admin`, etc.)
 * and a few product-level namespaces reserved by templates.
 *
 * The module is reachable from Better Auth's runtime and does
 * **not** import `server-only`, so it can be unit-tested in isolation.
 */

const RESERVED_SLUGS = new Set<string>([
  // Top-level application segments
  "account",
  "admin",
  "onboarding",
  "accept-invitation",
  "api",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "verify-email",
  "device",
  // Reserved by product / templates
  "deessejs",
  "nesalia",
])

// 2–38 lowercase ASCII characters, must start and end with a letter
// or digit. The trailing character class is **not** optional, so
// single-character slugs are rejected.
const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/

export function assertOrganizationSlug(slug: string): void {
  if (typeof slug !== "string" || !SLUG_FORMAT.test(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message:
        "Organization slug must be 2–38 lowercase ASCII characters (letters, digits, hyphens), starting and ending with a letter or digit.",
    })
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_slug",
      message: `Organization slug "${slug}" is reserved.`,
    })
  }
}

/**
 * Validate an organization name. The function is **validate-only**:
 * it never mutates its argument. Surrounding whitespace and control
 * characters are rejected; the original string is not modified.
 * The trim-and-retry responsibility belongs to the caller (the
 * Server Action in a downstream PR, not the hook in `plugin.ts`,
 * which is a defensive boundary and intentionally does not trim).
 *
 * Length is measured in code points, not UTF-16 code units, so
 * 100 emoji are within the limit (each emoji is one code point even
 * though `String#length` would count it as two).
 */
export function assertOrganizationName(name: unknown): asserts name is string {
  if (typeof name !== "string") {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must be a string",
    })
  }
  // 1. Reject control characters on the original string. C0
  //    (U+0000–U+001F), DEL (U+007F), C1 (U+0080–U+009F). `for…of`
  //    iterates code points so surrogate pairs are handled correctly.
  for (const ch of name) {
    const cp = ch.codePointAt(0)!
    if (
      (cp >= 0x00 && cp <= 0x1f) ||
      cp === 0x7f ||
      (cp >= 0x80 && cp <= 0x9f)
    ) {
      throw new APIError("BAD_REQUEST", {
        code: "invalid_name",
        message: "Organization name contains control characters",
      })
    }
  }
  // 2. Reject leading/trailing whitespace. The function does not
  //    trim; it rejects and lets the caller decide.
  if (name !== name.trim()) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must not have leading or trailing whitespace",
    })
  }
  // 3. Length measured in code points. `String#length` counts
  //    UTF-16 code units, which would miscount astral characters
  //    (emoji, CJK extensions B–G) as two. The spread operator
  //    iterates code points.
  const codePoints = [...name]
  if (codePoints.length === 0 || codePoints.length > 100) {
    throw new APIError("BAD_REQUEST", {
      code: "invalid_name",
      message: "Organization name must be 1–100 code points",
    })
  }
}
