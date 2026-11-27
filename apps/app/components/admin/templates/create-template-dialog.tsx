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
    defaultValues: template
      ? {
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
      : defaults,
    validators: { onSubmit: templateFormSchema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
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
        } else {
          await client.rpc.admin.templates.create({
            sourceType: value.sourceType,
            ...(value.repositoryUrl
              ? { repositoryUrl: value.repositoryUrl }
              : {}),
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
        form.reset()
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        const fallbackMessage = template
          ? "The template could not be updated. Refresh and try again."
          : FAILURE_MESSAGE
        setFailure(
          error instanceof ORPCError
            ? (REFUSALS[error.code] ?? fallbackMessage)
            : fallbackMessage
        )
      }
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next && !form.state.isSubmitting) {
      setFailure(null)
      form.reset()
    }
    onOpenChange(next)
  }

  function handleFieldChange(name: keyof TemplateFormValues, value: string) {
    switch (name) {
      case "category": {
        const category = CATEGORY_SLUGS.find((item) => item === value)
        if (category) form.setFieldValue("category", category)
        return
      }
      case "access":
        if (value === "free" || value === "paid") {
          form.setFieldValue("access", value)
        }
        return
      case "sourceType":
        if (value === "github" || value === "managed") {
          form.setFieldValue("sourceType", value)
        }
        return
      case "repositoryUrl":
      case "slug":
      case "name":
      case "descriptionOverride":
      case "labels":
      case "licenseFallback":
      case "imageName":
        form.setFieldValue(name, value)
    }
  }

  const isEditing = Boolean(template)
  const isGitHubSource = form.state.values.sourceType === "github"
  let submitLabel = "Add template"
  if (form.state.isSubmitting) {
    submitLabel = isEditing
      ? "Saving…"
      : isGitHubSource
        ? "Fetching from GitHub…"
        : "Creating entry…"
  } else if (isEditing) {
    submitLabel = "Save changes"
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit template" : "Add a template"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the catalog details. The GitHub repository snapshot and slug will stay unchanged."
              : "Add a public GitHub template or create a managed entry for publishing from a validated archive."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          action={async () => form.handleSubmit()}
        >
          <TemplateFormFields
            values={form.state.values}
            errors={{
              repositoryUrl: form.state.fieldMeta.repositoryUrl?.errors[0] as
                | string
                | undefined,
              slug: form.state.fieldMeta.slug?.errors[0] as string | undefined,
              name: form.state.fieldMeta.name?.errors[0] as string | undefined,
            }}
            template={template}
            onChange={handleFieldChange}
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
              disabled={form.state.isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
