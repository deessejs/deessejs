import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { eq } from "drizzle-orm"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "./fixtures/schema.js"
import { createDeesse } from "deesse"
import { postsPlugin } from "./fixtures/posts-plugin.js"
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

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./tests/fixtures/migrations" })
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

  it("maps invalid query and mutation input and missing updates to stable errors", async () => {
    const suffix = crypto.randomUUID()
    const inserted = await app.database.insert("posts", { title: "validation-" + suffix, status: "draft" })
    if (inserted._tag !== "Ok") throw new Error("Validation fixture insert failed.")

    const zeroLimit = await app.database.findMany("posts", { limit: 0 as never })
    const oversizedLimit = await app.database.findMany("posts", { limit: 101 as never })
    const unknownField = await app.database.insert("posts", { title: "unknown-" + suffix, status: "draft", missing: true } as never)
    const unknownUpdate = await app.database.updateById("posts", inserted.value.id, { missing: true } as never)
    const unknownFilter = await app.database.findMany("posts", { where: { missing: "value" } as never })
    const unknownOrder = await app.database.findMany("posts", { orderBy: { missing: "asc" } as never })
    const invalidOrder = await app.database.findMany("posts", { orderBy: { title: "sideways" } as never })
    for (const result of [zeroLimit, oversizedLimit, unknownField, unknownUpdate, unknownFilter, unknownOrder, invalidOrder]) {
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") expect(result.error.fields.code).toBe("VALIDATION")
    }

    const missingId = crypto.randomUUID()
    const missingUpdate = await app.database.updateById("posts", missingId, { title: "missing" })
    const missingDelete = await app.database.deleteById("posts", missingId)
    expect(missingUpdate._tag).toBe("Err")
    expect(missingDelete._tag).toBe("Err")
    if (missingUpdate._tag === "Err") expect(missingUpdate.error.fields.code).toBe("NOT_FOUND")
    if (missingDelete._tag === "Err") expect(missingDelete.error.fields.code).toBe("NOT_FOUND")
    await app.database.deleteById("posts", inserted.value.id)
  })

  it("maps a PostgreSQL connection failure to INFRASTRUCTURE", async () => {
    const unavailableSql = postgres("postgres://unavailable:unavailable@127.0.0.1:1/unavailable", {
      max: 1,
      connect_timeout: 1,
      prepare: false,
    })
    try {
      const unavailableDb = drizzle(unavailableSql, { schema })
      const unavailableApp = createDeesse({
        database: drizzleAdapter(unavailableDb),
        auth: {
          baseURL: "http://localhost",
          secret: "deesse-unavailable-database-test-secret-long-enough",
        },
        plugins: [postsPlugin()],
      })

      const result = await unavailableApp.database.findMany("posts")
      expect(result._tag).toBe("Err")
      if (result._tag === "Err") expect(result.error.fields.code).toBe("INFRASTRUCTURE")
    } finally {
      await unavailableSql.end({ timeout: 1 })
    }
  })

  it("maps PostgreSQL failures and rolls back prior transaction writes", async () => {
    const suffix = crypto.randomUUID()
    const target = await app.database.insert("posts", { title: "trigger-target-" + suffix, status: "draft" })
    if (target._tag !== "Ok") throw new Error("Trigger fixture insert failed.")

    try {
      await sqlClient.unsafe("ALTER TABLE posts ADD CONSTRAINT deesse_test_status_check CHECK (status <> 'constraint-fails')")
      const constraintFailure = await app.database.updateById("posts", target.value.id, { status: "constraint-fails" })
      expect(constraintFailure._tag).toBe("Err")
      if (constraintFailure._tag === "Err") expect(constraintFailure.error.fields.code).toBe("VALIDATION")

      await sqlClient.unsafe(`CREATE FUNCTION deesse_test_raise_error() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced adapter failure' USING ERRCODE = 'P0001'; END $$`)
      await sqlClient.unsafe(`CREATE TRIGGER deesse_test_raise_error BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION deesse_test_raise_error()`)
      const failedUpdate = await app.database.updateById("posts", target.value.id, { status: "should-fail" })
      expect(failedUpdate._tag).toBe("Err")
      if (failedUpdate._tag === "Err") expect(failedUpdate.error.fields.code).toBe("INFRASTRUCTURE")

      const rollbackTitle = "db-failure-rollback-" + suffix
      const transaction = await app.database.transaction(async (tx) => {
        const priorWrite = await tx.insert("posts", { title: rollbackTitle, status: "draft" })
        if (priorWrite._tag === "Err") return priorWrite
        return tx.updateById("posts", target.value.id, { status: "also-fails" })
      })
      expect(transaction._tag).toBe("Err")
      if (transaction._tag === "Err") expect(transaction.error.fields.code).toBe("INFRASTRUCTURE")
      const rolledBack = await app.database.findMany("posts", { where: { title: rollbackTitle } })
      expect(rolledBack._tag).toBe("Ok")
      if (rolledBack._tag === "Ok") expect(rolledBack.value).toHaveLength(0)
    } finally {
      await sqlClient.unsafe("DROP TRIGGER IF EXISTS deesse_test_raise_error ON posts")
      await sqlClient.unsafe("DROP FUNCTION IF EXISTS deesse_test_raise_error()")
      await sqlClient.unsafe("ALTER TABLE posts DROP CONSTRAINT IF EXISTS deesse_test_status_check")
      await app.database.deleteById("posts", target.value.id)
    }
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
