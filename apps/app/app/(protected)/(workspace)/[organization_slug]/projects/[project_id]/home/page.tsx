import type { ReactNode } from "react"
import Link from "next/link"
import { ORPCError } from "@orpc/client"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { orpc } from "@/lib/orpc"
import { readWorkspaceOrganization } from "@/lib/workspace-organization"
import { workspaceProjectsPath } from "@/lib/workspace-paths"

type ProjectStatus =
  | "valid"
  | "needs_revalidation"
  | "configuration_invalid"
  | "access_unavailable"
  | "check_failed"

const projectStatus: Record<
  ProjectStatus,
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

export default async function ProjectHomePage({
  params,
}: {
  params: Promise<{ organization_slug: string; project_id: string }>
}) {
  const { organization_slug, project_id } = await params
  const [organization, result] = await Promise.all([
    readWorkspaceOrganization(organization_slug),
    orpc.githubApp.projects
      .get({ slug: organization_slug, projectId: project_id })
      .catch((error: unknown) => {
        if (error instanceof ORPCError && error.code === "PROJECT_NOT_FOUND") {
          notFound()
        }
        throw error
      }),
  ])
  const { project } = result
  const status = projectStatus[project.status]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href={workspaceProjectsPath(organization_slug)}>
          <ArrowLeftIcon aria-hidden />
          Back to projects
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{organization.name}</p>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <a
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
            href={project.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            {project.repositoryFullName}
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          </a>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Project configuration</CardTitle>
          <CardDescription>
            DeesseJS reads this configuration from the project repository.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
          <ProjectDetail label="Visibility">
            {project.isPrivate ? "Private repository" : "Public repository"}
          </ProjectDetail>
          <ProjectDetail label="Default branch">
            <code>{project.defaultBranch}</code>
          </ProjectDetail>
          <ProjectDetail label="Configuration file">
            <code>{project.configurationPath}</code>
          </ProjectDetail>
          <ProjectDetail label="Last reviewed">
            {project.lastCheckedAt
              ? dateFormatter.format(new Date(project.lastCheckedAt))
              : "Not reviewed yet"}
          </ProjectDetail>
          {project.commitSha ? (
            <ProjectDetail label="Reviewed revision">
              <code>{project.commitSha.slice(0, 12)}</code>
            </ProjectDetail>
          ) : null}
          {project.formatVersion !== null ? (
            <ProjectDetail label="Configuration version">
              <code>V{project.formatVersion}</code>
            </ProjectDetail>
          ) : null}
          {project.pathCount !== null ? (
            <ProjectDetail label="Project paths">
              {project.pathCount}
            </ProjectDetail>
          ) : null}
          {project.aliasCount !== null ? (
            <ProjectDetail label="Import aliases">
              {project.aliasCount}
            </ProjectDetail>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ProjectDetail({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
