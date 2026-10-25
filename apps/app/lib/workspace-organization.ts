import { cache } from "react"

import { orpc } from "@/lib/orpc"

/**
 * The organization a workspace page belongs to.
 *
 * The read is cached for the request, so the layout and the page under
 * it ask the API once and not twice.
 *
 * The call refuses a caller who does not belong to the organization
 * they named. The layout turns that refusal into the not-found page,
 * and every other failure propagates: a database outage is not the
 * caller's problem with the URL.
 */
export const readWorkspaceOrganization = cache(async (slug: string) =>
  orpc.organization.bySlug({ slug }),
)
