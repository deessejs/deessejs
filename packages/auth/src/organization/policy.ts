import { APIError } from "better-auth/api"

/**
 * Organization policy helpers.
 *
 * In PR-1 of Organizations V1 (epic #223):
 * - `assertOrganizationSlug` is real and rejects malformed or reserved
 *   slugs with `APIError('BAD_REQUEST', { code: 'invalid_slug' })`.
 * - The four other helpers are stubs that throw
 *   `APIError('CONFLICT', { code: 'not_implemented' })` and are
 *   filled in by PR-2 (policy + onboarding service).
 *
 * The module is reachable from Better Auth's runtime and does
 * **not** import `server-only`; PR-2 keeps it that way so the
 * helpers can be unit-tested in isolation.
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
// single-character slugs are rejected. The full RFC §6 reserved-name
// and collision-suffix logic lands in PR-2.
const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/

function notImplemented(name: string): never {
  throw new APIError("CONFLICT", {
    code: "not_implemented",
    message: `${name} is not implemented in this increment; ships in a later PR.`,
  })
}

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

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function prepareOrganizationCreation(_input: {
  userId: string
  name: string
  slug: string
}): Promise<{ bootstrapOperationId: string } | undefined> {
  notImplemented("prepareOrganizationCreation")
}

export async function assertOrganizationIsDeletable(
  _orgId: string,
): Promise<void> {
  notImplemented("assertOrganizationIsDeletable")
}

export async function assertDefaultOwnerMembershipIsRetained(
  _member: { userId: string; organizationId: string; role: string },
): Promise<void> {
  notImplemented("assertDefaultOwnerMembershipIsRetained")
}

export async function assertDefaultOwnerRoleIsRetained(
  _member: { userId: string; organizationId: string; role: string },
  _newRole: string,
): Promise<void> {
  notImplemented("assertDefaultOwnerRoleIsRetained")
}
/* eslint-enable @typescript-eslint/no-unused-vars */
