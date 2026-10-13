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
import { withProvisioningAttempt } from "@workspace/auth/organization-policy"
import { db } from "@workspace/database"

// Toggle the suite on once TEST_DATABASE_URL is configured.
const skip = () => !process.env.TEST_DATABASE_URL

// Helper: generate a fresh slug for test isolation.
function uniqueSlug(prefix: string): string {
	const suffix = randomBytes(4).toString("hex")
	return `${prefix}-${suffix}`.slice(0, 41)
}

// Helper: create a verified user. The testUtils `createUser`
// factory is in-memory only — it returns a `User` object
// without writing to the database. Persisting it requires
// `saveUser`, which goes through the proper internal adapter
// (creates the row + matching `account` row with the
// credentials). The factory already defaults
// `emailVerified: true`, so the user satisfies the
// organization plugin's "verified users only" guard without
// any direct UPDATE on the row.
//
// To get an authenticated session, we use `login({ userId })`
// (or `getAuthHeaders({ userId })`), which creates a session
// directly via `internalAdapter.createSession`. This bypasses
// the password round-trip — important because `createUser` +
// `saveUser` does not establish a known password, and a
// `signInEmail` call with a hard-coded test password would
// fail with "invalid credentials" (the password was never
// registered with the credentials plugin).
async function createVerifiedUser(
	prefix: string,
): Promise<{ userId: string; headers: Headers; email: string } | null> {
	const ctx = await auth.$context
	const test = ctx.test as TestHelpers | undefined
	if (!test?.createUser || !test.saveUser || !test.login) {
		return null
	}
	const email = `${prefix}-${randomBytes(6).toString("hex")}@example.test`
	const user = test.createUser({ email })
	if (!user) return null
	const saved = await test.saveUser(user)
	if (!saved?.id) return null
	const { headers } = await test.login({ userId: saved.id })
	return { userId: saved.id, headers, email }
}

// Helper: create an organization and a default row for the
// user, simulating a completed onboarding. Returns the org
// id, slug, and the operation id the hook stashed on the
// provisioning row.
//
// The plugin's `beforeCreateOrganization` hook calls
// `prepareOrganizationCreation`, which inserts the
// `account_organization_provisioning` row. The test must NOT
// insert a second one for the same user_id (PK violation).
// We read the operation id back from the row the hook wrote.
//
// The default row is the user-visible "this is my default"
// relation. The Server Action's `finalizeOrganizationProvisioning`
// is the only sanctioned writer; for tests we mirror it with
// a direct INSERT.
//
// The hook enforces a provisioning-attempt context, so we
// wrap the create call in `withProvisioningAttempt`. The
// attempt id is opaque (any unique string per call) and
// scoped only to this synchronous create, since the test
// does not call `consumeProvisioningClaim` afterwards.
async function createDefaultOrganization(
	user: { userId: string; headers: Headers },
	prefix: string,
): Promise<{ orgId: string; slug: string; operationId: string }> {
	const slug = uniqueSlug(prefix)
	const created = (await withProvisioningAttempt(
		user.userId,
		randomBytes(16).toString("hex"),
		async () =>
			await auth.api.createOrganization({
				body: { name: `Default ${prefix}`, slug },
				headers: user.headers,
			}),
	)) as { id: string; slug: string }
	// Read the operation id the hook stashed. The
	// project's `drizzle-orm/postgres-js` driver returns
	// `RowList<Row[]>` for raw `db.execute(sql\`…\`)`
	// calls — the row iterator is the array itself, NOT
	// `{ rows: [...] }` (that shape belongs to the
	// node-postgres / pg-core / vercel-postgres drivers).
	// Reading `.rows[0]` here would silently produce
	// `undefined` and the next line would throw on
	// `opRow.operation_id`. We narrow through an unknown
	// cast for the column name (drizzle does not type
	// raw `sql\`…\`` SELECTs).
	const opRows = (await db.execute(
		sql`SELECT "operation_id" FROM "account_organization_provisioning" WHERE "user_id" = ${user.userId} LIMIT 1`,
	)) as unknown as Array<{ operation_id: string }>
	const opRow = opRows[0]
	if (!opRow) {
		throw new Error("Hook did not write a provisioning row")
	}
	// Mark the provisioning row as completed with the org id
	// — mirrors what finalizeOrganizationProvisioning does in
	// production.
	await db.execute(
		sql`UPDATE "account_organization_provisioning"
			SET "status" = 'completed', "organization_id" = ${created.id},
				"final_slug" = ${slug}, "requested_name" = ${`Default ${prefix}`},
				"fencing_token" = "fencing_token" + 1
			WHERE "user_id" = ${user.userId}`,
	)
	await db.execute(
		sql`INSERT INTO "account_organization_defaults" ("user_id", "organization_id", "created_at")
			VALUES (${user.userId}, ${created.id}, now())`,
	)
	return { orgId: created.id, slug, operationId: opRow.operation_id }
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

	test("organization.bootstrap_operation_id is unique when not NULL (partial unique index)", async () => {
		// The partial unique index
		// `organization_bootstrap_operation_id_uidx` is
		// defined as `CREATE UNIQUE INDEX ... ON
		// "organization" ("bootstrap_operation_id") WHERE
		// "bootstrap_operation_id" IS NOT NULL`. NULLs are
		// excluded from uniqueness, but two non-NULL
		// markers must collide. The marker is a correlation
		// pointer for the provisioning protocol — the index
		// is the safety net that prevents a second
		// organization from silently binding to an
		// operation id owned by another account's
		// provisioning row.
		const dup = randomBytes(8).toString("hex")
		await db.execute(
			sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'A', ${`a-${dup}`}, now(), null, ${dup})`,
		)
		// A second organization with the SAME non-NULL
		// marker is rejected by the partial unique index.
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'B', ${`b-${dup}`}, now(), null, ${dup})`,
			),
		).rejects.toMatchObject({ code: "23505" }) // unique_violation
		// NULL is excluded from the index, so two NULLs
		// (and any number of NULLs) coexist.
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'C', ${`c-${dup}`}, now(), null, null)`,
			),
		).resolves.toBeDefined()
		await expect(
			db.execute(
				sql`INSERT INTO "organization" ("id", "name", "slug", "created_at", "metadata", "bootstrap_operation_id") VALUES (${randomBytes(8).toString("hex")}, 'D', ${`d-${dup}`}, now(), null, null)`,
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
		// Direct calls to `prepareOrganizationCreation` must
		// be wrapped in `withProvisioningAttempt`: the helper
		// reads the attempt id from the AsyncLocalStorage
		// frame and refuses to run without one (a Server
		// Action or a real client always provides it). We
		// also drive both calls from a single attempt frame
		// so the second call is a true "re-claim" against
		// the live lease the first call wrote — not two
		// independent calls that race the lease.
		const first = await withProvisioningAttempt(
			user.userId,
			"reclaim-attempt",
			() => prepareOrganizationCreation(user.userId),
		)
		const second = await withProvisioningAttempt(
			user.userId,
			"reclaim-attempt",
			() => prepareOrganizationCreation(user.userId),
		)
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
	// Helper: drive a single create call inside an
	// provisioning-attempt frame so the plugin's hook does
	// not throw the "must be called inside withProvisioningAttempt"
	// guard. The attempt id is opaque; the test only
	// exercises the slug-policy guard, not the consume flow.
	async function createInsideAttempt(
		user: { userId: string; headers: Headers },
		body: { name: string; slug: string },
	): Promise<unknown> {
		return await withProvisioningAttempt(
			user.userId,
			randomBytes(16).toString("hex"),
			async () =>
				await auth.api.createOrganization({
					body,
					headers: user.headers,
				}),
		)
	}

	test("validateOrganizationSlug rejects reserved slugs", async () => {
		const user = await createVerifiedUser("reserved")
		if (!user) return
		await expect(
			createInsideAttempt(user, { name: "Onboarding", slug: "onboarding" }),
		).rejects.toMatchObject({ body: { code: "BAD_REQUEST" } })
	})

	test("validateOrganizationSlug rejects malformed slugs", async () => {
		const user = await createVerifiedUser("malformed")
		if (!user) return
		for (const slug of ["a", "UPPER", "with spaces", "trailing-", "-lead"]) {
			await expect(
				createInsideAttempt(user, { name: "Test", slug }),
			).rejects.toMatchObject({ body: { code: "BAD_REQUEST" } })
		}
	})
})
