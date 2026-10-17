import { APIError } from "better-auth/api"
import { organization } from "better-auth/plugins"
import { sendOrganizationInvitation } from "./invitation.js"
import {
  assertDefaultOwnerMembershipIsRetained,
  assertDefaultOwnerRoleIsRetained,
  assertOrganizationIsDeletable,
  assertOrganizationSlug,
  prepareOrganizationCreation,
} from "./policy.js"

/**
 * Better Auth `organization` plugin configuration.
 *
 * All organization-specific wiring lives here so the top-level
 * `auth.ts` only references `organizationPlugin` as a one-liner
 * entry in the plugin array.
 *
 * The `bootstrapOperationId` additional field is server-owned
 * end-to-end:
 *
 * - `input: false` prevents the create route's
 *   `toZodSchema({ isClientSide: true })` from accepting a
 *   caller-supplied value.
 * - `returned: false` prevents the adapter from including the stored
 *   value in response bodies via `filterOutputFields`.
 *
 * `input: false` alone is not sufficient: the default `returned: true`
 * would expose the server-owned marker to the client.
 */
export const organizationPlugin = organization({
  allowUserToCreateOrganization: (user) => user.emailVerified === true,
  creatorRole: "owner",
  requireEmailVerificationOnInvitation: true,
  invitationExpiresIn: 60 * 60 * 48,
  disableOrganizationDeletion: false,
  schema: {
    organization: {
      additionalFields: {
        bootstrapOperationId: {
          type: "string",
          required: false,
          unique: true,
          input: false,
          returned: false,
        },
      },
    },
  },
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
      const bootstrapData = await prepareOrganizationCreation({
        userId: user.id,
        name: input.name,
        slug: input.slug,
      })
      if (input.metadata != null) {
        throw new APIError("BAD_REQUEST", {
          message: "Organization metadata is not editable",
        })
      }
      return { data: { ...input, ...(bootstrapData ?? {}) } }
    },
    beforeDeleteOrganization: async ({ organization: target }) => {
      await assertOrganizationIsDeletable(target.id)
    },
    beforeRemoveMember: async ({ member }) => {
      await assertDefaultOwnerMembershipIsRetained({
        userId: member.userId,
        organizationId: member.organizationId,
        role: member.role,
      })
    },
    beforeUpdateMemberRole: async ({ member, newRole }) => {
      await assertDefaultOwnerRoleIsRetained(
        {
          userId: member.userId,
          organizationId: member.organizationId,
          role: member.role,
        },
        newRole,
      )
    },
    beforeUpdateOrganization: async ({ organization: updates }) => {
      if (updates.slug !== undefined) {
        throw new APIError("BAD_REQUEST", {
          message: "Organization slugs cannot be changed",
        })
      }
      if (updates.metadata !== undefined) {
        throw new APIError("BAD_REQUEST", {
          message: "Organization metadata is not editable",
        })
      }
      if ("bootstrapOperationId" in updates) {
        throw new APIError("BAD_REQUEST", {
          message: "Provisioning provenance cannot be changed",
        })
      }
    },
  },
  sendInvitationEmail: async (data) => {
    await sendOrganizationInvitation(data)
  },
})
