import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { GitHubRepositoryBrowser } from "@/components/organizations/projects/github-repository-browser"
import {
  workspaceOrganizationSettingsPath,
  workspaceProjectsPath,
} from "@/lib/workspace-paths"

type GitHubInstallation = {
  accountLogin: string
}

export function OrganizationProjectImportPage({
  organizationSlug,
  organizationName,
  canManage,
  installation,
  githubAccountLinked,
  githubStatusUnavailable,
}: {
  organizationSlug: string
  organizationName: string
  canManage: boolean
  installation: GitHubInstallation | null
  githubAccountLinked: boolean
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
        <p
          className="rounded-md border p-4 text-sm text-muted-foreground"
          role="status"
        >
          Only organization owners and admins can import projects.
        </p>
      ) : (
        <>
          <ImportContent
            organizationSlug={organizationSlug}
            installation={installation}
            githubAccountLinked={githubAccountLinked}
            githubStatusUnavailable={githubStatusUnavailable}
            settingsPath={settingsPath}
          />
        </>
      )}
    </div>
  )
}

function ImportContent({
  organizationSlug,
  installation,
  githubAccountLinked,
  githubStatusUnavailable,
  settingsPath,
}: {
  organizationSlug: string
  installation: GitHubInstallation | null
  githubAccountLinked: boolean
  githubStatusUnavailable: boolean
  settingsPath: string
}) {
  if (githubStatusUnavailable) {
    return (
      <p
        className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        role="alert"
      >
        GitHub connection status could not be loaded. Refresh this page to try
        again.
      </p>
    )
  }

  if (!installation) {
    return (
      <ConnectGitHubState
        settingsPath={settingsPath}
        connection="installation"
      />
    )
  }

  if (!githubAccountLinked) {
    return (
      <ConnectGitHubState settingsPath={settingsPath} connection="account" />
    )
  }

  return (
    <GitHubRepositoryBrowser
      organizationSlug={organizationSlug}
      installationAccount={installation.accountLogin}
      settingsPath={settingsPath}
    />
  )
}

function ConnectGitHubState({
  settingsPath,
  connection,
}: {
  settingsPath: string
  connection: "account" | "installation"
}) {
  const isAccountConnection = connection === "account"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isAccountConnection
            ? "Connect your GitHub account"
            : "Install the GitHub App"}
        </CardTitle>
        <CardDescription>
          {isAccountConnection
            ? "Repository access is checked against your GitHub account and the organization installation."
            : "Install the GitHub App on a GitHub account before choosing a repository."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={settingsPath}>
            {isAccountConnection ? "Connect GitHub account" : "Manage GitHub"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
