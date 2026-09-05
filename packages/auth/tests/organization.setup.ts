/**
 * Test bootstrap for the organization plugin (ADR-030).
 *
 * Mirrors the production shape of packages/auth/src/auth.ts but
 * drops the device-authorization, bearer, and email plugins — those
 * have their own setup paths and we don't need them for the org
 * flow. The drizzle adapter, schema, and baseURL are kept identical
 * to setup.ts so the org-plugin tables get exercised against the
 * real pg instance.
 */
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { testUtils } from "better-auth/plugins"
import { organization } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"
import { ac, admin, member, owner } from "../src/access.js"

const pool = postgres(serverEnv.TEST_DATABASE_URL, { max: 1 })
const db = drizzle(pool)

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
		requireEmailVerification: false,
	},
	plugins: [
		organization({
			ac,
			roles: { owner, admin, member },
			allowUserToCreateOrganization: true,
			organizationLimit: 10,
			creatorRole: "owner",
			membershipLimit: 100,
			invitationExpiresIn: 60 * 60 * 48,
			invitationLimit: 100,
			requireEmailVerificationOnInvitation: false,
		}),
		testUtils(),
	],
})

export type OrgTestHelpers = Awaited<ReturnType<typeof auth.$context>>["test"]
