/**
 * Template catalog table constraints.
 *
 * These assertions need a real PostgreSQL. The pg-mem path in
 * `setup.ts` builds its own DDL inline, covers only the auth tables,
 * and returns an adapter exposing just `execute` and `select`, so a
 * Drizzle insert through it fails. The suite therefore skips itself
 * when there is no database to talk to.
 *
 * The skip is probed with `serverEnv.TEST_DATABASE_URL` because that is
 * exactly the branch `setup.ts` takes at line 90. Do not use
 * `testDb.isPgMem` as the probe: `skipIf` is evaluated during
 * collection, before `beforeAll` has connected, and `isPgMem` is true
 * in that state on both paths. The suite would then skip in the
 * integration job too, and a green run would look identical to a
 * working one.
 */
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { serverEnv } from "@workspace/env/server"
import { testDb } from "./setup.js"
import { templateRepositorySnapshots, templates } from "../src/schema/index.js"

describe.skipIf(!serverEnv.TEST_DATABASE_URL)("template catalog tables", () => {
  /**
   * The pg-mem branch of `testDb.db` is a plain object with only
   * `execute` and `select`. This suite only runs against a real
   * PostgreSQL, so the driver is the Drizzle instance in both cases.
   *
   * The handle is taken in `beforeAll`, not at describe-body level:
   * the body runs during collection, before the connection that
   * `setup.ts` opens in its own `beforeAll` exists.
   */
  let db: PostgresJsDatabase

  beforeAll(() => {
    db = testDb.db as PostgresJsDatabase
  })

  const insertTemplate = async (overrides: Record<string, unknown> = {}) => {
    const inserted = await db
      .insert(templates)
      .values({
        slug: "saas-starter",
        name: "SaaS Starter",
        owner: "deessejs",
        repo: "saas-template",
        category: "saas",
        ...overrides,
      })
      .returning({ id: templates.id })
    return inserted[0].id
  }

  const insertSnapshot = async (
    templateId: string,
    overrides: Record<string, unknown> = {}
  ) => {
    await db.insert(templateRepositorySnapshots).values({
      templateId,
      repositoryName: "saas-template",
      canonicalUrl: "https://github.com/deessejs/saas-template",
      ...overrides,
    })
  }

  /**
   * Drizzle wraps a driver failure in a `DrizzleQueryError` whose
   * message is the failed query and its parameters. The PostgreSQL
   * error, which carries the constraint name, is on `cause`.
   */
  const expectViolation = async (
    statement: Promise<unknown>,
    pattern: RegExp
  ) => {
    const error = await statement.then(
      () => undefined,
      (rejection: unknown) => rejection
    )
    expect(error, "expected the statement to be rejected").toBeDefined()
    const cause = (error as { cause?: { message?: string } }).cause
    expect(cause?.message).toMatch(pattern)
  }

  // The integration job runs one migrated database for @workspace/auth,
  // @workspace/api and this package. These two tables are written
  // only here, so the rows are cleaned between cases. The snapshot
  // goes first: it references templates.
  beforeEach(async () => {
    await db.delete(templateRepositorySnapshots)
    await db.delete(templates)
  })

  it("accepts an editorial row with its snapshot", async () => {
    const id = await insertTemplate()

    await insertSnapshot(id)

    const rows = await db.select().from(templates)
    expect(rows).toHaveLength(1)
    expect(rows[0].slug).toBe("saas-starter")

    const snapshots = await db.select().from(templateRepositorySnapshots)
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].templateId).toBe(id)
  })

  it("rejects a second snapshot for the same template", async () => {
    const id = await insertTemplate()
    await insertSnapshot(id)

    await expectViolation(
      insertSnapshot(id),
      /template_repository_snapshots_pkey/
    )
  })

  it("rejects deleting a template that still has a snapshot", async () => {
    const id = await insertTemplate()
    await insertSnapshot(id)

    await expectViolation(
      db.delete(templates),
      /template_repository_snapshots_template_id_templates_id_fk/
    )
  })

  it("rejects a blank slug", async () => {
    await expectViolation(
      insertTemplate({ slug: "   " }),
      /templates_slug_nonempty/
    )
  })

  it("rejects a negative star count", async () => {
    const id = await insertTemplate()

    await expectViolation(
      insertSnapshot(id, { stars: -1 }),
      /template_repository_snapshots_stars_nonnegative/
    )
  })

  it("rejects an access value outside the enum", async () => {
    await expectViolation(
      insertTemplate({ access: "premium" }),
      /invalid input value for enum template_access/
    )
  })
})
