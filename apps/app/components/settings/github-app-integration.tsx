"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { orpcBrowser } from "@/lib/orpc-browser"
import { API_BASE_PATH } from "@workspace/api/base-path"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type GitHubAppStatus = {
  installation: {
    accountLogin: string
    accountType: string
    connectedAt: string
  } | null
  githubAccountLinked: boolean
  canManage: boolean
  appConfigured: boolean
}

const resultMessages: Record<string, string> = {
  connected: "The GitHub App is connected to this organization.",
  accountConnected: "GitHub account connected. Continue by installing the app.",
  cancelled: "GitHub installation was cancelled.",
  reauthenticate:
    "Your session expired. Sign in and start the installation again.",
  githubAccountRequired: "Connect a GitHub account before installing the app.",
  oauthDenied: "GitHub account authorization was cancelled.",
  oauthError: "GitHub account authorization could not be completed. Try again.",
  notConfigured:
    "GitHub App credentials are not configured on this environment.",
  installationNotAccessible:
    "This GitHub account cannot access the selected installation.",
  installationCheckFailed:
    "GitHub could not verify this installation. Try again in a moment.",
  error: "GitHub installation could not be completed. Try again.",
}

function InstallationSummary({
  installation,
  canManage,
}: Pick<GitHubAppStatus, "installation" | "canManage">) {
  return (
    <>
      {installation ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            Connected to {installation.accountLogin}
          </p>
          <p className="text-sm text-muted-foreground">
            GitHub {installation.accountType.toLowerCase()} installation
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No GitHub installation connected.
        </p>
      )}
      {installation && canManage ? (
        <p className="text-xs text-muted-foreground">
          Disconnecting removes the link from DeesseJS. The installation remains
          active in GitHub.
        </p>
      ) : null}
    </>
  )
}

function GitHubAppActions({
  status,
  pending,
  onConnect,
  onInstall,
  onDisconnect,
}: {
  status: GitHubAppStatus
  pending: boolean
  onConnect: () => void
  onInstall: () => void
  onDisconnect: () => void
}) {
  if (!status.canManage) return null
  if (!status.appConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        GitHub App credentials are not configured on this environment.
      </p>
    )
  }
  if (!status.githubAccountLinked) {
    return (
      <Button onClick={onConnect} disabled={pending}>
        {pending ? "Redirecting…" : "Connect GitHub account"}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onInstall} disabled={pending}>
        {pending
          ? "Redirecting…"
          : status.installation
            ? "Change installation"
            : "Install GitHub App"}
      </Button>
      {status.installation ? (
        <Button variant="outline" onClick={onDisconnect} disabled={pending}>
          Disconnect
        </Button>
      ) : null}
    </div>
  )
}

export function GitHubAppIntegration({
  slug,
  status,
  result,
}: {
  slug: string
  status: GitHubAppStatus
  result: string | undefined
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  function connectGitHubAccount() {
    setPending(true)
    const url = new URL(
      `${API_BASE_PATH}/github-app/oauth/start`,
      window.location.origin
    )
    url.searchParams.set("slug", slug)
    window.location.assign(url.toString())
  }

  async function installGitHubApp() {
    setPending(true)
    const url = new URL(
      `${API_BASE_PATH}/github-app/install/start`,
      window.location.origin
    )
    url.searchParams.set("slug", slug)
    window.location.assign(url.toString())
  }

  async function disconnectGitHubApp() {
    setPending(true)
    try {
      await orpcBrowser.githubApp.disconnect({ slug })
      toast.success("GitHub App disconnected from this organization")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not disconnect GitHub App"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub</CardTitle>
        <CardDescription>
          Connect a GitHub App installation to this DeesseJS organization. To
          import a repository, open the Projects page for this organization. Only
          organization owners and admins can import projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {result && resultMessages[result] ? (
          <p role="status" className="text-sm text-muted-foreground">
            {resultMessages[result]}
          </p>
        ) : null}

        <InstallationSummary
          installation={status.installation}
          canManage={status.canManage}
        />
        <GitHubAppActions
          status={{
            ...status,
            githubAccountLinked:
              status.githubAccountLinked && result !== "githubAccountRequired",
          }}
          pending={pending}
          onConnect={connectGitHubAccount}
          onInstall={() => void installGitHubApp()}
          onDisconnect={() => void disconnectGitHubApp()}
        />
      </CardContent>
    </Card>
  )
}
