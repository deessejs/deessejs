"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { CardGridSkeleton } from "@/components/loading/page-skeleton"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { BoxesIcon, PlusIcon, SearchIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { workspaceHomePath } from "@/lib/workspace-paths"
import { CreateOrganizationDialog } from "./create-organization-dialog"

/**
 * The caller's organizations.
 *
 * The list comes from the plugin's own endpoint, which answers the
 * caller's organizations and carries no authorization decision. The
 * page renders it in the browser, so the "which ones" decision is a
 * browser-side one too.
 *
 * The page never repairs the selection by itself. The caller picks,
 * and the pick calls the endpoint that owns that write, so the
 * session is never rewritten behind the caller's back.
 */
export function OrganizationList() {
  const router = useRouter()
  const organizations = authClient.useListOrganizations()
  const [query, setQuery] = useState("")
  const [failure, setFailure] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const list = organizations.data ?? []

  const needle = query.trim().toLowerCase()
  const filtered =
    needle.length === 0
      ? list
      : list.filter(
          (organization) =>
            organization.name.toLowerCase().includes(needle) ||
            organization.slug.toLowerCase().includes(needle)
        )

  async function choose(organizationId: string, slug: string) {
    setFailure(null)
    try {
      const { error: refusal } = await authClient.organization.setActive({
        organizationId,
      })
      if (refusal) {
        setFailure(refusal.message ?? "The organization could not be selected.")
        return
      }
    } catch {
      // The call never came back. The browser cannot tell that apart
      // from a refusal, and neither can the caller.
      setFailure("The organization could not be selected.")
      return
    }
    router.push(workspaceHomePath(slug))
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-6 xl:px-10">
      <div className="flex w-full flex-col gap-y-4 pt-12 pb-6">
        <h1 className="sr-only">Organizations</h1>

        <div className="flex items-center justify-between gap-x-2 md:gap-x-3">
          <InputGroup className="w-full md:w-64">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search for an organization"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon aria-hidden />
            New organization
          </Button>
        </div>

        {failure && (
          <p className="text-sm text-destructive" role="alert">
            {failure}
          </p>
        )}

        {organizations.isPending && (
          <CardGridSkeleton label="Loading organizations" count={3} />
        )}

        {organizations.error && (
          <p className="text-sm text-destructive" role="alert">
            Your organizations could not be loaded.
          </p>
        )}

        {!organizations.isPending && !organizations.error && (
          <p className="text-sm text-muted-foreground">
            {list.length === 0
              ? "You have no organization yet. Create one to get started."
              : filtered.length === 0
                ? "No organization matches your search."
                : ""}
          </p>
        )}

        {filtered.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((organization) => (
              <Button
                key={organization.id}
                variant="ghost"
                onClick={async () => {
                  await choose(organization.id, organization.slug)
                }}
                className="h-auto min-h-[70px] w-full justify-start gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground hover:bg-muted/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                  <BoxesIcon className="size-[18px]" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="truncate text-sm font-medium">
                    {organization.name}
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    /{organization.slug}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          // The creation goes through the API and not through the
          // plugin's own endpoint, so the plugin's listener never
          // fires and the list has to be refreshed by hand.
          void organizations.refetch()
        }}
      />
    </div>
  )
}
