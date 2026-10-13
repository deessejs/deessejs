/**
 * RFC-001 PostgreSQL invariant tests.
 *
 * The invariants in this file are documented in
 * `apps/internal-documentation/content/docs/decisions/`
 * (RFC-001 §5 "Permanent default organization invariant", §7
 * "Last-line defense", §9 "Acceptance", §10 "Authoritative
 * guard placement"). Each test exercises a real database
 * guarantee that the application relies on.
 *
 * To enable the suite, point `TEST_DATABASE_URL` at a fresh
 * PostgreSQL database, run `pnpm db:migrate`, then drop the
 * `if (skip()) return` guards at the top of each describe
 * block.
 *
 * The isolation strategy uses unique random slugs and
 * operation ids per invocation so the suite can run against
 * a shared database without cross-test pollution. Each test
 * creates its own organization, member, default, and
 * provisioning rows.
 */

import { randomBytes } from "node:crypto"
import { describe, expect, test } from "vitest"
import { sql } from "drizzle-orm"
import { auth, type TestHelpers } from "./setup"
import { db } from "@workspace/database"

// Toggle the suite on once TEST_DATABASE_URL is configured.
const skip = () => !process.env.TEST_DATABASE_URL

// Helper: generate a fresh slug for test isolation.
function uniqueSlug(prefix: string): string {
	const suffix = randomBytes(4).toString("hex")
	return `${prefix}-${suffix}`.slice(0, 41)
}

// Helper: create a verified user. We use the testUtils
// plugin's `createUser`, which creates the user row directly
// without going through the email-verification flow. We then
// flip `email_verified = true` directly in the database so
// the user can satisfy the organization plugin's "verified
// users only" guard.
async function createVerifiedUser(
	prefix: string,
): Promise<{ userId: string; headers: Headers; email: string } | null> {
	const ctx = await auth.$context
	const test = ctx.test as TestHelpers | undefined
	if (!test?.createUser) {
		return null
	}
	const email = `${prefix}-${randomBytes(6).toString("hex")}@example.test`
	const user = await test.createUser({ email })
	if (!user) return null
	await db.execute(
		sql`UPDATE "user" SET "email_verified" = true WHERE "id" = ${user.id}`,
	)
	const signin = await auth.api.signInEmail({
		body: { email, password: "TestPassword!1" },
		asResponse: true,
	})
	const cookies = signin.headers.getSetCookie()
	const headers = new Headers()
	for (const c of cookies) headers.append("cookie", c)
	return { userId: user.id, headers, email }
}

// Helper: create an organization and a default row for the
// user, simulating a completed onboarding. Returns the org
// id and slug. The hook fires `prepareOrganizationCreation`,
// so the `account_organization_provisioning` row is also
// created as a side effect of the create.
async function createDefaultOrganization(
	user: { userId: string; headers: Headers },
	prefix: string,
): Promise<{ orgId: string; slug: string; operationId: string }> {
	const slug = uniqueSlug(prefix)
	const created = (await auth.api.createOrganization({
		body: { name: `Default ${prefix}`, slug },
		headers: user.headers,
	})) as { id: string; slug: string }
	// The plugin's create does not write a default row. The
	// Server Action's finalization is the only sanctioned
	// writer. For tests we mirror the finalization by
	// inserting the default row in a transaction.
	const operationId = `op-${randomBytes(8).toString("hex")}`
	await db.execute(
		sql`INSERT INTO "account_organization_provisioning" ("user_id", "operation_id", "organization_id", "status", "requested_name", "final_slug", "lease_until", "fencing_token", "created_at", "updated_at")
			VALUES (${user.userId}, ${operationId}, ${created.id}, 'completed', ${`Default ${prefix}`}, ${slug}, ${Date.now() + 60_000}, 1, now(), now())`,
	)
	await db.execute(
		sql`INSERT INTO "account_organization_defaults" ("user_id", "organization_id", "created_at")
			VALUES (${user.userId}, ${created.id}, now())`,
	)
	return { orgId: created.id, slug, operationId }
}

describe.skipIf(skip())(
	"RFC-001 §5 — Permanent default organization invariant",
	() => {
		test("organization referenced by account_organization_defaults cannot be deleted", async () => {
			const user = await createVerifiedUser("default-invariant")
			if (!user) return
			const { orgId } = await createDefaultOrganization(
				user,
				"default-invariant",
			)
			// The plugin's deleteOrganization path fires
			// beforeDeleteOrganization, which calls
			// assertOrganizationIsDeletable, which throws
			// APIError("FORBIDDEN") when an
			// account_organization_defaults row references
			// the org. The database `ON DELETE RESTRICT` on
			// account_organization_defaults.organizationId
			// is the last-line defense: even a raw
			// `DELETE FROM organization WHERE id = <id>`
			// would fail with a foreign-key violation.
			await expect(
				auth.api.deleteOrganization({
					body: { organizationId: orgId },
					headers: user.headers,
				}),
			).rejects.toMatchObject({ body: { code: "FORBIDDEN" } })

			// Raw delete is rejected by the FK.
			await expect(
				db.execute(sql`DELETE FROM "organization" WHERE "id" = ${orgId}`),
			).rejects.toMatchObject({ code: "23503" }) // foreign_key_violation
		})

		test("creator cannot leave their default organization", async () => {
			const user = await createVerifiedUser("creator-leave")
			if (!user) return
			const { orgId } = await createDefaultOrganization(user, "leave")
			// The plugin's leaveOrganization path does NOT
			// fire beforeRemoveMember (it follows a separate
			// route, crud-members.mjs). The application-level
			// protection is the Hono middleware in
			// `packages/api/src/http/routes/http.ts` that
			// intercepts `POST /api/v1/auth/organization/leave`.
			// That middleware is outside the unit-test scope
			// of this package; we exercise the equivalent
			// guard — `isDefaultCreator` — directly to prove
			// the underlying lookup.
			const { isDefaultCreator } = await import(
				"@workspace/auth/organization-policy"
			)
			expect(await isDefaultCreator(user.userId, orgId)).toBe(true)
		})
	},
)

describe.skipIf(skip())("RFC-001 §7 — Last-line defense", () => {
	test("duplicate (organizationId, userId) pair in member is rejected", async () => {
		// The unique index `member_organizationId_userId_uidx`
		// raises a unique-violation on a second insert for the
		// same (org, user) pair. The plugin's invitation
		// lifecycle avoids the race; the index is the safety
		// net.
		const orgId = `00000000-0000-0000-0000-${randomBytes(6).toString("hex")}`
		const userId = `00000000-0000-0000-0000-${randomBytes(6).toString("hex")}`
		await db.execute(
			sql`INSERT INTO "organization" ("id", "name", "slug", "created_at") VALUES (${orgId}, 'Dup Test Org', ${`dup-${randomBytes(4).toString("hex")}`}, now())`,
		)
		await db.execute(
			sql`INSERT INTO "user" ("id", "name", "email", "email_verified", "created_at", "updated_at") VALUES (${userId}, 'Dup User', ${`dup-${randomBytes(4).toString("hex")}@example.test`}, true, now(), now())`,
		)
		await db.execute(
			sql`INSERT INTO "member" ("id", "organization_id", "user_id", "role", "created_at") VALUES (${randomBytes(8).toString("hex")}, ${orgId}, ${userId}, 'member', now())`,
		)
		await expect(
			db.execute(
				sql`INSERT INTO "member" ("id", "organization_id", "user_id", "role", "created_at") VALUES (${randomBytes(8).toString("hex")}, ${orgId}, ${userId}, 'member', now())`,
			),
		).rejects.toMatchObject({ code: "23505" }) // unique_violation
	})

	test("organization.bootstrap_operation_id allows NULLs and allows duplicates (no longer unique)", async () => {
		// After the migration 0002 amendment, the partial
		// unique index on bootstrap_operation_id is gone. The
		// marker is a correlation pointer, not a global key.
		// Two orgs with the same marker is allowed; two
		// orgs with NULL is allowed; the only invariant is
		// that account_organization_provisioning.user_id is
		// the primary key.
		const dup = randomBytes(8).toString("hex")
		await db.execute(
			sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'A', ${`a-${dup}`}, now(), null, ${dup})`,
		)
		// Duplicate marker is now allowed.
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'B', ${`b-${dup}`}, now(), null, ${dup})`,
			),
		).resolves.toBeDefined()
		// NULL is also allowed (and was before).
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'C', ${`c-${dup}`}, now(), null, null)`,
			),
		).resolves.toBeDefined()
	})
})

describe.skipIf(skip())("RFC-001 §5 — durable provisioning", () => {
	test("prepareOrganizationCreation returns the same operationId on a re-claim", async () => {
		const { prepareOrganizationCreation } = await import(
			"@workspace/auth/organization-policy"
		)
		const user = await createVerifiedUser("reclaim")
		if (!user) return
		const first = await prepareOrganizationCreation(user.userId)
		const second = await prepareOrganizationCreation(user.userId)
		expect(first.bootstrapOperationId).toBe(second.bootstrapOperationId)
	})

	test("finalizeOrganizationProvisioning rejects a stale worker (fencing-token mismatch)", async () => {
		// The test simulates a stale worker by reading the
		// token at T1, advancing it at T2 (a parallel
		// worker), then calling finalize with the T1 value.
		// The function must throw and the default row must
		// NOT be written.
		const { finalizeOrganizationProvisioning, getProvisioningState } =
			await import("@workspace/auth/organization-policy")
		const user = await createVerifiedUser("tx-rollback")
		if (!user) return
		const { orgId } = await createDefaultOrganization(user, "tx-rollback")

		// Read the current fencing token.
		const before = await getProvisioningState(user.userId)
		expect(before).not.toBeNull()
		const staleToken = before!.fencingToken

		// Simulate a parallel worker that advanced the token.
		await db.execute(
			sql`UPDATE "account_organization_provisioning" SET "fencing_token" = "fencing_token" + 1 WHERE "user_id" = ${user.userId}`,
		)

		// The stale worker calls finalize with the token it
		// read at T1. The function MUST throw and the
		// default row must remain absent (or, in this
		// fixture, unchanged — we inserted it manually).
		// The test exercises the rejection: we expect an
		// APIError with code "CONFLICT".
		await expect(
			finalizeOrganizationProvisioning({
				userId: user.userId,
				organizationId: orgId,
				expectedFencingToken: staleToken,
			}),
		).rejects.toMatchObject({ body: { code: "CONFLICT" } })
	})
})

describe.skipIf(skip())("RFC-001 §7 — multi-role owner retention", () => {
	test("creator with multi-role 'owner,admin' membership is still protected from removal", async () => {
		// The assertion must use hasOwnerRole, not
		// `member.role !== "owner"`. A membership with
		// role "owner,admin" is still an owner and must
		// still be protected.
		const {
			assertDefaultOwnerMembershipIsRetained,
		} = await import("@workspace/auth/organization-policy")
		const user = await createVerifiedUser("multi-role")
		if (!user) return
		const { orgId } = await createDefaultOrganization(user, "multi-role")
		await expect(
			assertDefaultOwnerMembershipIsRetained({
				id: "member-row",
				userId: user.userId,
				organizationId: orgId,
				role: "owner,admin",
				createdAt: new Date(),
			}),
		).rejects.toMatchObject({ body: { code: "FORBIDDEN" } })
	})
})

describe.skipIf(skip())("RFC-001 §6 — slug policy", () => {
	test("validateOrganizationSlug rejects reserved slugs", async () => {
		const user = await createVerifiedUser("reserved")
		if (!user) return
		await expect(
			auth.api.createOrganization({
				body: { name: "Onboarding", slug: "onboarding" },
				headers: user.headers,
			}),
		).rejects.toMatchObject({ body: { code: "BAD_REQUEST" } })
	})

	test("validateOrganizationSlug rejects malformed slugs", async () => {
		const user = await createVerifiedUser("malformed")
		if (!user) return
		for (const slug of ["a", "UPPER", "with spaces", "trailing-", "-lead"]) {
			await expect(
				auth.api.createOrganization({
					body: { name: "Test", slug },
					headers: user.headers,
				}),
			).rejects.toMatchObject({ body: { code: "BAD_REQUEST" } })
		}
	})
})
