"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { ORPCError } from "@orpc/client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function SubmitOrganizationBlockDialog({
  open,
  onOpenChange,
  organizationSlug,
  block,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationSlug: string
  block: { id: string; name: string; sourceCommit: string }
  onSubmitted: () => void
}) {
  const [ref, setRef] = useState("HEAD")
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) {
      setRef("HEAD")
      setFailure(null)
    }
    onOpenChange(next)
  }

  async function submit() {
    setFailure(null)
    setSubmitting(true)
    try {
      await client.rpc.organization.blocks.submit({
        organizationSlug,
        blockId: block.id,
        ref: ref.trim() || "HEAD",
      })
      onOpenChange(false)
      onSubmitted()
    } catch (error) {
      setFailure(
        error instanceof ORPCError
          ? "The revision could not be submitted. Check that the repository contains a valid descriptor and try again."
          : "The revision could not be submitted. Try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit block for review</DialogTitle>
          <DialogDescription>
            The selected Git revision and its descriptor will be saved as an
            immutable submission. A global admin must approve it before it
            appears in the public catalog.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <dl className="grid gap-1 rounded-md border p-3 text-sm">
            <dt className="font-medium">{block.name}</dt>
            <dd className="text-muted-foreground">
              Current snapshot:{" "}
              <code className="font-mono text-xs">
                {block.sourceCommit.slice(0, 12)}
              </code>
            </dd>
          </dl>
          <div className="flex flex-col gap-2">
            <Label htmlFor="block-submission-ref">Git reference</Label>
            <Input
              id="block-submission-ref"
              value={ref}
              onChange={(event) => setRef(event.target.value)}
              placeholder="HEAD or a branch, tag, or commit"
            />
            <p className="text-xs text-muted-foreground">
              The reference is resolved to a commit before the submission is
              stored.
            </p>
          </div>
          {failure ? (
            <p className="text-sm text-destructive" role="alert">
              {failure}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={!ref.trim() || submitting}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
