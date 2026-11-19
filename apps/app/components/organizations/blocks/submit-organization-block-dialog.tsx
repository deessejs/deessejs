"use client"

import { useSubmitOrganizationBlock } from "@/hooks/use-resource-mutations"
import { useState } from "react"
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
  const submitMutation = useSubmitOrganizationBlock()
  const failure = submitMutation.error ? "The revision could not be submitted. Check that the repository contains a valid descriptor and try again." : null

  function handleOpenChange(next: boolean) {
    if (!next && !submitMutation.isPending) {
      setRef("HEAD")
      submitMutation.reset()
    }
    onOpenChange(next)
  }

  async function submit() {
    try {
      await submitMutation.mutateAsync({
        organizationSlug,
        blockId: block.id,
        ref: ref.trim() || "HEAD",
      })
      onOpenChange(false)
      onSubmitted()
    } catch { /* The mutation error is rendered below. */ }
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
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={!ref.trim() || submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
