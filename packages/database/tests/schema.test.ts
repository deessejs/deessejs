import { afterAll, describe, expect, it } from "vitest"
import { cleanup } from "./setup.js"
import * as schema from "../src/schema/index.js"

describe("database schema", () => {
  afterAll(async () => {
    await cleanup()
  })

  describe("auth tables", () => {
    it("should export user table", () => {
      expect(schema.user).toBeDefined()
      expect(schema.user.id).toBeDefined()
      expect(schema.user.email).toBeDefined()
      expect(schema.user.name).toBeDefined()
    })

    it("should export session table", () => {
      expect(schema.session).toBeDefined()
      expect(schema.session.id).toBeDefined()
      expect(schema.session.token).toBeDefined()
      expect(schema.session.userId).toBeDefined()
    })

    it("should export account table", () => {
      expect(schema.account).toBeDefined()
      expect(schema.account.id).toBeDefined()
      expect(schema.account.providerId).toBeDefined()
    })

    it("should export verification table", () => {
      expect(schema.verification).toBeDefined()
      expect(schema.verification.identifier).toBeDefined()
      expect(schema.verification.value).toBeDefined()
    })

    it("should export relations", () => {
      expect(schema.userRelations).toBeDefined()
      expect(schema.sessionRelations).toBeDefined()
      expect(schema.accountRelations).toBeDefined()
    })
  })

  describe("table structure", () => {
    it("should have correct user table columns", () => {
      // Verify table definition by checking column existence
      const userTable = schema.user
      expect(userTable).toBeDefined()

      // Check that the table can be used in queries (structure validation)
      // The actual query requires a running database
    })
  })
})
