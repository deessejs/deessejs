"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { orpcBrowser } from "@/lib/orpc-browser"

export function TemplateImageUpload({
  templateId,
  organizationSlug,
  onUploaded,
}: {
  templateId: string
  organizationSlug?: string
  onUploaded: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <label className="inline-flex items-center gap-2">
      <input
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0]
          if (!file) return
          setBusy(true)
          setError(null)
          try {
            const input = {
              templateId,
              contentType: file.type as
                | "image/jpeg"
                | "image/png"
                | "image/webp",
              byteSize: file.size,
            }
            const upload = organizationSlug
              ? await orpcBrowser.organization.templateImages.createUpload({
                  ...input,
                  organizationSlug,
                })
              : await orpcBrowser.admin.templates.image.createUpload(input)
            const response = await fetch(upload.uploadUrl, {
              method: "PUT",
              headers: upload.requiredHeaders,
              body: file,
            })
            if (!response.ok) throw new Error("Upload failed")
            if (organizationSlug)
              await orpcBrowser.organization.templateImages.complete({
                organizationSlug,
                templateId,
                uploadId: upload.uploadId,
              })
            else
              await orpcBrowser.admin.templates.image.complete({
                templateId,
                uploadId: upload.uploadId,
              })
            onUploaded()
          } catch {
            setError(
              "The image could not be uploaded. Use a JPEG, PNG, or WebP image under 5 MiB."
            )
          } finally {
            setBusy(false)
            event.currentTarget.value = ""
          }
        }}
      />
      <Button type="button" variant="outline" disabled={busy} asChild>
        <span>{busy ? "Uploading…" : "Upload image"}</span>
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  )
}
