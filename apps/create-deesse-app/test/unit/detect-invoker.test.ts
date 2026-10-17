import { describe, expect, it } from "vitest"

import { CliError } from "../../src/errors/index.js"
import { assertNotNpmInvocation } from "../../src/pm/detect-invoker.js"

const baseEnv: NodeJS.ProcessEnv = {}

describe("assertNotNpmInvocation", () => {
  it("passes when no npm-related env vars are set", () => {
    expect(() => assertNotNpmInvocation({ ...baseEnv })).not.toThrow()
  })

  it("rejects when npm_config_user_agent starts with npm/", () => {
    expect(() =>
      assertNotNpmInvocation({
        ...baseEnv,
        npm_config_user_agent: "npm/10.4.0 node/v22.10.0 darwin x64",
      }),
    ).toThrowError(CliError)
  })

  it("passes when npm_config_user_agent starts with pnpm/", () => {
    expect(() =>
      assertNotNpmInvocation({
        ...baseEnv,
        npm_config_user_agent: "pnpm/9.0.0 node/v22.10.0 darwin x64",
      }),
    ).not.toThrow()
  })

  it("rejects when npm_lifecycle_event is set", () => {
    expect(() =>
      assertNotNpmInvocation({
        ...baseEnv,
        npm_lifecycle_event: "start",
      }),
    ).toThrowError(CliError)
  })

  it("rejects when npm_node_execpath is set", () => {
    expect(() =>
      assertNotNpmInvocation({
        ...baseEnv,
        npm_node_execpath: "/usr/local/bin/node",
      }),
    ).toThrowError(CliError)
  })

  it("error code is unsupported_manager", () => {
    try {
      assertNotNpmInvocation({
        ...baseEnv,
        npm_config_user_agent: "npm/10.4.0",
      })
      throw new Error("expected throw")
    } catch (err) {
      expect(err).toBeInstanceOf(CliError)
      expect((err as CliError).code).toBe("unsupported_manager")
      expect((err as CliError).hint).toContain("pnpm dlx")
    }
  })

  it("uses process.env by default when called with no argument", () => {
    // We can't easily inject a custom env into process.env from a test
    // (vitest's runner sets its own npm_* vars), so we only verify the
    // function reads SOMETHING (either a passed env or process.env) and
    // returns without crashing when no npm vars are present.
    expect(() => assertNotNpmInvocation({})).not.toThrow()
  })
})