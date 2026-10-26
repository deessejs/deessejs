import { organization } from "better-auth/plugins"
import { serverEnv } from "@workspace/env/server"
import { sendInvitationEmail } from "./invitation.js"
import {
  beforeCreateOrganizationWithMarker,
  beforeUpdateOrganizationProtectingMarker,
} from "./provisioning.js"

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
      beforeCreateOrganization: beforeCreateOrganizationWithMarker,
      beforeUpdateOrganization: beforeUpdateOrganizationProtectingMarker,
    },
    // The invitation delivery callback. `sendInvitationEmail` is the
    // Better Auth callback: it awaits the transport and is the
    // single point of structured logging.
    sendInvitationEmail,
    ...overrides,
  })
}

/**
 * Better Auth `organization` plugin configuration.
 *
 * The `beforeCreateOrganization` hook validates the creation and
 * stores the marker that proves which attempt made the organization.
 * The `beforeUpdateOrganization` hook protects that marker from the
 * update endpoint, which accepts a metadata of its own.
 *
 * The other native hooks (delete, remove-member, update-role) are
 * left to Better Auth's defaults.
 */
export const organizationPlugin = createOrganizationPlugin()
