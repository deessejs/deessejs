import { describe, expect, it } from "vitest"
import { generateAuthCliConfigSource } from "../src/auth-config-generator.js"
import { generateDrizzleSchemaSource } from "../src/schema-generator.js"

describe("Deesse Drizzle schema generation", () => {
  it("emits no unused imports when there are no configured plugin schemas", () => {
    expect(generateDrizzleSchemaSource({})).toBe("")
  })

  it("reuses Deesse-owned Better Auth and supports the config-object generator fallback", () => {
    const source = generateAuthCliConfigSource("../../deesse.config.ts")

    expect(source).toContain('import * as appConfig from "../../deesse.config.ts"')
    expect(source).toContain("const deesse = appConfig.deesse")
    expect(source).toContain("export const auth = deesse?.auth ?? betterAuth({")
    expect(source).toContain('"args" in registration ? definition.handler(registration.args) : definition.handler()')
    expect(source).toContain("contribution.auth?.serverPlugins")
    expect(source).toContain("plugins: [...(deesseConfig.auth.plugins ?? []), ...contributedServerPlugins]")
  })
})
