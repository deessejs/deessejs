import { describe, expect, it } from "vitest"

import { SETTINGS_PATHS, SETTINGS_PREFIX } from "../lib/settings-paths"

describe("SETTINGS_PATHS", () => {
  it("puts every leaf under the prefix", () => {
    // A leaf that forgot the `/settings` segment would be a broken
    // link, and the proxy would not protect it either.
    for (const path of Object.values(SETTINGS_PATHS)) {
      expect(path.startsWith(`${SETTINGS_PREFIX}/`)).toBe(true)
    }
  })

  it("gives every leaf its own path", () => {
    const paths = Object.values(SETTINGS_PATHS)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
