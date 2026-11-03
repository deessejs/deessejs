"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
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
      <Input
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (event) => {
          const inputElement = event.currentTarget
          const file = inputElement.files?.[0]
          if (!file) return
          setBusy(true)
          setError(null)
          let step: "requesting upload" | "uploading to storage" | "validating upload" =
            "requesting upload"
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
            step = "uploading to storage"
            let response: Response
            try {
              response = await fetch(upload.uploadUrl, {
                method: "PUT",
                headers: upload.requiredHeaders,
                body: file,
              })
            } catch {
              throw new Error("storage-network")
            }
            if (!response.ok)
              throw new Error(`storage-http-${response.status}`)
            step = "validating upload"
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
          } catch (cause) {
            const message = cause instanceof Error ? cause.message : ""
            if (message === "storage-network") {
              setError(
                "The browser could not reach image storage. Check your connection and storage CORS settings, then try again."
              )
            } else if (message.startsWith("storage-http-")) {
              setError(
                `Image storage rejected the upload (HTTP ${message.slice("storage-http-".length)}). Try again or contact support.`
              )
            } else {
              const safeMessage = message
                .replace(/https?:\/\/\S+/gi, "[redacted URL]")
                .replace(/[?&][^\s]*/g, "[redacted query]")
                .slice(0, 240)
              setError(
                safeMessage
                  ? `Could not complete image upload while ${step}: ${safeMessage}`
                  : `Could not complete image upload while ${step}. Try again or contact support.`
              )
            }
          } finally {
            setBusy(false)
            inputElement.value = ""
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
