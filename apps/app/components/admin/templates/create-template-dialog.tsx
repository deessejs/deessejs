"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import { toast } from "sonner"
import { CATEGORY_SLUGS } from "@workspace/api/templates-labels"
import { TEMPLATE_IMAGE_FILENAMES } from "@workspace/api/templates-images"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { useForm } from "@tanstack/react-form"
import { TemplateFormFields, templateFormSchema } from "./template-form-fields"
import {
  repositoryUrlForSource,
  switchTemplateSource,
} from "@/lib/template-source-form"
import type {
  EditableTemplate,
  TemplateFormValues,
} from "./template-form-fields"

const defaults: TemplateFormValues = {
  sourceType: "github",
  repositoryUrl: "",
  slug: "",
  name: "",
  descriptionOverride: "",
  category: "saas",
  labels: "",
  licenseFallback: "",
  access: "free",
  imageName: "none",
}

const FAILURE_MESSAGE =
  "The template could not be added. Check the details and try again."
const REFUSALS: Record<string, string> = {
  TEMPLATE_SLUG_CONFLICT: "A template with this slug already exists.",
  TEMPLATE_GITHUB_SOURCE_INVALID: "Enter a URL for a public GitHub repository.",
  TEMPLATE_GITHUB_FETCH_FAILED:
    "GitHub data could not be fetched. Check the URL and try again.",
}

function getDefaultValues(template: EditableTemplate | null) {
  if (!template) return defaults
  return {
    ...defaults,
    repositoryUrl: template.canonicalUrl ?? "",
    slug: template.slug,
    name: template.name,
    descriptionOverride: template.descriptionOverride ?? "",
    category:
      CATEGORY_SLUGS.find((category) => category === template.category) ??
      "saas",
    labels: template.labels.join(", "),
    licenseFallback: template.licenseFallback ?? "",
    access: template.access,
    imageName: template.imageName ?? "none",
  }
}

async function saveTemplate(
  value: TemplateFormValues,
  template: EditableTemplate | null
) {
  const labels = value.labels
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
  const imageName =
    TEMPLATE_IMAGE_FILENAMES.find(
      (candidate) => candidate === value.imageName
    ) ?? null

  if (template) {
    await client.rpc.admin.templates.update({
      id: template.id,
      name: value.name,
      descriptionOverride: value.descriptionOverride.trim() || null,
      category: value.category,
      labels,
      licenseFallback: value.licenseFallback.trim() || null,
      access: value.access,
      imageName,
    })
    toast.success("Template updated")
    return
  }

  await client.rpc.admin.templates.create({
    sourceType: value.sourceType,
    ...repositoryUrlForSource(value.sourceType, value.repositoryUrl),
    slug: value.slug,
    name: value.name,
    descriptionOverride: value.descriptionOverride.trim() || null,
    category: value.category,
    labels,
    licenseFallback: value.licenseFallback.trim() || null,
    access: value.access,
    imageName,
  })
}

function getFailureMessage(error: unknown, isEditing: boolean) {
  const fallbackMessage = isEditing
    ? "The template could not be updated. Refresh and try again."
    : FAILURE_MESSAGE
  return error instanceof ORPCError
    ? (REFUSALS[error.code] ?? fallbackMessage)
    : fallbackMessage
}

function changeTemplateField(
  name: keyof TemplateFormValues,
  value: string,
  values: TemplateFormValues,
  setFieldValue: (name: keyof TemplateFormValues, value: string) => void
) {
  switch (name) {
    case "category": {
      const category = CATEGORY_SLUGS.find((item) => item === value)
      if (category) setFieldValue("category", category)
      return
    }
    case "access":
      if (value === "free" || value === "paid") {
        setFieldValue("access", value)
      }
      return
    case "sourceType":
      if (value === "github" || value === "managed") {
        const next = switchTemplateSource(values, value)
        setFieldValue("sourceType", next.sourceType)
        setFieldValue("repositoryUrl", next.repositoryUrl)
      }
      return
    case "repositoryUrl":
    case "slug":
    case "name":
    case "descriptionOverride":
    case "labels":
    case "licenseFallback":
    case "imageName":
      setFieldValue(name, value)
  }
}

function closeTemplateDialog(
  next: boolean,
  isSubmitting: boolean,
  reset: () => void,
  clearFailure: () => void,
  onOpenChange: (open: boolean) => void
) {
  if (!next && !isSubmitting) {
    clearFailure()
    reset()
  }
  onOpenChange(next)
}

function getSubmitLabel(
  isSubmitting: boolean,
  isEditing: boolean,
  isGitHubSource: boolean
) {
  if (!isSubmitting) return isEditing ? "Save changes" : "Add template"
  if (isEditing) return "Saving…"
  return isGitHubSource ? "Fetching from GitHub…" : "Creating entry…"
}

function getFieldError(error: unknown): string | undefined {
  if (typeof error === "string") return error
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }
  return undefined
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: EditableTemplate | null
}) {
  const router = useRouter()
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm({
    defaultValues: getDefaultValues(template),
    validators: { onSubmit: templateFormSchema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
        await saveTemplate(value, template)
        form.reset()
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        setFailure(getFailureMessage(error, Boolean(template)))
      }
    },
  })

  function handleOpenChange(next: boolean) {
    closeTemplateDialog(
      next,
      form.state.isSubmitting,
      form.reset,
      () => setFailure(null),
      onOpenChange
    )
  }

  const isEditing = Boolean(template)
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit template" : "Add a template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the catalog details. The GitHub repository snapshot and slug will stay unchanged."
              : "Add a public GitHub template or create a managed entry for publishing from a validated archive."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.Subscribe
            selector={(state) => ({
              values: state.values,
              fieldMeta: state.fieldMeta,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ values, fieldMeta, isSubmitting }) => {
              const submitLabel = getSubmitLabel(
                isSubmitting,
                isEditing,
                values.sourceType === "github"
              )

              return (
                <>
                  <TemplateFormFields
                    values={values}
                    errors={{
                      repositoryUrl: getFieldError(
                        fieldMeta.repositoryUrl?.errors[0]
                      ),
                      slug: getFieldError(fieldMeta.slug?.errors[0]),
                      name: getFieldError(fieldMeta.name?.errors[0]),
                    }}
                    template={template}
                    onChange={(name, value) =>
                      changeTemplateField(
                        name,
                        value,
                        values,
                        form.setFieldValue
                      )
                    }
                    allowManagedSource
                  />
                  {failure && (
                    <p className="text-sm text-destructive" role="alert">
                      {failure}
                    </p>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {submitLabel}
                    </Button>
                  </DialogFooter>
                </>
              )
            }}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
