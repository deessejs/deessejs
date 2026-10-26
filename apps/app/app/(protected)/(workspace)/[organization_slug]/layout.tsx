import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { ORPCError } from "@orpc/client"

import { readWorkspaceOrganization } from "@/lib/workspace-organization"

/**
 * Resolves the organization the page belongs to.
 *
 * The layout does not authorize: the API procedure does, and it
 * refuses a caller who does not belong to the organization they
 * named. The layout's only decision is what to render when the API
 * refuses, and a caller who is not a member gets the not-found page
 * rather than a leak of the organization's existence.
 */
export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ organization_slug: string }>
}) {
  const { organization_slug } = await params

  try {
    await readWorkspaceOrganization(organization_slug)
  } catch (error) {
    // Only the refusal becomes a not-found. A database outage or a
    // network failure is not the caller's problem with the URL, and
    // turning it into a 404 would hide it from the operator and from
    // the caller.
    if (
      error instanceof ORPCError &&
      error.code === "ORGANIZATION_ACCESS_DENIED"
    ) {
      notFound()
    }
    throw error
  }

  return <>{children}</>
}
