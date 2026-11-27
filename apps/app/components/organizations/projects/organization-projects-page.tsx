"use client"

import Link from "next/link"
import { client } from "@/lib/client"
import { FolderGit2Icon, PlusIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { UseQueryResult } from "@tanstack/react-query"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { CardGridSkeleton } from "@/components/loading/page-skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group"
import { SearchIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
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
  ReturnType<(typeof client.rpc)["githubApp"]["projects"]["list"]>
>

const projectStatus: Record<
  OrganizationProject["status"],
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  valid: { label: "Valid", variant: "secondary" },
  needs_revalidation: { label: "Needs revalidation", variant: "outline" },
  configuration_invalid: {
    label: "Configuration invalid",
    variant: "destructive",
  },
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
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1>
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
    return <CardGridSkeleton label="Loading projects" count={3} />
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
      <FolderGit2Icon className="size-8 text-muted-foreground" aria-hidden />
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
  const [statusFilter, setStatusFilter] = useState<"all" | "attention" | "valid">("all")
  const [search, setSearch] = useState("")
  const counts = useMemo(() => ({
    all: projects.length,
    attention: projects.filter((project) => project.status !== "valid").length,
    valid: projects.filter((project) => project.status === "valid").length,
  }), [projects])
  const visibleProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || (statusFilter === "valid" ? project.status === "valid" : project.status !== "valid")
      const matchesSearch = !term || `${project.name} ${project.repositoryFullName}`.toLocaleLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [projects, search, statusFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <TabsList variant="line" aria-label="Filter projects by status" className="h-auto w-full justify-start gap-5 rounded-none p-0 sm:w-fit">
            {(["all", "attention", "valid"] as const).map((filter) => (
              <TabsTrigger key={filter} value={filter} className="h-auto flex-none justify-start gap-2 rounded-none px-1 pb-3 pt-1">
                {filter === "all" ? "All projects" : filter === "attention" ? "Needs attention" : "Valid"}<span className="font-mono text-xs tabular-nums">{counts[filter]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <InputGroup className="mb-2 w-full sm:mb-2 sm:max-w-sm">
          <InputGroupAddon><SearchIcon aria-hidden /></InputGroupAddon>
          <InputGroupInput aria-label="Search projects" placeholder="Search by project or repository" value={search} onChange={(event) => setSearch(event.target.value)} />
        </InputGroup>
      </div>
      {visibleProjects.length === 0 ? <p className="rounded-md border px-5 py-10 text-center text-sm text-muted-foreground">No projects match these filters.</p> : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {visibleProjects.map((project) => {
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
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.repositoryFullName}
                      </Link>
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
    </ul>}
    </div>
  )
}
