const ORGANIZATION_SUBSCRIPTION_PATHS = new Set([
  "/subscription/upgrade",
  "/subscription/list",
  "/subscription/cancel",
  "/subscription/restore",
  "/subscription/billing-portal",
])

/** Stripe subscription endpoints in this product must be organization-scoped. */
export function isPersonalSubscriptionRequest(
  path: string,
  customerType: unknown
): boolean {
  return (
    ORGANIZATION_SUBSCRIPTION_PATHS.has(path) && customerType !== "organization"
  )
}
