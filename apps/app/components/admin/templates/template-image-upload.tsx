"use client"

import { useState } from "react"
import {
  TemplateImageUploadError,
  useTemplateImageUpload,
  type TemplateImageUploadStep,
} from "@/hooks/use-template-image-upload"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

function getUploadErrorMessage(cause: unknown, step: string) {
  const message = cause instanceof Error ? cause.message : ""
  if (message === "storage-network")
    return "The browser could not reach image storage. Check your connection and storage CORS settings, then try again."
  if (message.startsWith("storage-http-"))
    return `Image storage rejected the upload (HTTP ${message.slice("storage-http-".length)}). Try again or contact support.`

  const safeMessage = message
    .replace(/https?:\/\/\S+/gi, "[redacted URL]")
    .replace(/[?&][^\s]*/g, "[redacted query]")
    .slice(0, 240)
  return safeMessage
    ? `Could not complete image upload while ${step}: ${safeMessage}`
    : `Could not complete image upload while ${step}. Try again or contact support.`
}

export function TemplateImageUpload({
  templateId,
  organizationSlug,
  onUploaded,
}: {
  templateId: string
  organizationSlug?: string
  onUploaded: () => void
}) {
  const [step, setStep] = useState<TemplateImageUploadStep>("requesting upload")
  const uploadMutation = useTemplateImageUpload()
  const error = uploadMutation.error
    ? uploadMutation.error instanceof TemplateImageUploadError
      ? getUploadErrorMessage(uploadMutation.error, uploadMutation.error.step)
      : getUploadErrorMessage(uploadMutation.error, step)
    : null
  return (
    <label className="inline-flex items-center gap-2">
      <Input
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploadMutation.isPending}
        onChange={(event) => {
          const inputElement = event.currentTarget
          const file = inputElement.files?.[0]
          if (!file) return
          setStep("requesting upload")
          uploadMutation.mutate({
            templateId,
            organizationSlug,
            file,
            onStepChange: setStep,
          }, {
            onSuccess: onUploaded,
            onSettled: () => {
              inputElement.value = ""
            },
          })
        }}
      />
      <Button type="button" variant="outline" disabled={uploadMutation.isPending} asChild>
        <span>{uploadMutation.isPending ? "Uploading…" : "Upload image"}</span>
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  )
}
