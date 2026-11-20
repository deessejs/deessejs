import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { drizzle } from "drizzle-orm/postgres-js"
import { eq } from "drizzle-orm"
import postgres from "postgres"
import { afterAll, describe, expect, it } from "vitest"
import * as schema from "@workspace/database/schema"
import { createDeesse } from "deesse"
import { postsPlugin } from "../../../apps/deesse/examples/posts-plugin.js"
import { drizzleAdapter } from "../src/index.js"

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL Deesse adapter integration", () => {
  const sqlClient = postgres(databaseUrl ?? "postgres://unused:unused@localhost:5432/unused", { max: 1, prepare: false })
  const db = drizzle(sqlClient, { schema })
  const adapter = drizzleAdapter(db)
  const app = createDeesse({
    database: adapter,
    auth: {
      baseURL: "http://localhost",
      secret: "deesse-postgres-integration-secret-long-enough",
      emailAndPassword: { enabled: true },
    },
    plugins: [postsPlugin()],
  })

  afterAll(async () => {
    await sqlClient.end()
  })

  it("runs typed CRUD and bounded query operations with generated mappings", async () => {
    const suffix = crypto.randomUUID()
    const draftStatus = "draft-" + suffix
    const publishedStatus = "published-" + suffix
    const first = await app.database.insert("posts", { title: "draft-a-" + suffix, status: draftStatus })
    const second = await app.database.insert("posts", { title: "draft-b-" + suffix, status: draftStatus })
    const third = await app.database.insert("posts", { title: "published-" + suffix, status: publishedStatus })
    expect(first._tag).toBe("Ok")
    expect(second._tag).toBe("Ok")
    expect(third._tag).toBe("Ok")
    if (first._tag !== "Ok" || second._tag !== "Ok" || third._tag !== "Ok") throw new Error("Post insert failed.")
    expect(first.value.views).toBe(0)
    expect(first.value.live).toBe(false)
    expect(first.value.publishedAt).toBeNull()
    expect(first.value.publishedOn).toBeNull()
    expect(first.value.details).toBeNull()

    const duplicate = await app.database.insert("posts", { title: first.value.title, status: draftStatus })
    expect(duplicate._tag).toBe("Err")
    if (duplicate._tag === "Err") expect(duplicate.error.fields.code).toBe("CONFLICT")

    const found = await app.database.findById("posts", first.value.id)
    expect(found._tag).toBe("Ok")
    if (found._tag === "Ok") expect(found.value.title).toBe(first.value.title)
    const missing = await app.database.findById("posts", crypto.randomUUID())
    expect(missing._tag).toBe("Err")
    if (missing._tag === "Err") {
      expect(missing.error.fields.code).toBe("NOT_FOUND")
      expect(missing.error.fields.model).toBe("posts")
    }

    const equality = await app.database.findMany("posts", { where: { status: draftStatus } })
    expect(equality._tag).toBe("Ok")
    if (equality._tag === "Ok") expect(equality.value.length).toBe(2)
    const ordered = await app.database.findMany("posts", {
      where: { status: { in: [draftStatus, publishedStatus] } },
      orderBy: { title: "asc" },
      limit: 2,
    })
    expect(ordered._tag).toBe("Ok")
    if (ordered._tag === "Ok") {
      expect(ordered.value).toHaveLength(2)
      expect(ordered.value[0]?.title).toBe("draft-a-" + suffix)
    }
    const emptyIn = await app.database.findMany("posts", { where: { status: { in: [] } } })
    expect(emptyIn._tag).toBe("Ok")
    if (emptyIn._tag === "Ok") expect(emptyIn.value).toHaveLength(0)

    const updated = await app.database.updateById("posts", first.value.id, {
      status: publishedStatus,
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
      publishedOn: "2026-01-02",
      details: { source: "integration", labels: ["typed"] },
    })
    expect(updated._tag).toBe("Ok")
    if (updated._tag === "Ok") {
      expect(updated.value.publishedAt).toBeInstanceOf(Date)
      expect(updated.value.publishedOn).toBe("2026-01-02")
      expect(updated.value.details).toEqual({ source: "integration", labels: ["typed"] })
    }

    const deleted = await app.database.deleteById("posts", second.value.id)
    expect(deleted._tag).toBe("Ok")
    const missingDelete = await app.database.deleteById("posts", second.value.id)
    expect(missingDelete._tag).toBe("Err")
    if (missingDelete._tag === "Err") expect(missingDelete.error.fields.code).toBe("NOT_FOUND")
    await app.database.deleteById("posts", third.value.id)
    await app.database.deleteById("posts", first.value.id)
  })

  it("commits Ok, returns Err unchanged after rollback, and rethrows callback exceptions", async () => {
    const suffix = crypto.randomUUID()
    const committed = await app.database.transaction(async (transaction) =>
      transaction.insert("posts", { title: "commit-" + suffix, status: "draft" }))
    expect(committed._tag).toBe("Ok")
    if (committed._tag !== "Ok") throw new Error("Commit insert failed.")
    const committedRow = await app.database.findById("posts", committed.value.id)
    expect(committedRow._tag).toBe("Ok")

    const collision = await app.database.insert("posts", { title: "commit-" + suffix, status: "draft" })
    if (collision._tag !== "Err") throw new Error("Expected a unique conflict.")
    const rollbackTitle = "rollback-" + suffix
    const rolledBack = await app.database.transaction(async (transaction) => {
      const inserted = await transaction.insert("posts", { title: rollbackTitle, status: "draft" })
      if (inserted._tag === "Err") return inserted
      return collision
    })
    expect(rolledBack).toBe(collision)
    const rolledBackRows = await app.database.findMany("posts", { where: { title: rollbackTitle } })
    expect(rolledBackRows._tag).toBe("Ok")
    if (rolledBackRows._tag === "Ok") expect(rolledBackRows.value).toHaveLength(0)

    const thrownTitle = "thrown-" + suffix
    await expect(app.database.transaction(async (transaction) => {
      await transaction.insert("posts", { title: thrownTitle, status: "draft" })
      throw new Error("callback failed")
    })).rejects.toThrow("callback failed")
    const thrownRows = await app.database.findMany("posts", { where: { title: thrownTitle } })
    expect(thrownRows._tag).toBe("Ok")
    if (thrownRows._tag === "Ok") expect(thrownRows.value).toHaveLength(0)
  })

  it("persists Better Auth and serves the plugin API through the same configured client", async () => {
    const email = "auth-" + crypto.randomUUID() + "@example.test"
    const signup = await app.handler(new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "integration-password-123", name: "Integration User" }),
    }))
    expect(signup.status).toBe(200)
    const signupBody = await signup.json() as { user: { id: string } }
    const userRows = await db.select().from(schema.user).where(eq(schema.user.email, email))
    expect(userRows[0]?.id).toBe(signupBody.user.id)
    const cookie = signup.headers.get("set-cookie")
    expect(cookie).toBeTruthy()
    const sessionResponse = await app.handler(new Request("http://localhost/api/auth/get-session", {
      headers: { cookie: cookie ?? "" },
    }))
    expect(sessionResponse.status).toBe(200)
    const sessionBody = await sessionResponse.json() as { user: { id: string }; session: { userId: string } } | null
    expect(sessionBody?.user.id).toBe(signupBody.user.id)
    expect(sessionBody?.session.userId).toBe(signupBody.user.id)

    const client = createORPCClient(new RPCLink({
      url: "http://localhost/api/rpc",
      fetch: (request, init) => app.handler(new Request(request, init)),
    }))
    const result = await client.posts.status()
    expect(result).toBe("posts-ready")
  })
})
