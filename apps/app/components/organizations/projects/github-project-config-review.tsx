"use client"

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

import type { ORPCBrowserClient } from "@/lib/orpc-browser"

type ProjectConfigInspection = Awaited<
  ReturnType<
    ORPCBrowserClient["githubApp"]["repositories"]["inspectConfiguration"]
  >
>
type InvalidProjectConfig = Extract<
  ProjectConfigInspection["configuration"],
  { status: "invalid" }
>
type ProjectConfigInspectionQuery = UseQueryResult<
  ProjectConfigInspection,
  Error
>

export function GitHubProjectConfigReview({
  repositoryName,
  isPrivate,
  query,
  onRetry,
  onImport,
  importPending,
  importError,
}: {
  repositoryName: string | null
  isPrivate: boolean
  query: ProjectConfigInspectionQuery
  onRetry: () => void
  onImport: () => void
  importPending: boolean
  importError: string | null
}) {
  if (!repositoryName) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Configuration</CardTitle>
        <CardDescription>
          Inspecting the root deesse.json in {repositoryName} at its default
          branch. The file is read at a pinned commit and its raw contents stay
          on the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectConfigInspectionState
          query={query}
          onRetry={onRetry}
          isPrivate={isPrivate}
          onImport={onImport}
          importPending={importPending}
          importError={importError}
        />
      </CardContent>
    </Card>
  )
}

function ProjectConfigInspectionState({
  query,
  onRetry,
  isPrivate,
  onImport,
  importPending,
  importError,
}: {
  query: ProjectConfigInspectionQuery
  onRetry: () => void
  isPrivate: boolean
  onImport: () => void
  importPending: boolean
  importError: string | null
}) {
  if (query.isPending) {
    return (
      <p
        className="rounded-lg border px-4 py-6 text-sm text-muted-foreground"
        aria-live="polite"
      >
        Reading and validating deesse.json…
      </p>
    )
  }

  if (query.isError) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 p-4"
        role="alert"
      >
        <p className="text-sm text-destructive">{query.error.message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry inspection
        </Button>
      </div>
    )
  }

  if (!query.data) return null
  return (
    <ProjectConfigInspectionResult
      result={query.data}
      isPrivate={isPrivate}
      onImport={onImport}
      importPending={importPending}
      importError={importError}
      onRetry={onRetry}
    />
  )
}

function ProjectConfigInspectionResult({
  result,
  isPrivate,
  onImport,
  importPending,
  importError,
  onRetry,
}: {
  result: ProjectConfigInspection
  isPrivate: boolean
  onImport: () => void
  importPending: boolean
  importError: string | null
  onRetry: () => void
}) {
  switch (result.configuration.status) {
    case "valid":
      return (
        <ValidConfigurationResult
          result={result}
          isPrivate={isPrivate}
          onImport={onImport}
          importPending={importPending}
          importError={importError}
          onRetry={onRetry}
        />
      )
    case "invalid":
      return (
        <InvalidConfigurationResult
          diagnostics={result.configuration.diagnostics}
          commitSha={result.commitSha}
        />
      )
    case "invalid_json":
      return (
        <ConfigurationMessage
          title="Invalid JSON"
          description="The root deesse.json is not valid JSON."
          commitSha={result.commitSha}
          role="alert"
        />
      )
    case "missing":
      return (
        <ConfigurationMessage
          title="Configuration file not found"
          description="No deesse.json was found at the repository root on its default branch."
          commitSha={result.commitSha}
          role="status"
        />
      )
    case "too_large":
      return (
        <ConfigurationMessage
          title="Configuration file is too large"
          description="The root deesse.json exceeds the 64 KiB inspection limit."
          commitSha={result.commitSha}
          role="alert"
        />
      )
    case "no_default_branch":
      return (
        <ConfigurationMessage
          title="No default branch"
          description="GitHub has not set a default branch for this repository yet."
          commitSha={null}
          role="status"
        />
      )
  }
}

function ValidConfigurationResult({
  result,
  isPrivate,
  onImport,
  importPending,
  importError,
  onRetry,
}: {
  result: ProjectConfigInspection
  isPrivate: boolean
  onImport: () => void
  importPending: boolean
  importError: string | null
  onRetry: () => void
}) {
  if (result.configuration.status !== "valid") return null

  const { configuration } = result
  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Valid configuration</Badge>
        <span className="text-sm text-muted-foreground">
          DeesseJS project configuration V{configuration.formatVersion}
        </span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Default branch revision</dt>
          <dd>
            <code className="break-all">{result.commitSha}</code>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Project paths</dt>
          <dd>{configuration.pathCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Import aliases</dt>
          <dd>{configuration.aliasCount}</dd>
        </div>
      </dl>
      {configuration.pathCount === 0 && configuration.aliasCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom project paths or aliases are configured.
        </p>
      ) : null}
      <p className="border-t pt-3 text-sm text-muted-foreground">
        Importing shares the repository name, link, configuration path, default
        branch, commit, and validation summary with members of this DeesseJS
        organization. Repository files and raw configuration contents stay on
        GitHub.
      </p>
      {isPrivate ? (
        <p className="text-sm text-muted-foreground">
          This is a private repository. Members will see its project metadata;
          GitHub still controls who can open the repository.
        </p>
      ) : null}
      {importError ? (
        <div className="flex flex-col items-start gap-3" role="alert">
          <p className="text-sm text-destructive">{importError}</p>
          <Button variant="outline" onClick={onRetry} disabled={importPending}>
            Review latest configuration
          </Button>
        </div>
      ) : null}
      <div className="flex justify-end border-t pt-3">
        <Button onClick={onImport} disabled={importPending}>
          {importPending ? "Importing project…" : "Confirm Import"}
        </Button>
      </div>
    </div>
  )
}

function InvalidConfigurationResult({
  diagnostics,
  commitSha,
}: {
  diagnostics: InvalidProjectConfig["diagnostics"]
  commitSha: string | null
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4"
      role="alert"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="destructive">Invalid configuration</Badge>
        {commitSha ? (
          <code className="text-xs break-all text-muted-foreground">
            {commitSha}
          </code>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Fix these validation issues in the repository before importing it.
      </p>
      <ul className="flex flex-col gap-2">
        {diagnostics.map((diagnostic) => (
          <li
            key={`${diagnostic.code}-${diagnostic.path.join(".") || "deesse.json"}-${diagnostic.message}`}
            className="text-sm"
          >
            <code className="rounded bg-muted px-1 py-0.5">
              {diagnostic.path.length > 0
                ? diagnostic.path.join(".")
                : "deesse.json"}
            </code>
            <span>: {diagnostic.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConfigurationMessage({
  title,
  description,
  commitSha,
  role,
}: {
  title: string
  description: string
  commitSha: string | null
  role: "alert" | "status"
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" role={role}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={role === "alert" ? "destructive" : "secondary"}>
          {title}
        </Badge>
        {commitSha ? (
          <code className="text-xs break-all text-muted-foreground">
            {commitSha}
          </code>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
