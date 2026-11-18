"use client"

import { client } from "@/lib/client"
import { queryOptions } from "@tanstack/react-query"

export const organizationProjectsQueryKey = (organizationSlug: string) =>
  ["github-app", "projects", organizationSlug] as const

export const organizationProjectQueryKey = (
  organizationSlug: string,
  projectId: string
) => ["github-app", "project", organizationSlug, projectId] as const

export function organizationProjectsQueryOptions(organizationSlug: string) {
  return queryOptions({
    queryKey: organizationProjectsQueryKey(organizationSlug),
    queryFn: () => client.rpc.githubApp.projects.list({ slug: organizationSlug }),
    retry: false,
  })
}

export function organizationProjectQueryOptions(
  organizationSlug: string,
  projectId: string
) {
  return queryOptions({
    queryKey: organizationProjectQueryKey(organizationSlug, projectId),
    queryFn: () =>
      client.rpc.githubApp.projects.get({ slug: organizationSlug, projectId }),
    retry: false,
  })
}
