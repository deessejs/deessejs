import { APIError } from "better-auth/api"
import { organization } from "better-auth/plugins"
import { assertOrganizationSlug } from "./policy.js"

/**
 * Better Auth `organization` plugin configuration.
 *
 * Only the `beforeCreateOrganization` hook is wired, and it does
 * two things:
 * - rejects malformed or reserved slugs via `assertOrganizationSlug`,
 * - rejects unverified accounts (Better Auth's own
 *   `allowUserToCreateOrganization` already enforces this, but the
 *   hook runs after that gate; the explicit check is belt and
 *   suspenders and produces a clearer error).
 *
 * The other native hooks (delete, remove-member, update-role,
 * update-organization) are left to Better Auth's defaults — the
 * plugin's built-in access rules and the user.role field are
 * sufficient. The application has no DeesseJS-specific invariant
 * on top of the plugin (no "first organization is permanent",
 * no "last owner cannot leave") in this iteration.
 */
export const organizationPlugin = organization({
  allowUserToCreateOrganization: (user) => user.emailVerified === true,
  creatorRole: "owner",
  requireEmailVerificationOnInvitation: true,
  invitationExpiresIn: 60 * 60 * 48,
  disableOrganizationDeletion: false,
  organizationHooks: {
    beforeCreateOrganization: async ({ organization: input, user }) => {
      // The Better Auth hook type marks `name` and `slug` optional
      // even though the native create endpoint parses both as
      // required strings. Narrow before passing to the helper.
      if (typeof input.name !== "string" || typeof input.slug !== "string") {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid organization name or slug",
        })
      }
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
    },
  },
  // The plugin's sendInvitationEmail callback is mandatory in the
  // type. We leave it as a no-op for this iteration: invitation
  // delivery is wired in a downstream change that owns the
  // APP_URL origin validation and the React Email template.
  sendInvitationEmail: async () => {
    // no-op: invitation email delivery is owned by a separate
    // iteration (APP_URL validation + React Email template).
  },
})
