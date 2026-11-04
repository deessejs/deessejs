import { describe, expect, it } from "vitest"

import {
  ACCOUNT_PATHS,
  ACCOUNT_PREFIX,
  SETTINGS_PATHS,
  SETTINGS_PREFIX,
} from "../lib/settings-paths"

describe("SETTINGS_PATHS", () => {
  it("puts every leaf under the prefix", () => {
    // A leaf that forgot the `/settings` segment would be a broken link.
    for (const path of Object.values(SETTINGS_PATHS)) {
      expect(path.startsWith(`${SETTINGS_PREFIX}/`)).toBe(true)
    }
  })

  it("gives every leaf its own path", () => {
    const paths = Object.values(SETTINGS_PATHS)
    expect(new Set(paths).size).toBe(paths.length)
  })
})

describe("ACCOUNT_PATHS", () => {
  it("keeps account-level pages under the account prefix", () => {
    for (const path of Object.values(ACCOUNT_PATHS)) {
      expect(path.startsWith(`${ACCOUNT_PREFIX}/`)).toBe(true)
    }
  })

  it("keeps account-level pages outside the settings section", () => {
    for (const path of Object.values(ACCOUNT_PATHS)) {
      expect(path.startsWith(`${SETTINGS_PREFIX}/`)).toBe(false)
    }
  })
})
