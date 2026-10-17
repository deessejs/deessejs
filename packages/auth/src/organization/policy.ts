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
