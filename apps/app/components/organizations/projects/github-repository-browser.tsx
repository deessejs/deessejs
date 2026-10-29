"use client"

import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import { CheckIcon, ExternalLinkIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { orpcBrowser } from "@/lib/orpc-browser"
import type { ORPCBrowserClient } from "@/lib/orpc-browser"

type GitHubRepositoryPage = Awaited<
  ReturnType<ORPCBrowserClient["githubApp"]["repositories"]["list"]>
>

type GitHubRepository = GitHubRepositoryPage["repositories"][number]
type RepositoryQuery = UseQueryResult<GitHubRepositoryPage, Error>

export function GitHubRepositoryBrowser({
  organizationSlug,
  installationAccount,
  settingsPath,
}: {
  organizationSlug: string
  installationAccount: string
  settingsPath: string
}) {
  const [page, setPage] = useState(1)
  const [selectedRepository, setSelectedRepository] =
    useState<GitHubRepository | null>(null)
  const repositories = useQuery({
    queryKey: ["github-app", "repositories", organizationSlug, page],
    queryFn: () =>
      orpcBrowser.githubApp.repositories.list({
        slug: organizationSlug,
        page,
      }),
    retry: false,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Choose a GitHub Repository</CardTitle>
            <CardDescription>
              These repositories are available to your GitHub account through
              the connected installation.
            </CardDescription>
          </div>
          <Badge variant="secondary">Connected to {installationAccount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RepositoryQueryState
          query={repositories}
          page={page}
          onPageChange={setPage}
          selectedRepository={selectedRepository}
          onSelectRepository={setSelectedRepository}
          settingsPath={settingsPath}
        />
      </CardContent>
    </Card>
  )
}

function RepositoryQueryState({
  query,
  page,
  onPageChange,
  selectedRepository,
  onSelectRepository,
  settingsPath,
}: {
  query: RepositoryQuery
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
  selectedRepository: GitHubRepository | null
  onSelectRepository: (repository: GitHubRepository) => void
  settingsPath: string
}) {
  if (query.isPending) {
    return <RepositoryLoadingState />
  }

  if (query.isError) {
    return (
      <RepositoryErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        settingsPath={settingsPath}
      />
    )
  }

  return (
    <RepositoryResults
      pageData={query.data}
      page={page}
      onPageChange={onPageChange}
      selectedRepository={selectedRepository}
      onSelectRepository={onSelectRepository}
    />
  )
}

function RepositoryLoadingState() {
  return (
    <p
      className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground"
      aria-live="polite"
    >
      Loading repositories from GitHub…
    </p>
  )
}

function RepositoryErrorState({
  error,
  onRetry,
  settingsPath,
}: {
  error: Error
  onRetry: () => void
  settingsPath: string
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 px-4 py-8 text-center"
      role="alert"
    >
      <p className="text-sm text-destructive">{error.message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
        <Button variant="ghost" asChild>
          <Link href={settingsPath}>Manage GitHub connection</Link>
        </Button>
      </div>
    </div>
  )
}

function RepositoryResults({
  pageData,
  page,
  onPageChange,
  selectedRepository,
  onSelectRepository,
}: {
  pageData: GitHubRepositoryPage
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
  selectedRepository: GitHubRepository | null
  onSelectRepository: (repository: GitHubRepository) => void
}) {
  if (pageData.repositories.length === 0) {
    return <RepositoryEmptyState />
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {pageData.repositories.map((repository) => (
          <RepositoryListItem
            key={repository.id}
            repository={repository}
            isSelected={selectedRepository?.id === repository.id}
            onSelect={onSelectRepository}
          />
        ))}
      </ul>
      <SelectedRepositoryMessage repository={selectedRepository} />
      <RepositoryPagination
        pageData={pageData}
        page={page}
        onPageChange={onPageChange}
      />
    </>
  )
}

function RepositoryEmptyState() {
  return (
    <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
      No repositories are available to this GitHub account through the
      connected installation.
    </p>
  )
}

function RepositoryListItem({
  repository,
  isSelected,
  onSelect,
}: {
  repository: GitHubRepository
  isSelected: boolean
  onSelect: (repository: GitHubRepository) => void
}) {
  return (
    <li>
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <a
            className="flex w-fit max-w-full items-center gap-2 font-medium underline-offset-4 hover:underline"
            href={repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="truncate">{repository.fullName}</span>
            <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
          </a>
          {repository.description ? (
            <p className="text-sm text-muted-foreground">
              {repository.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {repository.isPrivate ? "Private" : "Public"}
            </Badge>
            <span>
              Default branch:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                {repository.defaultBranch}
              </code>
            </span>
          </div>
        </div>
        <Button
          className="shrink-0"
          variant={isSelected ? "secondary" : "outline"}
          aria-pressed={isSelected}
          onClick={() => onSelect(repository)}
        >
          {isSelected ? <CheckIcon aria-hidden /> : null}
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </li>
  )
}

function SelectedRepositoryMessage({
  repository,
}: {
  repository: GitHubRepository | null
}) {
  if (!repository) return null

  return (
    <p
      className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
      role="status"
    >
      <span className="font-medium">{repository.fullName}</span>{" "}
      is selected. Configuration review is the next step. This repository has
      not been imported.
    </p>
  )
}

function RepositoryPagination({
  pageData,
  page,
  onPageChange,
}: {
  pageData: GitHubRepositoryPage
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}) {
  if (pageData.totalCount <= pageData.perPage) {
    return (
      <p className="text-sm text-muted-foreground">
        {pageData.totalCount.toLocaleString("en-US")}{" "}
        {pageData.totalCount === 1 ? "repository" : "repositories"}
      </p>
    )
  }

  const firstRepositoryNumber = (page - 1) * pageData.perPage + 1
  const lastRepositoryNumber = Math.min(
    page * pageData.perPage,
    pageData.totalCount
  )

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
      aria-label="Repository pagination"
    >
      <p className="text-sm text-muted-foreground">
        Showing {firstRepositoryNumber}–{lastRepositoryNumber} of{" "}
        {pageData.totalCount.toLocaleString("en-US")} repositories
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page * pageData.perPage >= pageData.totalCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
