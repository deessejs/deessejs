import { APIError } from "better-auth/api"

/**
 * Organization policy helpers — partial implementation for PR-1.
 *
 * Five helpers in scope. The contract is:
 *
 * - `assertOrganizationSlug` is **real** in PR-1. It enforces the
 *   slug format and the top-level reservation list. Throws
 *   `BAD_REQUEST` / `invalid_slug` on rejection.
 *
 * - The other four (`prepareOrganizationCreation`,
 *   `assertOrganizationIsDeletable`,
 *   `assertDefaultOwnerMembershipIsRetained`,
 *   `assertDefaultOwnerRoleIsRetained`) are **stubs** that throw
 *   `CONFLICT` / `not_implemented`. They are wired in PR-2; the
 *   smoke test in PR-1 asserts the typed 409 they raise.
 *
 * The module is reachable from Better Auth's runtime and does
 * **not** import `server-only`. The downstream PR-2 keeps it that
 * way so the helpers can be unit-tested in isolation.
 *
 * The `not_implemented` error is **not** the eventual user-facing
 * error — it is the contract between PR-1 and PR-2. PR-8 turns the
 * smoke checklist into committed integration tests; the assertion
 * on the error code locks the contract.
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

// 2–38 lowercase ASCII characters, must start and end with a letter or
// digit. The trailing character class is **not** optional, so single-
// character slugs are rejected. The full RFC §6 reserved-name and
// collision-suffix logic lands in PR-2.
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

export async function prepareOrganizationCreation(_input: {
  userId: string
  name: string
  slug: string
}): Promise<{ bootstrapOperationId: string } | undefined> {
  // PR-2 contract:
  // - return `undefined` when the account already has a completed
  //   default (this is ordinary additional creation)
  // - throw `CONFLICT` / `onboarding_required` when there is no
  //   default and no active provisioning operation
  // - return `{ bootstrapOperationId }` when the persisted
  //   provisioning row matches the input
  // PR-1 ships the stub; the function never returns.
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
