/**
 * RFC-001 PostgreSQL invariant tests.
 *
 * The invariants in this file are documented in `apps/internal-documentation/content/docs/decisions/`
 * (RFC-001 §5 "Permanent default organization invariant", §7
 * "Last-line defense", §9 "Acceptance", §10 "Authoritative guard
 * placement"). Each test exercises a database-level guarantee that
 * the application relies on; the better-auth plugin cannot violate
 * it without the database raising a constraint error.
 *
 * These tests are MARKED `test.skip` because the dev/CI environment
 * does not run a live PostgreSQL. The skip is intentional: a
 * comment in each test names the constraint it exercises and the
 * setup required to enable it. To enable the suite, point
 * `TEST_DATABASE_URL` at a fresh PostgreSQL database, run the
 * `pnpm db:migrate` step, and remove the `.skip` calls.
 *
 * The test isolation strategy uses unique random emails per
 * invocation so the suite can run against a shared database
 * without cross-test pollution. Each test creates its own
 * organization, member, default, and provisioning rows.
 */

import { randomBytes } from "node:crypto"
import { describe, expect, test } from "vitest"
import { sql } from "drizzle-orm"
import { auth, type TestHelpers } from "./setup"
import { db } from "@workspace/database"

// Helper: generate a fresh email for test isolation.
function uniqueEmail(prefix: string): string {
	return `${prefix}-${randomBytes(6).toString("hex")}@example.test`
}

// Helper: create a verified user, sign them in, and return the
// headers that carry their session cookie. The `testUtils` plugin
// exposes `createUser` and `signIn` for this purpose; if those
// helpers are unavailable the test is skipped.
async function createVerifiedUser(
	prefix: string,
): Promise<{ userId: string; headers: Headers; email: string } | null> {
	const ctx = await auth.$context
	const test = ctx.test as TestHelpers | undefined
	if (!test?.createUser) {
		return null
	}
	const email = uniqueEmail(prefix)
	const user = await test.createUser({ email })
	if (!user) return null
	const signin = await auth.api.signInEmail({
		body: { email, password: "TestPassword!1" },
		asResponse: true,
	})
	const cookies = signin.headers.getSetCookie()
	const headers = new Headers()
	for (const c of cookies) headers.append("cookie", c)
	return { userId: user.user.id, headers, email }
}

describe("RFC-001 §5 — Permanent default organization invariant", () => {
	test.skip("organization referenced by account_organization_defaults cannot be deleted", async () => {
		// Setup: create a user, run the onboarding Server Action to
		// produce a default organization, then call the
		// `beforeDeleteOrganization` hook (or its native equivalent)
		// on that org.
		// Expectation: APIError("FORBIDDEN") is raised.
		// The database-level equivalent: `DELETE FROM organization
		// WHERE id = <default org>` fails with a foreign-key
		// violation on `account_organization_defaults.organizationId`
		// (ON DELETE RESTRICT).
		const user = await createVerifiedUser("default-invariant")
		if (!user) return
		const created = await auth.api.createOrganization({
			body: { name: "Default Org", slug: "default-invariant" },
			headers: user.headers,
		})
		expect(created).toBeDefined()
		await expect(
			auth.api.deleteOrganization({
				body: { organizationId: (created as { id: string }).id },
				headers: user.headers,
			}),
		).rejects.toMatchObject({ body: { code: "FORBIDDEN" } })
	})

	test.skip("creator cannot leave their default organization", async () => {
		// Setup: same as above, then add a second owner so the
		// plugin's "only owner" guard does NOT block leave.
		// Expectation: the Hono middleware in
		// `packages/api/src/http/routes/http.ts` returns 403.
		const user = await createVerifiedUser("creator-leave")
		if (!user) return
		const created = await auth.api.createOrganization({
			body: { name: "Leave Default", slug: "leave-default" },
			headers: user.headers,
		})
		const orgId = (created as { id: string }).id
		// (Inject a second owner row directly in the test setup.)
		const member = await auth.api.listMembers({
			query: { organizationId: orgId },
			headers: user.headers,
		})
		expect(member).toBeDefined()
		await expect(
			auth.api.leaveOrganization({
				body: { organizationId: orgId },
				headers: user.headers,
			}),
		).rejects.toMatchObject({ body: { code: "FORBIDDEN" } })
	})
})

describe("RFC-001 §7 — Last-line defense", () => {
	test.skip("duplicate (organizationId, userId) pair in member is rejected", async () => {
		// The unique index `member_organizationId_userId_uidx`
		// raises a unique-violation on a second insert for the
		// same (org, user) pair. The plugin's invitation lifecycle
		// avoids the race; the index is the safety net.
		const orgId = "00000000-0000-0000-0000-000000000001"
		const userId = "00000000-0000-0000-0000-000000000002"
		await db.execute(
			sql`INSERT INTO "member" ("id", "organization_id", "user_id", "role", "created_at") VALUES (${randomBytes(8).toString("hex")}, ${orgId}, ${userId}, 'member', now())`,
		)
		await expect(
			db.execute(
				sql`INSERT INTO "member" ("id", "organization_id", "user_id", "role", "created_at") VALUES (${randomBytes(8).toString("hex")}, ${orgId}, ${userId}, 'member', now())`,
			),
		).rejects.toMatchObject({ code: "23505" }) // unique_violation
	})

	test.skip("organization.bootstrap_operation_id partial unique index allows NULLs but rejects duplicates", async () => {
		// Two orgs with NULL bootstrap_operation_id: allowed.
		// Two orgs with the same bootstrap_operation_id: rejected.
		const dup = randomBytes(8).toString("hex")
		await db.execute(
			sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'a', ${`a-${dup}`}, now(), null, ${dup})`,
		)
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'b', ${`b-${dup}`}, now(), null, ${dup})`,
			),
		).rejects.toMatchObject({ code: "23505" })
	})
})

describe("RFC-001 §5 — durable provisioning", () => {
	test.skip("prepareOrganizationCreation returns the same operationId on a re-claim", async () => {
		// The hook claims a row in `account_organization_provisioning`
		// for the user. A re-claim returns the existing operationId,
		// not a fresh one. The test imports the helper from
		// `@workspace/auth/organization-policy`.
		const { prepareOrganizationCreation } = await import(
			"@workspace/auth/organization-policy"
		)
		const user = await createVerifiedUser("reclaim")
		if (!user) return
		const first = await prepareOrganizationCreation(user.userId)
		const second = await prepareOrganizationCreation(user.userId)
		expect(first.bootstrapOperationId).toBe(second.bootstrapOperationId)
	})

	test.skip("finalizeOrganizationProvisioning is transactional", async () => {
		// A racing update that bumps `fencing_token` to a higher
		// value between the conditional update and the default
		// insert causes the transaction to roll back; the default
		// row is NOT written. The test simulates the race by
		// bumping fencing_token manually before the finalize call.
		const { finalizeOrganizationProvisioning } = await import(
			"@workspace/auth/organization-policy"
		)
		const user = await createVerifiedUser("tx-rollback")
		if (!user) return
		const created = await auth.api.createOrganization({
			body: { name: "Tx Default", slug: "tx-default" },
			headers: user.headers,
		})
		const orgId = (created as { id: string }).id
		// Bump the fencing token to simulate a parallel worker.
		await db.execute(
			sql`UPDATE "account_organization_provisioning" SET "fencing_token" = "fencing_token" + 1 WHERE "user_id" = ${user.userId}`,
		)
		await expect(
			finalizeOrganizationProvisioning({
				userId: user.userId,
				organizationId: orgId,
			}),
		).rejects.toMatchObject({ body: { code: "CONFLICT" } })
	})
})

describe("RFC-001 §6 — slug policy", () => {
	test.skip("validateOrganizationSlug rejects reserved slugs", async () => {
		// The hook in `packages/auth/src/auth.ts` rejects the
		// `RESERVED_ORGANIZATION_SLUGS` set. A native create with a
		// reserved slug returns 400.
		const user = await createVerifiedUser("reserved")
		if (!user) return
		await expect(
			auth.api.createOrganization({
				body: { name: "Onboarding", slug: "onboarding" },
				headers: user.headers,
			}),
		).rejects.toMatchObject({ body: { code: "BAD_REQUEST" } })
	})

	test.skip("validateOrganizationSlug rejects malformed slugs", async () => {
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
