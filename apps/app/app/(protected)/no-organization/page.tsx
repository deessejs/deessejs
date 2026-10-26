import { redirect } from "next/navigation"
import { connection } from "next/server"

import { orpc } from "@/lib/orpc"
import { workspaceHomePath } from "@/lib/workspace-paths"
import { OrganizationPicker } from "@/components/organizations/organization-picker"

/**
 * The empty state.
 *
 * The page is where a caller with no organization lands. The server
 * reads the active organization, and it knows one thing the client
 * does not: whether the session points at an organization the caller
 * has left. That is the stale case, and it is the only thing the
 * server contributes here.
 *
 * The page never repairs the selection by itself. The caller picks,
 * and the pick calls the endpoint that owns that write.
 */
export default async function NoOrganizationPage() {
  // The page answers for the caller, so it is rendered at request
  // time. Without this the build would prerender it, and the session
  // it reads would not be there.
  await connection()

  const state = await orpc.organization.active()

  if (state.status === "active") {
    redirect(workspaceHomePath(state.organization.slug))
  }

  return <OrganizationPicker stale={state.status === "stale"} />
}
