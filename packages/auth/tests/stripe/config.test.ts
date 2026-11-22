import { describe, expect, it } from "vitest"

import { createStripePlugin } from "../../src/stripe/config.js"

describe("optional Stripe plugin configuration", () => {
  it("leaves Stripe disabled when all Stripe environment values are absent", () => {
    expect(createStripePlugin({})).toBeNull()
  })

  it("builds the organization subscription plugin from operator supplied values", () => {
    const plugin = createStripePlugin({
      STRIPE_SECRET_KEY: "sk_test_operator_value",
      STRIPE_WEBHOOK_SECRET: "whsec_operator_value",
      STRIPE_PRO_MONTHLY_PRICE_ID: "price_operator_monthly",
    })

    expect(plugin).not.toBeNull()
    expect(plugin?.id).toBe("stripe")
    expect(plugin?.endpoints).toHaveProperty("upgradeSubscription")
  })
})
