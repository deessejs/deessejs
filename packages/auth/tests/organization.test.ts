import { describe, expect, it } from "vitest"
import { auth } from "./organization.setup.js"
import { serverEnv } from "@workspace/env/server"

/**
 * Integration tests for the better-auth organization plugin.
 *
 * Requires a real Postgres test database — TEST_DATABASE_URL
 * points at a freshly migrated staging clone. The "skipped" blocks
 * below mirror session.test.ts: tests no-op when no DB is present
 * so local vitest runs stay green.
 */
const hasDatabase =
	!!serverEnv.TEST_DATABASE_URL || !!serverEnv.DATABASE_URL

describe("organization plugin", () => {
	describe("createOrganization", () => {
		it("creates an org, a member row, and sets activeOrganizationId", async () => {
			if (!hasDatabase) {
				expect(true).toBe(true) // no-op placeholder
				return
			}

			const ctx = await auth.$context
			const user = ctx.test.createUser({ email: "owner-1@example.com" })
			await ctx.test.saveUser(user)
			const { headers } = await ctx.test.login({ userId: user.id })

			const result = await auth.api.createOrganization({
				headers,
				body: { name: "Acme Corp", slug: "acme-corp" },
			})

			expect(result).toBeDefined()
			expect(result!.name).toBe("Acme Corp")
			expect(result!.slug).toBe("acme-corp")
			expect(result!.members.length).toBeGreaterThan(0)
			expect(result!.members[0]!.role).toBe("owner")

			const session = await auth.api.getSession({ headers })
			expect(session?.session.activeOrganizationId).toBe(result!.id)

			await ctx.test.deleteUser(user.id)
		})

		it("rejects a duplicate slug", async () => {
			if (!hasDatabase) {
				expect(true).toBe(true)
				return
			}

			const ctx = await auth.$context
			const user = ctx.test.createUser({ email: "owner-2@example.com" })
			await ctx.test.saveUser(user)
			const { headers } = await ctx.test.login({ userId: user.id })

			const created = await auth.api.createOrganization({
				headers,
				body: { name: "Beta", slug: "beta-dup" },
			})
			expect(created).toBeDefined()

			await expect(
				auth.api.createOrganization({
					headers,
					body: { name: "Beta Two", slug: "beta-dup" },
				}),
			).rejects.toThrow()

			await ctx.test.deleteUser(user.id)
		})
	})

	describe("listOrganizations", () => {
		it("returns the orgs the caller is a member of", async () => {
			if (!hasDatabase) {
				expect(true).toBe(true)
				return
			}

			const ctx = await auth.$context
			const user = ctx.test.createUser({ email: "lister@example.com" })
			await ctx.test.saveUser(user)
			const { headers } = await ctx.test.login({ userId: user.id })

			await auth.api.createOrganization({
				headers,
				body: { name: "Solo", slug: "solo-list" },
			})

			const list = await auth.api.listOrganizations({ headers })
			expect(list.length).toBeGreaterThanOrEqual(1)
			expect(list.some((org) => org.slug === "solo-list")).toBe(true)

			await ctx.test.deleteUser(user.id)
		})
	})

	describe("setActiveOrganization", () => {
		it("updates session.activeOrganizationId", async () => {
			if (!hasDatabase) {
				expect(true).toBe(true)
				return
			}

			const ctx = await auth.$context
			const user = ctx.test.createUser({ email: "switcher@example.com" })
			await ctx.test.saveUser(user)
			const { headers } = await ctx.test.login({ userId: user.id })

			const first = await auth.api.createOrganization({
				headers,
				body: { name: "A", slug: "switch-a" },
			})
			const second = await auth.api.createOrganization({
				headers,
				body: { name: "B", slug: "switch-b" },
			})

			await auth.api.setActiveOrganization({
				headers,
				body: { organizationId: second!.id },
			})
			const session = await auth.api.getSession({ headers })
			expect(session?.session.activeOrganizationId).toBe(second!.id)

			await auth.api.setActiveOrganization({
				headers,
				body: { organizationId: first!.id },
			})
			const session2 = await auth.api.getSession({ headers })
			expect(session2?.session.activeOrganizationId).toBe(first!.id)

			await ctx.test.deleteUser(user.id)
		})
	})
})
