import { redirect } from "next/navigation"
import { connection } from "next/server"

import { orpc } from "@/lib/orpc"
import { ORGANIZATIONS_PATH, workspaceHomePath } from "@/lib/workspace-paths"

/**
 * The `/home` entry point.
 *
 * The URL the application sends people to does not say which
 * organization they are in, so this page resolves it and sends them
 * where they belong: the workspace of their active organization, or
 * the organizations page when they have none.
 *
 * The query string survives the hop. A deep link into the workspace
 * is a real thing, so the parameters the request had are carried into
 * the destination by hand.
 */
export default async function HomeRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // The destination depends on the caller, so the page is rendered at
  // request time. Without this the build would prerender it, and the
  // session it reads would not be there.
  await connection()

  const params = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    // A parameter that repeats arrives as an array. The first value
    // is kept: the destination is a page, and the pages read the
    // parameters they know.
    const single = Array.isArray(value) ? value[0] : value
    if (typeof single === "string") query.set(key, single)
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ""

  const state = await orpc.organization.active()

  if (state.status === "active") {
    redirect(`${workspaceHomePath(state.organization.slug)}${suffix}`)
  }

  redirect(`${ORGANIZATIONS_PATH}${suffix}`)
}
