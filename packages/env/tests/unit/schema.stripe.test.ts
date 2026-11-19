import { describe, expect, it } from "vitest"

import { serverSchema } from "../../src/schema.js"

describe("optional Stripe server configuration", () => {
  it("accepts an unconfigured environment so apps can boot without Stripe", () => {
    const result = serverSchema.safeParse({ NODE_ENV: "development" })

    expect(result.success).toBe(true)
  })

  it("rejects partial Stripe configuration with an actionable error", () => {
    const result = serverSchema.safeParse({
      NODE_ENV: "development",
      STRIPE_SECRET_KEY: "sk_test_operator_supplied",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          /Stripe billing is optional/.test(issue.message)
        )
      ).toBe(true)
    }
  })

  it("accepts the complete operator supplied Stripe configuration", () => {
    const result = serverSchema.safeParse({
      NODE_ENV: "development",
      STRIPE_SECRET_KEY: "sk_test_operator_supplied",
      STRIPE_WEBHOOK_SECRET: "whsec_operator_supplied",
      STRIPE_PRO_MONTHLY_PRICE_ID: "price_operator_monthly",
      STRIPE_PRO_ANNUAL_PRICE_ID: "price_operator_annual",
    })

    expect(result.success).toBe(true)
  })
})
