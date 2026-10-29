"use client"

import { queryOptions } from "@tanstack/react-query"

import { orpcBrowser } from "@/lib/orpc-browser"

export const organizationProjectsQueryKey = (organizationSlug: string) =>
  ["github-app", "projects", organizationSlug] as const

export function organizationProjectsQueryOptions(organizationSlug: string) {
  return queryOptions({
    queryKey: organizationProjectsQueryKey(organizationSlug),
    queryFn: () => orpcBrowser.githubApp.projects.list({ slug: organizationSlug }),
    retry: false,
  })
}
