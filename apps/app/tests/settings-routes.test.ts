import { describe, expect, it } from "vitest"

import {
  LEGACY_SETTINGS_PREFIX,
  SETTINGS_INDEX_PATH,
  SETTINGS_PATHS,
  SETTINGS_PREFIX,
  legacySettingsDestination,
} from "../lib/settings-routes"

describe("legacySettingsDestination", () => {
  it("maps the legacy hub to the profile leaf", () => {
    // The hub page at `/settings` redirected to `/settings/profile`
    // before the move, so the legacy path lands on the same leaf
    // rather than on a new one.
    expect(legacySettingsDestination(LEGACY_SETTINGS_PREFIX)).toBe(
      SETTINGS_INDEX_PATH,
    )
    expect(SETTINGS_INDEX_PATH).toBe("/account/settings/profile")
  })

  it("maps a legacy leaf to its new path, suffix preserved", () => {
    expect(legacySettingsDestination("/settings/profile")).toBe(
      "/account/settings/profile",
    )
    expect(legacySettingsDestination("/settings/sessions")).toBe(
      "/account/settings/sessions",
    )
    expect(legacySettingsDestination("/settings/connections")).toBe(
      "/account/settings/connections",
    )
    expect(legacySettingsDestination("/settings/account")).toBe(
      "/account/settings/account",
    )
  })

  it("maps a nested legacy path, every segment preserved", () => {
    expect(legacySettingsDestination("/settings/account/delete")).toBe(
      "/account/settings/account/delete",
    )
  })

  it("leaves a path that only shares the prefix alone", () => {
    // `/settings-something` is a different path. A bare `startsWith`
    // would have claimed it and redirected a URL that has nothing to
    // do with the account settings.
    expect(legacySettingsDestination("/settings-something")).toBeNull()
    expect(legacySettingsDestination("/settingsomething/profile")).toBeNull()
  })

  it("leaves the new paths alone", () => {
    expect(legacySettingsDestination(SETTINGS_PATHS.profile)).toBeNull()
    expect(legacySettingsDestination(SETTINGS_PATHS.accountDelete)).toBeNull()
    expect(legacySettingsDestination(SETTINGS_PREFIX)).toBeNull()
  })

  it("leaves unrelated paths alone", () => {
    expect(legacySettingsDestination("/home")).toBeNull()
    expect(legacySettingsDestination("/admin/home")).toBeNull()
    expect(legacySettingsDestination("/")).toBeNull()
  })
})

describe("SETTINGS_PATHS", () => {
  it("puts every leaf under the account settings prefix", () => {
    for (const path of Object.values(SETTINGS_PATHS)) {
      expect(path.startsWith(`${SETTINGS_PREFIX}/`)).toBe(true)
    }
  })
})
