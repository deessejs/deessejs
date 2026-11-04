import { hasManagingRole } from "./roles.js"

export type OrganizationBillingAction =
  | "upgrade-subscription"
  | "list-subscription"
  | "cancel-subscription"
  | "restore-subscription"
  | "billing-portal"

/** Members may read their organization's subscription; managers may mutate it. */
export function canAccessOrganizationBilling(
  role: string | null | undefined,
  action: OrganizationBillingAction,
): boolean {
  if (!role) return false
  if (action === "list-subscription") return true
  return hasManagingRole(role)
}
