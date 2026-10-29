"use client"

import Link from "next/link"
import { FolderGit2Icon, PlusIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  workspaceProjectHomePath,
  workspaceProjectImportPath,
} from "@/lib/workspace-paths"
import { organizationProjectsQueryOptions } from "@/lib/github-projects-query"
import type { ORPCBrowserClient } from "@/lib/orpc-browser"

export type OrganizationProject = {
  id: string
  name: string
  repositoryFullName: string
  repositoryUrl: string
  repositoryId: string
  isPrivate: boolean
  configurationPath: string
  defaultBranch: string
  status:
    | "valid"
    | "needs_revalidation"
    | "configuration_invalid"
    | "access_unavailable"
    | "check_failed"
  lastCheckedAt: string | null
}

type OrganizationProjectsResult = Awaited<
  ReturnType<ORPCBrowserClient["githubApp"]["projects"]["list"]>
>

const projectStatus: Record<
  OrganizationProject["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  valid: { label: "Valid", variant: "secondary" },
  needs_revalidation: { label: "Needs revalidation", variant: "outline" },
  configuration_invalid: { label: "Configuration invalid", variant: "destructive" },
  access_unavailable: { label: "Access unavailable", variant: "outline" },
  check_failed: { label: "Check failed", variant: "outline" },
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function OrganizationProjectsPage({
  organizationSlug,
  organizationName,
  canManage,
  projects,
}: {
  organizationSlug: string
  organizationName: string
  canManage: boolean
  projects: OrganizationProject[] | null
}) {
  const projectsQuery = useQuery({
    ...organizationProjectsQueryOptions(organizationSlug),
    initialData: { projects: projects ?? [] },
    initialDataUpdatedAt: 0,
  })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Projects imported from GitHub for {organizationName}.
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={workspaceProjectImportPath(organizationSlug)}>
              <PlusIcon aria-hidden />
              Import Project
            </Link>
          </Button>
        ) : null}
      </header>

      <ProjectsQueryState
        query={projectsQuery}
        initialLoad={projects === null}
        organizationSlug={organizationSlug}
        canManage={canManage}
      />
    </div>
  )
}

function ProjectsQueryState({
  query,
  initialLoad,
  organizationSlug,
  canManage,
}: {
  query: UseQueryResult<OrganizationProjectsResult, Error>
  initialLoad: boolean
  organizationSlug: string
  canManage: boolean
}) {
  if (query.isPending || (initialLoad && query.isFetching)) {
    return (
      <p className="rounded-md border p-4 text-sm text-muted-foreground">
        Loading projects…
      </p>
    )
  }
  if (query.isError) {
    return (
      <p
        className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        role="alert"
      >
        Projects could not be loaded. Refresh this page to try again.
      </p>
    )
  }
  if (query.data.projects.length === 0) {
    return (
      <EmptyProjects
        organizationSlug={organizationSlug}
        canManage={canManage}
      />
    )
  }
  return (
    <ProjectList
      organizationSlug={organizationSlug}
      projects={query.data.projects}
    />
  )
}

function EmptyProjects({
  organizationSlug,
  canManage,
}: {
  organizationSlug: string
  canManage: boolean
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <FolderGit2Icon
        className="size-8 text-muted-foreground"
        aria-hidden
      />
      <h2 className="text-lg font-semibold">No projects yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {canManage
          ? "Import an existing GitHub project to make it available in this organization."
          : "An organization owner or admin can import the first project."}
      </p>
      {canManage ? (
        <Button asChild>
          <Link href={workspaceProjectImportPath(organizationSlug)}>
            <PlusIcon aria-hidden />
            Import Your First Project
          </Link>
        </Button>
      ) : null}
    </section>
  )
}

function ProjectList({
  organizationSlug,
  projects,
}: {
  organizationSlug: string
  projects: OrganizationProject[]
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const status = projectStatus[project.status]
        return (
          <li key={project.id}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={workspaceProjectHomePath(
                          organizationSlug,
                          project.id
                        )}
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1 truncate">
                      <a
                        className="underline-offset-4 hover:underline"
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.repositoryFullName}
                      </a>
                    </CardDescription>
                    {project.isPrivate ? (
                      <Badge variant="outline" className="mt-2">
                        Private repository
                      </Badge>
                    ) : null}
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p className="truncate">
                  Configuration:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                    {project.configurationPath}
                  </code>
                </p>
                <p className="truncate">
                  Default branch:{" "}
                  <span className="font-medium text-foreground">
                    {project.defaultBranch}
                  </span>
                </p>
                <p>
                  Last checked:{" "}
                  {project.lastCheckedAt
                    ? dateFormatter.format(new Date(project.lastCheckedAt))
                    : "Not checked yet"}
                </p>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
