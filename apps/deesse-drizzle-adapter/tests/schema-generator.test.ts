import { describe, expect, it } from "vitest"
import { generateAuthCliConfigSource } from "../src/auth-config-generator.js"
import { generateDrizzleSchemaSource } from "../src/schema-generator.js"

describe("Deesse Drizzle schema generation", () => {
  it("emits no unused imports when there are no configured plugin schemas", () => {
    expect(generateDrizzleSchemaSource({})).toBe("")
  })

  it("bridges the declarative Deesse auth config and plugin server contributions to Better Auth CLI", () => {
    const source = generateAuthCliConfigSource("../../deesse.config.ts")

    expect(source).toContain('import { deesseConfig } from "../../deesse.config.ts"')
    expect(source).toContain('"args" in registration ? definition.handler(registration.args) : definition.handler()')
    expect(source).toContain("contribution.auth?.serverPlugins")
    expect(source).toContain("plugins: [...(deesseConfig.auth.plugins ?? []), ...contributedServerPlugins]")
    expect(source).toContain("export const auth = betterAuth({")
  })
})
