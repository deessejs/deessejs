"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { authClient } from "@/lib/auth-client"
import { workspaceHomePath } from "@/lib/workspace-paths"
import { CreateOrganizationDialog } from "./create-organization-dialog"

/**
 * The caller's own organizations, and the way forward when they have
 * none.
 *
 * The list comes from the plugin's own endpoint, which answers the
 * caller's organizations and carries no authorization decision. The
 * page renders it in the browser, so the "do they have any" decision
 * is a browser-side one too.
 *
 * The page never repairs the selection by itself. The caller picks,
 * and the pick calls the endpoint that owns that write, so the session
 * is never rewritten behind the caller's back.
 */
export function OrganizationPicker({ stale }: { stale: boolean }) {
  const router = useRouter()
  const organizations = authClient.useListOrganizations()
  const [failure, setFailure] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  if (organizations.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (organizations.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Your organizations could not be loaded.
      </p>
    )
  }

  const list = organizations.data ?? []

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {stale
            ? "Your previous organization is gone"
            : "You have no organization yet"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stale
            ? "The organization your session pointed at is no longer one you belong to. Pick one of the organizations below."
            : "An organization holds the work your account shares with other people. Create one to get started."}
        </p>
      </header>

      {failure && (
        <p className="text-sm text-destructive" role="alert">
          {failure}
        </p>
      )}

      {list.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {list.map((organization) => (
            <li key={organization.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{organization.name}</CardTitle>
                  <CardDescription>/{organization.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    onClick={() => choose(organization.id, organization.slug)}
                  >
                    Open {organization.name}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Button onClick={() => setDialogOpen(true)}>
          Create an organization
        </Button>
      )}

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
