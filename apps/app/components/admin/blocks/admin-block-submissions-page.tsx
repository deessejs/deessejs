"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { client } from "@/lib/client"

export function AdminBlockSubmissionsPage({
  submissions,
}: {
  submissions: Array<{
    id: string
    organizationSlug: string
    slug: string
    name: string
    category: string
    repositoryUrl: string
    sourceCommit: string
  }>
}) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  async function decide(id: string, approve: boolean) {
    setError("")
    try {
      if (approve) {
        await client.rpc.admin.templates.blockPublications.approve({
          publicationId: id,
          reason: reason || null,
        })
      } else {
        await client.rpc.admin.templates.blockPublications.reject({
          publicationId: id,
          reason,
        })
      }
      router.refresh()
    } catch {
      setError("Review decision failed. Refresh and retry.")
    }
  }
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Block submissions</h1>
      {error && <p role="alert">{error}</p>}
      {submissions.length === 0 ? (
        <p>No block submissions are waiting for review.</p>
      ) : (
        submissions.map((item) => (
          <section
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p>
              {item.organizationSlug}/{item.slug} · {item.category}
            </p>
            <a
              href={`${item.repositoryUrl}/tree/${item.sourceCommit}`}
              target="_blank"
              rel="noreferrer"
            >
              Review pinned source {item.sourceCommit.slice(0, 7)}
            </a>
            <Textarea
              placeholder="Review note or rejection reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => void decide(item.id, true)}>
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={!reason.trim()}
                onClick={() => void decide(item.id, false)}
              >
                Reject
              </Button>
            </div>
          </section>
        ))
      )}
    </main>
  )
}
