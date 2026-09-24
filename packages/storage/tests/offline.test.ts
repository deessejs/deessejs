import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { detectOffline } from "../src/offline.js"

const ORIGINAL_CI = process.env.CI
const ORIGINAL_DEESSE = process.env.DEESSE_OFFLINE
const ORIGINAL_DEESSE_OFF = process.env.DEESSE_OFFLINE_OFF

beforeEach(() => {
  delete process.env.CI
  delete process.env.DEESSE_OFFLINE
  delete process.env.DEESSE_OFFLINE_OFF
})

afterEach(() => {
  if (ORIGINAL_CI === undefined) delete process.env.CI
  else process.env.CI = ORIGINAL_CI
  if (ORIGINAL_DEESSE === undefined) delete process.env.DEESSE_OFFLINE
  else process.env.DEESSE_OFFLINE = ORIGINAL_DEESSE
  if (ORIGINAL_DEESSE_OFF === undefined) delete process.env.DEESSE_OFFLINE_OFF
  else process.env.DEESSE_OFFLINE_OFF = ORIGINAL_DEESSE_OFF
})

describe("detectOffline", () => {
  it("is online by default", () => {
    expect(detectOffline().offline).toBe(false)
  })

  it("CI=true forces offline", () => {
    process.env.CI = "true"
    expect(detectOffline()).toEqual({ offline: true, reason: "ci" })
  })

  it("DEESSE_OFFLINE=true forces offline with explicit reason", () => {
    process.env.DEESSE_OFFLINE = "true"
    expect(detectOffline()).toEqual({ offline: true, reason: "explicit" })
  })

  it("CI takes precedence over DEESSE_OFFLINE", () => {
    process.env.CI = "true"
    process.env.DEESSE_OFFLINE = "true"
    expect(detectOffline().reason).toBe("ci")
  })

  it("DEESSE_OFFLINE_OFF=true overrides DEESSE_OFFLINE", () => {
    process.env.DEESSE_OFFLINE = "true"
    process.env.DEESSE_OFFLINE_OFF = "true"
    expect(detectOffline().offline).toBe(false)
  })

  it("DEESSE_OFFLINE_OFF cannot override CI=true", () => {
    process.env.CI = "true"
    process.env.DEESSE_OFFLINE_OFF = "true"
    expect(detectOffline().offline).toBe(true)
  })
})
