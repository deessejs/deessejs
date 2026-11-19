import { stripe } from "@better-auth/stripe"
import type { BetterAuthPlugin } from "better-auth"
import Stripe from "stripe"

import { authorizeOrganizationBilling } from "../organization/billing-authorization.js"

export type StripeBillingEnvironment = {
  STRIPE_SECRET_KEY?: string | undefined
  STRIPE_WEBHOOK_SECRET?: string | undefined
  STRIPE_PRO_MONTHLY_PRICE_ID?: string | undefined
  STRIPE_PRO_ANNUAL_PRICE_ID?: string | undefined
}

const REQUIRED_STRIPE_CONFIGURATION = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_ANNUAL_PRICE_ID",
] as const

/**
 * Builds the Stripe plugin only when every operator-supplied value exists.
 * The environment schema rejects partial configuration; returning `null`
 * for an unconfigured environment keeps the auth instance usable in dev and
 * test without Stripe credentials or product setup.
 */
export function createStripePlugin(
  env: StripeBillingEnvironment
): BetterAuthPlugin | null {
  if (REQUIRED_STRIPE_CONFIGURATION.some((key) => !env[key])) return null

  const secretKey = env.STRIPE_SECRET_KEY
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  const monthlyPriceId = env.STRIPE_PRO_MONTHLY_PRICE_ID
  const annualPriceId = env.STRIPE_PRO_ANNUAL_PRICE_ID

  if (!secretKey || !webhookSecret || !monthlyPriceId || !annualPriceId) {
    return null
  }

  return stripe({
    stripeClient: new Stripe(secretKey),
    stripeWebhookSecret: webhookSecret,
    organization: { enabled: true },
    subscription: {
      enabled: true,
      plans: [
        {
          name: "pro",
          priceId: monthlyPriceId,
          annualDiscountPriceId: annualPriceId,
        },
      ],
      authorizeReference: async ({ user, referenceId, action }) =>
        authorizeOrganizationBilling(user.id, referenceId, action),
    },
  })
}
