"use client"

import { queryOptions } from "@tanstack/react-query"

import { orpcBrowser } from "@/lib/orpc-browser"

export const organizationProjectsQueryKey = (organizationSlug: string) =>
  ["github-app", "projects", organizationSlug] as const

export const organizationProjectQueryKey = (
  organizationSlug: string,
  projectId: string
) => ["github-app", "project", organizationSlug, projectId] as const

export function organizationProjectsQueryOptions(organizationSlug: string) {
  return queryOptions({
    queryKey: organizationProjectsQueryKey(organizationSlug),
    queryFn: () => orpcBrowser.githubApp.projects.list({ slug: organizationSlug }),
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
      orpcBrowser.githubApp.projects.get({ slug: organizationSlug, projectId }),
    retry: false,
  })
}
