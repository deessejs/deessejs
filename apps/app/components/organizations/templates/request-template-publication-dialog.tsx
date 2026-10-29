"use client"

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
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { orpcBrowser } from "@/lib/orpc-browser"

const ERROR_MESSAGES: Record<string, string> = {
  TEMPLATE_SUBMISSION_CONFLICT:
    "This template already has a request waiting for review.",
  TEMPLATE_SLUG_INVALID:
    "The template slug must use lowercase letters, numbers, and hyphens.",
  TEMPLATE_LICENSE_REQUIRED:
    "Add a repository license before requesting publication.",
  TEMPLATE_GITHUB_SOURCE_INVALID:
    "The source must be a public GitHub repository.",
  TEMPLATE_GITHUB_FETCH_FAILED:
    "GitHub could not provide a fixed revision. Try again shortly.",
  TEMPLATE_DESCRIPTOR_INVALID:
    'The selected revision needs an installable "deesse-template.json" descriptor.',
}

export function RequestTemplatePublicationDialog({
  open,
  onOpenChange,
  organizationSlug,
  template,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationSlug: string
  template: { id: string; name: string; license: string } | null
  onSubmitted: () => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) {
      setConfirmed(false)
      setFailure(null)
    }
    onOpenChange(next)
  }

  async function submit() {
    if (!template || !confirmed) return
    setFailure(null)
    setSubmitting(true)
    try {
      await orpcBrowser.organization.templates.submit({
        organizationSlug,
        templateId: template.id,
        distributionRightsConfirmed: true,
      })
      setConfirmed(false)
      setFailure(null)
      onOpenChange(false)
      onSubmitted()
    } catch (error) {
      setFailure(
        error instanceof ORPCError
          ? (ERROR_MESSAGES[error.code] ??
              "The publication request could not be submitted. Try again.")
          : "The publication request could not be submitted. Try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request public review</DialogTitle>
          <DialogDescription>
            The reviewed name, description, license, README, and GitHub commit
            will be frozen. If approved, this revision will appear in the
            community catalog and remain pinned to this commit.
          </DialogDescription>
        </DialogHeader>
        {template ? (
          <div className="flex flex-col gap-4">
            <dl className="grid gap-1 rounded-md border p-3 text-sm">
              <dt className="font-medium">{template.name}</dt>
              <dd className="text-muted-foreground">
                License: {template.license || "Not detected"}
              </dd>
            </dl>
            <div className="flex items-start gap-3">
              <Checkbox
                id="publication-rights-confirmation"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
                className="mt-1"
              />
              <Label
                htmlFor="publication-rights-confirmation"
                className="text-sm leading-5"
              >
                I confirm that this organization may publish the repository
                contents under the displayed license.
              </Label>
            </div>
            {failure ? (
              <p className="text-sm text-destructive" role="alert">
                {failure}
              </p>
            ) : null}
          </div>
        ) : null}
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
            disabled={!template || !confirmed || submitting}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
