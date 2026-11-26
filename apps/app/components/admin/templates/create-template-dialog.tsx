"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ORPCError } from "@orpc/client"
import { toast } from "sonner"
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
} from "@workspace/api/templates-labels"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"

const formSchema = z.object({
  repositoryUrl: z
    .string()
    .trim()
    .min(1, "Enter a GitHub repository URL.")
    .max(2048),
  slug: z.string().trim().min(1, "Enter a public template slug.").max(100),
  name: z.string().trim().min(1, "Enter a display name.").max(200),
  descriptionOverride: z.string().max(10000),
  category: z.enum(CATEGORY_SLUGS),
  labels: z.string(),
  licenseFallback: z.string().max(128),
  access: z.enum(["free", "paid"]),
  imageName: z.string(),
})
type FormValues = z.infer<typeof formSchema>

type EditableTemplate = {
  id: string
  slug: string
  name: string
  descriptionOverride: string | null
  canonicalUrl: string
  category: string
  labels: string[]
  licenseFallback: string | null
  access: "free" | "paid"
  imageName: string | null
}

const defaults: FormValues = {
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
          repositoryUrl: template.canonicalUrl,
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
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
        const labels = value.labels
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean)
        const imageName =
          TEMPLATE_IMAGE_FILENAMES.find(
            (imageName) => imageName === value.imageName
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
            repositoryUrl: value.repositoryUrl,
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
        const failureMessage = template
          ? "The template could not be updated. Refresh and try again."
          : FAILURE_MESSAGE
        setFailure(
          error instanceof ORPCError
            ? (REFUSALS[error.code] ?? failureMessage)
            : failureMessage
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit template" : "Add a template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the catalog details. The GitHub repository snapshot and slug will stay unchanged."
              : "Enter a public GitHub repository. Its repository details and README will be fetched and saved with your catalog entry."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {!template && (
              <Field
                label="GitHub repository URL"
                controlId="template-repository-url"
                error={
                  form.state.fieldMeta.repositoryUrl?.errors[0] as
                    | string
                    | undefined
                }
              >
                <form.Field name="repositoryUrl">
                  {(field) => (
                    <Input
                      id="template-repository-url"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="https://github.com/owner/repository"
                      autoComplete="url"
                    />
                  )}
                </form.Field>
              </Field>
            )}
            <Field
              label={template ? "Template slug (read-only)" : "Template slug"}
              controlId="template-slug"
              error={form.state.fieldMeta.slug?.errors[0] as string | undefined}
            >
              <form.Field name="slug">
                {(field) => (
                  <Input
                    id="template-slug"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="my-template"
                    autoComplete="off"
                    readOnly={Boolean(template)}
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Display name"
              controlId="template-name"
              error={form.state.fieldMeta.name?.errors[0] as string | undefined}
            >
              <form.Field name="name">
                {(field) => (
                  <Input
                    id="template-name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Template"
                  />
                )}
              </form.Field>
            </Field>
            <Field label="Category" controlId="template-category">
              <Select
                value={form.getFieldValue("category")}
                onValueChange={(value) => {
                  const nextCategory = CATEGORY_SLUGS.find(
                    (category) => category === value
                  )
                  if (nextCategory) form.setFieldValue("category", nextCategory)
                }}
              >
                <SelectTrigger id="template-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_SLUGS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Labels"
              controlId="template-labels"
              hint="Comma-separated, for example nextjs, drizzle"
            >
              <form.Field name="labels">
                {(field) => (
                  <Input
                    id="template-labels"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="nextjs, drizzle"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="License fallback"
              controlId="template-license"
              hint="Optional editorial value"
            >
              <form.Field name="licenseFallback">
                {(field) => (
                  <Input
                    id="template-license"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="MIT"
                  />
                )}
              </form.Field>
            </Field>
            <Field label="Access" controlId="template-access">
              <Select
                value={form.getFieldValue("access")}
                onValueChange={(value) => {
                  const nextAccess =
                    value === "free" || value === "paid" ? value : undefined
                  if (nextAccess) form.setFieldValue("access", nextAccess)
                }}
              >
                <SelectTrigger id="template-access" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Template image"
              controlId="template-image"
              hint="Optional deployed image"
            >
              <Select
                value={form.getFieldValue("imageName")}
                onValueChange={(value) => {
                  if (value) form.setFieldValue("imageName", value)
                }}
              >
                <SelectTrigger id="template-image" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No image</SelectItem>
                  {TEMPLATE_IMAGE_FILENAMES.map((image) => (
                    <SelectItem key={image} value={image}>
                      {image}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="Description override"
            controlId="template-description"
            hint="Optional. Leave empty to use the repository description."
          >
            <form.Field name="descriptionOverride">
              {(field) => (
                <Textarea
                  id="template-description"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="min-h-20"
                  maxLength={10000}
                />
              )}
            </form.Field>
          </Field>
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
              {form.state.isSubmitting
                ? template
                  ? "Saving…"
                  : "Fetching from GitHub…"
                : template
                  ? "Save changes"
                  : "Add template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  controlId,
  hint,
  error,
  children,
}: {
  label: string
  controlId?: string
  hint?: string
  error?: string | undefined
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={controlId}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
