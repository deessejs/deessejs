import { describe, expect, it } from "vitest"

import { serverEnv } from "../../src/server.js"
import { clientSchema, serverInputShape } from "../../src/schema.js"

/**
 * Keys the server env exposes under a different name than the schema
 * declares. Each entry is a deliberate rename, resolved at
 * materialisation time, not a missing key.
 */
const RENAMED: Record<string, string> = {
  AUTH_SECRET: "BETTER_AUTH_SECRET",
}

/**
 * `serverEnv` is a Proxy over an explicitly materialised object, so a
 * key declared in the schema but left out of that object is silently
 * `undefined` at every call site. The `as ServerEnv` cast inside
 * `server.ts` hides the omission from the compiler, which is how
 * `RESEND_PLAYBOOK_AUDIENCE_ID` shipped reading `undefined`
 * forever: the playbook consent checkbox looked like it worked while
 * the Resend call was skipped on every signup.
 *
 * This suite is the guard for that class of bug.
 */
describe("serverEnv key parity", () => {
  it("exposes every key declared in the server schema", () => {
    const exposed = new Set(Object.keys(serverEnv))

    const missing = Object.keys(serverInputShape).filter(
      (key) => !exposed.has(key) && !(key in RENAMED),
    )

    expect(missing).toEqual([])
  })

  it("resolves every renamed key to the value of its target", () => {
    for (const [alias, target] of Object.entries(RENAMED)) {
      expect(serverEnv[alias as keyof typeof serverEnv]).toBe(
        serverEnv[target as keyof typeof serverEnv],
      )
    }
  })

  it("does not expose any client-only key", () => {
    const clientKeys = new Set(Object.keys(clientSchema))
    const leaked = Object.keys(serverEnv).filter((key) => clientKeys.has(key))

    expect(leaked).toEqual([])
  })
})
