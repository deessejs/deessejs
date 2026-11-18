"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

export type TemplateImageUploadStep =
  | "requesting upload"
  | "uploading to storage"
  | "validating upload"

const acceptedContentTypes = ["image/jpeg", "image/png", "image/webp"] as const

export class TemplateImageUploadError extends Error {
  constructor(
    message: string,
    readonly step: TemplateImageUploadStep
  ) {
    super(message)
    this.name = "TemplateImageUploadError"
  }
}

export function useTemplateImageUpload() {
  return useMutation({
    // This flow includes a direct presigned PUT. The server-rendered template
    // row is refreshed by the caller after completion; no TanStack query owns it.
    mutationFn: async ({
      templateId,
      organizationSlug,
      file,
      onStepChange,
    }: {
      templateId: string
      organizationSlug: string | undefined
      file: File
      onStepChange: (step: TemplateImageUploadStep) => void
    }) => {
      const contentType = acceptedContentTypes.find((type) => type === file.type)
      if (!contentType) {
        throw new TemplateImageUploadError("Choose a JPEG, PNG, or WebP image.", "requesting upload")
      }

      let step: TemplateImageUploadStep = "requesting upload"
      try {
        const input = { templateId, contentType, byteSize: file.size }
        const upload = organizationSlug
          ? await client.rpc.organization.templateImages.createUpload({
              ...input,
              organizationSlug,
            })
          : await client.rpc.admin.templates.image.createUpload(input)

        step = "uploading to storage"
        onStepChange(step)
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
        if (!response.ok) throw new Error(`storage-http-${response.status}`)

        step = "validating upload"
        onStepChange(step)
        if (organizationSlug) {
          await client.rpc.organization.templateImages.complete({
            organizationSlug,
            templateId,
            uploadId: upload.uploadId,
          })
        } else {
          await client.rpc.admin.templates.image.complete({
            templateId,
            uploadId: upload.uploadId,
          })
        }
      } catch (error) {
        throw new TemplateImageUploadError(
          error instanceof Error ? error.message : "",
          step
        )
      }
    },
  })
}
