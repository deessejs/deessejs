import Link from "next/link"
import { ArrowLeftIcon, FolderGit2Icon } from "lucide-react"

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
  workspaceOrganizationSettingsPath,
  workspaceProjectsPath,
} from "@/lib/workspace-paths"

type GitHubInstallation = {
  accountLogin: string
}

const steps = [
  { label: "Choose Repository", number: 1 },
  { label: "Review Configuration", number: 2 },
  { label: "Confirm Import", number: 3 },
]

export function OrganizationProjectImportPage({
  organizationSlug,
  organizationName,
  canManage,
  installation,
  githubStatusUnavailable,
}: {
  organizationSlug: string
  organizationName: string
  canManage: boolean
  installation: GitHubInstallation | null
  githubStatusUnavailable: boolean
}) {
  const settingsPath = workspaceOrganizationSettingsPath(organizationSlug)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" asChild className="w-fit px-0">
          <Link href={workspaceProjectsPath(organizationSlug)}>
            <ArrowLeftIcon aria-hidden />
            Back to Projects
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Import Project</h1>
          <p className="text-sm text-muted-foreground">
            Add a GitHub project to {organizationName}.
          </p>
        </div>
      </header>

      {!canManage ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground" role="status">
          Only organization owners and admins can import projects.
        </p>
      ) : (
        <>
          <ImportSteps />
          {githubStatusUnavailable ? (
            <p
              className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
              role="alert"
            >
              GitHub connection status could not be loaded. Refresh this page to
              try again.
            </p>
          ) : installation ? (
            <RepositoryDiscoveryState
              installation={installation}
              settingsPath={settingsPath}
            />
          ) : (
            <ConnectGitHubState settingsPath={settingsPath} />
          )}
        </>
      )}
    </div>
  )
}

function ImportSteps() {
  return (
    <ol
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Project import steps"
    >
      {steps.map((step) => (
        <li
          key={step.number}
          aria-current={step.number === 1 ? "step" : undefined}
          className={
            step.number === 1
              ? "flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-4"
              : "flex items-center gap-3 rounded-lg border p-4 text-muted-foreground"
          }
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium">
            {step.number}
          </span>
          <span className="text-sm font-medium">{step.label}</span>
        </li>
      ))}
    </ol>
  )
}

function ConnectGitHubState({ settingsPath }: { settingsPath: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect a GitHub App installation</CardTitle>
        <CardDescription>
          Connect GitHub to this organization before choosing a repository.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={settingsPath}>Connect GitHub</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function RepositoryDiscoveryState({
  installation,
  settingsPath,
}: {
  installation: GitHubInstallation
  settingsPath: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Choose a GitHub Repository</CardTitle>
            <CardDescription>
              Select a repository to inspect its DeesseJS project configuration.
            </CardDescription>
          </div>
          <Badge variant="secondary">
            Connected to {installation.accountLogin}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
          <FolderGit2Icon
            className="size-8 text-muted-foreground"
            aria-hidden
          />
          <h2 className="text-base font-semibold">
            Repository discovery is the next step
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            The GitHub installation is connected. The repository list will
            appear here when the dashboard can load repositories authorized for
            your GitHub account.
          </p>
          <Button variant="outline" asChild>
            <Link href={settingsPath}>Manage GitHub connection</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
