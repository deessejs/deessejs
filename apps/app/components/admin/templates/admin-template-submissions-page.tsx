"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { Badge } from "@workspace/ui/components/badge"
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
import { Textarea } from "@workspace/ui/components/textarea"
import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react"
import { orpcBrowser } from "@/lib/orpc-browser"

type Submission = Awaited<
  ReturnType<
    RouterClient<typeof appRouter>["admin"]["templates"]["publications"]["list"]
  >
>["submissions"][number]

type Decision = "approve" | "reject"

const submittedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function AdminTemplateSubmissionsPage({
  submissions,
}: {
  submissions: Submission[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Submission | null>(null)
  const [decision, setDecision] = useState<Decision>("approve")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  function openReview(submission: Submission, nextDecision: Decision) {
    setSelected(submission)
    setDecision(nextDecision)
    setReason("")
    setFailure(null)
  }

  function closeReview(open: boolean) {
    if (!open && !busy) {
      setSelected(null)
      setReason("")
      setFailure(null)
    }
  }

  async function decide() {
    if (!selected || busy) return
    setFailure(null)
    setBusy(true)
    try {
      if (decision === "approve") {
        await orpcBrowser.admin.templates.publications.approve({
          publicationId: selected.id,
        })
      } else {
        await orpcBrowser.admin.templates.publications.reject({
          publicationId: selected.id,
          reason: reason.trim(),
        })
      }
      setSelected(null)
      router.refresh()
    } catch (error) {
      setFailure(
        error instanceof ORPCError &&
          error.code === "TEMPLATE_SUBMISSION_NOT_PENDING"
          ? "Another administrator already reviewed this request. Refresh the queue."
          : "The decision could not be saved. Refresh the queue and try again."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Publication requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Review the exact repository revision and presentation that will be
          published in the community catalog.
        </p>
      </header>

      {submissions.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No requests to review</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            New organization template requests will appear here.
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <caption className="sr-only">
              Pending community publications
            </caption>
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th scope="col" className="h-11 px-4 font-medium">
                  Template
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Source revision
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  License
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Submitted
                </th>
                <th scope="col" className="h-11 px-4 font-medium">
                  Review
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((submission) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  onApprove={() => openReview(submission, "approve")}
                  onReject={() => openReview(submission, "reject")}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={closeReview}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {decision === "approve"
                ? "Approve publication"
                : "Reject request"}
            </DialogTitle>
            <DialogDescription>
              {decision === "approve"
                ? "Approval publishes this frozen revision. Future repository changes will require another review."
                : "Give the organization a clear reason for this decision."}
            </DialogDescription>
          </DialogHeader>
          {selected ? <SubmissionReviewDetails submission={selected} /> : null}
          {decision === "reject" ? (
            <div className="grid gap-2">
              <Label htmlFor="publication-rejection-reason">Reason</Label>
              <Textarea
                id="publication-rejection-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={1000}
                placeholder="Explain what needs to change before this template can be published."
              />
            </div>
          ) : null}
          {failure ? (
            <p className="text-sm text-destructive" role="alert">
              {failure}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeReview(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={decision === "reject" ? "destructive" : "default"}
              onClick={() => void decide()}
              disabled={busy || (decision === "reject" && !reason.trim())}
            >
              {decision === "approve"
                ? "Approve and publish"
                : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubmissionRow({
  submission,
  onApprove,
  onReject,
}: {
  submission: Submission
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <tr>
      <td className="max-w-xs px-4 py-3">
        <p className="font-medium">{submission.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          @{submission.organizationSlug}/{submission.slug}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {submission.organizationName} · {submission.category}
        </p>
      </td>
      <td className="px-4 py-3">
        <a
          className="inline-flex items-center gap-1 font-mono text-xs underline-offset-4 hover:underline"
          href={`${submission.canonicalUrl}/tree/${submission.sourceCommit}`}
          target="_blank"
          rel="noreferrer"
        >
          {submission.sourceCommit.slice(0, 12)}
          <ExternalLinkIcon className="size-3" aria-hidden />
        </a>
        <p className="mt-1 text-xs text-muted-foreground">
          {submission.owner}/{submission.repo}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline">{submission.license}</Badge>
        <p className="mt-1 text-xs text-muted-foreground">Rights confirmed</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
        {submittedAtFormatter.format(new Date(submission.submittedAt))}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onApprove}>
            <CheckIcon aria-hidden />
            Review
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}>
            <XIcon aria-hidden />
            Reject
          </Button>
        </div>
      </td>
    </tr>
  )
}

function SubmissionReviewDetails({ submission }: { submission: Submission }) {
  return (
    <dl className="grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-muted-foreground">Description</dt>
        <dd className="mt-1 whitespace-pre-wrap">{submission.description}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Category</dt>
        <dd className="mt-1 capitalize">{submission.category}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Labels</dt>
        <dd className="mt-1">{submission.labels.join(", ") || "None"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">GitHub repository</dt>
        <dd className="mt-1">
          <a
            className="underline-offset-4 hover:underline"
            href={submission.canonicalUrl}
            target="_blank"
            rel="noreferrer"
          >
            {submission.repositoryName}
          </a>
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Install address</dt>
        <dd className="mt-1 font-mono">
          @{submission.organizationSlug}/{submission.slug}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted-foreground">Reviewed source</dt>
        <dd className="mt-1 font-mono text-xs break-all">
          {submission.sourceCommit}
        </dd>
      </div>
    </dl>
  )
}
