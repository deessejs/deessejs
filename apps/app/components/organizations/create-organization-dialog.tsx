"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { orpcBrowser } from "@/lib/orpc-browser"
import { workspaceHomePath } from "@/lib/workspace-paths"

/**
 * The refusals the creation procedure declares, in the words of the
 * page.
 *
 * The client throws the declared code, so the dialog reads the code
 * and not the message: the message is for the person, the code is
 * for the program.
 */
const CREATE_FAILED_MESSAGE = "The organization could not be created."

const REFUSALS: Record<string, string> = {
  ORGANIZATION_NAME_INVALID: "That name cannot be used.",
  ORGANIZATION_EMAIL_VERIFICATION_REQUIRED:
    "Verify your email before creating an organization.",
  ORGANIZATION_CREATE_IN_PROGRESS:
    "An organization is already being created for this account.",
  ORGANIZATION_CREATE_FAILED: CREATE_FAILED_MESSAGE,
}

/**
 * Creates an organization.
 *
 * The dialog is a client component, so it calls the browser client
 * and not the server one: the server client is a server module, and
 * the browser is on the same origin as the API, so the session
 * travels on its own.
 *
 * The caller gives a name and nothing else. The slug is the
 * server's, and the organization the server created is the one the
 * caller lands in.
 */
export function CreateOrganizationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (name.trim().length === 0) return
    setCreating(true)
    setError(null)
    try {
      const created = await orpcBrowser.organization.create({ name })
      setOpen(false)
      router.push(workspaceHomePath(created.slug))
    } catch (failure) {
      setCreating(false)
      if (failure instanceof ORPCError) {
        setError(REFUSALS[failure.code] ?? CREATE_FAILED_MESSAGE)
        return
      }
      setError(CREATE_FAILED_MESSAGE)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create an organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an organization</DialogTitle>
          <DialogDescription>
            The address of the organization is generated for you. The name is
            how it appears to the people who work in it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="organization-name">Name</Label>
          <Input
            id="organization-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme"
            autoComplete="off"
            maxLength={100}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={creating || name.trim().length === 0}
            onClick={handleCreate}
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
