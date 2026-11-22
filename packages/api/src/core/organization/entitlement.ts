import { hasOrganizationProEntitlement } from "@workspace/auth/organization/entitlement"
import type { BaseContext } from "../../orpc/base-context.js"

/** Uses only the server-backed active organization and re-checks membership. */
export async function callerHasActiveOrganizationPro(
  context: BaseContext
): Promise<boolean> {
  const userId = context.user?.id
  const organizationId = context.session?.activeOrganizationId
  if (!userId || !organizationId) return false
  return hasOrganizationProEntitlement(userId, organizationId)
}
