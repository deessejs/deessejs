export type OrganizationBillingState =
  | "loading"
  | "unavailable"
  | "empty"
  | "subscribed"

export function organizationBillingState(input: {
  isPending: boolean
  isError: boolean
  subscriptionCount: number
}): OrganizationBillingState {
  if (input.isPending) return "loading"
  if (input.isError) return "unavailable"
  return input.subscriptionCount === 0 ? "empty" : "subscribed"
}
