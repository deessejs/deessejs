/**
 * Auth test utilities
 *
 * Provides test auth instance with the `organization()` plugin
 * installed (so the same hooks the production code exercises
 * fire in tests) and the `testUtils` plugin (so tests can mint
 * users without going through the email-verification flow).
 *
 * Tests that exercise the durable provisioning protocol import
 * the helpers from `@workspace/auth/organization-policy`
 * directly. The plugin is configured with the same
 * `organizationHooks` block as production so a test that
 * deletes a default org actually goes through the same
 * `beforeDeleteOrganization` guard as the live system.
 */
import { betterAuth } from "better-auth"
import { APIError } from "better-auth/api"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { organization, testUtils } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"
import {
	assertDefaultOwnerMembershipIsRetained,
	assertDefaultOwnerRoleIsRetained,
	assertOrganizationIsDeletable,
	prepareOrganizationCreation,
} from "../src/organization-policy.js"

// Test database connection. The test env var is optional;
// when absent, the suite is gated by `process.env.TEST_DATABASE_URL`
// (see the top of `organization-invariants.test.ts`).
const testDbUrl = serverEnv.TEST_DATABASE_URL ?? ""
const pool = postgres(testDbUrl, { max: 1 })
const db = drizzle(pool)

const RESERVED_ORGANIZATION_SLUGS = new Set([
	"deessejs",
	"nesalia",
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
	"settings",
	"home",
])

const ORGANIZATION_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validateOrganizationSlug(value: unknown): void {
	if (
		typeof value !== "string" ||
		value.length < 2 ||
		value.length > 48 ||
		!ORGANIZATION_SLUG.test(value) ||
		RESERVED_ORGANIZATION_SLUGS.has(value)
	) {
		throw new APIError("BAD_REQUEST", {
			message: "Invalid or reserved organization slug",
		})
	}
}

// Test auth instance: organization plugin + testUtils. The
// organizationHooks mirror the production wiring so the same
// invariants (deletable check, multi-role owner retention,
// slug policy, marker claim) are exercised end-to-end.
export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "deessejs.com",
      "*.deessejs.com",
      "*.vercel.app",
      "localhost:*",
    ],
    protocol: "http",
    fallback: "http://localhost:3000",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        react: templates.ResetPassword({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "reset-password" }],
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        react: templates.VerifyEmail({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "verify-email" }],
      })
    },
  },
  plugins: [
    testUtils(),
    organization({
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
              input: false,
            },
          },
        },
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization: input, user }) => {
          validateOrganizationSlug(input.slug)
          const bootstrapData = await prepareOrganizationCreation(user.id)
          if (input.metadata != null) {
            throw new APIError("BAD_REQUEST", {
              message: "Organization metadata is not editable",
            })
          }
          return { data: { ...input, ...bootstrapData } }
        },
        beforeDeleteOrganization: async ({ organization: target }) => {
          await assertOrganizationIsDeletable(target.id)
        },
        beforeRemoveMember: async ({ member }) => {
          await assertDefaultOwnerMembershipIsRetained(member)
        },
        beforeUpdateMemberRole: async ({ member, newRole }) => {
          await assertDefaultOwnerRoleIsRetained(member, newRole)
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
        },
      },
    }),
  ],
})

// Export types. The `test` namespace hangs off the auth
// instance's $context (a Promise<PluginContext>). Awaiting
// the context gives us the test plugin's helpers
// (`createUser`, `verifyEmails`, etc.) that the
// organization-invariant tests use to mint verified users
// without going through the email-verification flow.
export type TestHelpers = NonNullable<
	Awaited<typeof auth.$context>["test"]
>
// Suppress unused warning: `assertDefaultOwnerMembershipIsRetained`
// is invoked through the plugin hook above.
void assertDefaultOwnerMembershipIsRetained
