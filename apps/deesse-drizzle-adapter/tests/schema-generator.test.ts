import { describe, expect, it } from "vitest"
import { generateDrizzleSchemaSource } from "../src/schema-generator.js"

describe("Deesse Drizzle schema generation", () => {
  it("emits no unused imports when there are no configured plugin schemas", () => {
    expect(generateDrizzleSchemaSource({})).toBe("")
  })
})
