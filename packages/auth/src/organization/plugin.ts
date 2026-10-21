import { APIError } from "better-auth/api"
import { organization } from "better-auth/plugins"
import { serverEnv } from "@workspace/env/server"
import { assertOrganizationName, assertOrganizationSlug } from "./policy.js"
import { sendInvitationEmail } from "./invitation.js"

/**
 * Resolve and validate the `requireEmailVerificationOnInvitation`
 * value at module load. The schema applies the default ("true")
 * when the env var is absent, so this is never undefined. The
 * guard refuses to start the process when the value is "false" AND
 * `NODE_ENV === "production"`, with no exception clause — the
 * contract is "production is true", full stop. There is no opt-in
 * variable: any value other than the literal strings "true" and
 * "false" is rejected.
 *
 * Exported as a function (rather than evaluated at module load) so
 * tests can exercise each branch without having to reload the
 * module. The plugin still calls it eagerly at module load.
 */
export function resolveRequireEmailVerification(
  raw: string,
  nodeEnv: string | undefined,
): boolean {
  if (raw !== "true" && raw !== "false") {
    // Defense in depth: the schema should have already caught this.
    throw new Error(
      `[auth] REQUIRE_EMAIL_VERIFICATION_ON_INVITATION must be "true" or "false" (got ${JSON.stringify(raw)}). Refusing to start.`,
    )
  }
  if (raw === "false" && nodeEnv === "production") {
    throw new Error(
      `[auth] REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false is not allowed in production. ` +
        `This is a test-only override. Refusing to start.`,
    )
  }
  return raw === "true"
}

const requireEmailVerificationOnInvitation = resolveRequireEmailVerification(
  serverEnv.REQUIRE_EMAIL_VERIFICATION_ON_INVITATION,
  process.env.NODE_ENV,
)

/**
 * The `beforeCreateOrganization` hook, exported for direct unit
 * testing. The plugin wires this same function into the
 * `organizationHooks` block.
 *
 * The hook operates on the **raw** `input.name` — it does not trim
 * before validation, and it does not mutate the value in place.
 * On success, it returns `{ data: { name: input.name } }` so the
 * persisted record carries the validated name. The override is a
 * no-op: the helper has already established that
 * `input.name === input.name.trim()` and that `input.name` contains
 * no control characters, so the value we return is identical to
 * what was passed in.
 */
export const beforeCreateOrganizationHook = async ({
  organization: input,
  user,
}: {
  organization: { name?: string; slug?: string; metadata?: unknown }
  user: { emailVerified?: boolean }
}) => {
  if (typeof input.name !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid organization name",
    })
  }
  if (typeof input.slug !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid organization slug",
    })
  }
  assertOrganizationName(input.name)
  assertOrganizationSlug(input.slug)
  if (user.emailVerified !== true) {
    throw new APIError("FORBIDDEN", {
      message: "Email verification is required",
    })
  }
  if (input.metadata != null) {
    throw new APIError("BAD_REQUEST", {
      message: "Organization metadata is not editable",
    })
  }
  return { data: { name: input.name } }
}

/**
 * Build the organization plugin.
 *
 * Exported as a factory so the invitation-contract probe can hold
 * every option at its shipped value except the one under test. A
 * probe that rebuilt the option list by hand would drift from
 * production the first time an option was added here, and the whole
 * point of the probe is that it measures what ships.
 */
export function createOrganizationPlugin(
  overrides: {
    requireEmailVerificationOnInvitation?: boolean
  } = {},
) {
  return organization({
    allowUserToCreateOrganization: (user) => user.emailVerified === true,
    creatorRole: "owner",
    requireEmailVerificationOnInvitation,
    invitationExpiresIn: 60 * 60 * 48,
    disableOrganizationDeletion: false,
    organizationHooks: {
      beforeCreateOrganization: beforeCreateOrganizationHook,
    },
    // The invitation delivery callback. `sendInvitationEmail` is
    // the Better Auth callback: it awaits the transport and is the
    // single point of structured logging.
    sendInvitationEmail,
    ...overrides,
  })
}

/**
 * Better Auth `organization` plugin configuration.
 *
 * The `beforeCreateOrganization` hook is wired to:
 * - reject malformed or reserved slugs via `assertOrganizationSlug`,
 * - reject malformed or untrimmed names via `assertOrganizationName`,
 * - reject unverified accounts (the hook runs after Better Auth's
 *   own `allowUserToCreateOrganization` gate; the explicit check is
 *   belt and suspenders and produces a clearer error).
 *
 * The other native hooks (delete, remove-member, update-role,
 * update-organization) are left to Better Auth's defaults.
 */
export const organizationPlugin = createOrganizationPlugin()

