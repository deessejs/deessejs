"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ORPCError } from "@orpc/client"
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
} from "@workspace/api/templates-labels"
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
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { orpcBrowser } from "@/lib/orpc-browser"

const formSchema = z.object({
  repositoryUrl: z
    .string()
    .trim()
    .min(1, "Enter a GitHub repository URL.")
    .max(2048),
  slug: z.string().trim().min(1, "Enter a template slug.").max(100),
  name: z.string().trim().min(1, "Enter a display name.").max(200),
  descriptionOverride: z.string().max(10000),
  category: z.enum(CATEGORY_SLUGS),
  labels: z.string(),
  licenseFallback: z.string().max(128),
})

type FormValues = z.infer<typeof formSchema>

const defaults: FormValues = {
  repositoryUrl: "",
  slug: "",
  name: "",
  descriptionOverride: "",
  category: "saas",
  labels: "",
  licenseFallback: "",
}

const genericFailure =
  "The template could not be added. Check the details and try again."
const refusals: Record<string, string> = {
  ORGANIZATION_ACCESS_DENIED:
    "Only organization owners and admins can add templates.",
  TEMPLATE_SLUG_CONFLICT:
    "This organization already has a template with this slug.",
  TEMPLATE_GITHUB_SOURCE_INVALID: "Enter a URL for a public GitHub repository.",
  TEMPLATE_GITHUB_FETCH_FAILED:
    "GitHub data could not be fetched. Check the URL and try again.",
}

function Field({
  label,
  controlId,
  hint,
  error,
  children,
}: {
  label: string
  controlId: string
  hint?: string
  error?: string | undefined
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
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

export function CreateOrganizationTemplateDialog({
  open,
  onOpenChange,
  organizationSlug,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationSlug: string
  onCreated: () => void
}) {
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })
  const { register, handleSubmit, formState, setValue, reset } = form
  const category = useWatch({ control: form.control, name: "category" })

  function handleOpenChange(next: boolean) {
    if (!next && !formState.isSubmitting) {
      setFailure(null)
      reset(defaults)
    }
    onOpenChange(next)
  }

  async function create(values: FormValues) {
    setFailure(null)
    try {
      await orpcBrowser.organization.templates.create({
        organizationSlug,
        slug: values.slug,
        name: values.name,
        repositoryUrl: values.repositoryUrl,
        descriptionOverride: values.descriptionOverride.trim() || null,
        category: values.category,
        labels: values.labels
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
        licenseFallback: values.licenseFallback.trim() || null,
      })
      reset(defaults)
      onOpenChange(false)
      onCreated()
    } catch (error) {
      setFailure(
        error instanceof ORPCError
          ? (refusals[error.code] ?? genericFailure)
          : genericFailure
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a private template</DialogTitle>
          <DialogDescription>
            Add a public GitHub repository. Its repository details and README
            are fetched and saved for {organizationSlug}.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(create)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="GitHub repository URL"
              controlId="organization-template-repository-url"
              error={formState.errors.repositoryUrl?.message}
            >
              <Input
                id="organization-template-repository-url"
                {...register("repositoryUrl")}
                placeholder="https://github.com/owner/repository"
                autoComplete="url"
              />
            </Field>
            <Field
              label="Template slug"
              controlId="organization-template-slug"
              error={formState.errors.slug?.message}
            >
              <Input
                id="organization-template-slug"
                {...register("slug")}
                placeholder="my-template"
                autoComplete="off"
              />
            </Field>
            <Field
              label="Display name"
              controlId="organization-template-name"
              error={formState.errors.name?.message}
            >
              <Input
                id="organization-template-name"
                {...register("name")}
                placeholder="My Template"
              />
            </Field>
            <Field label="Category" controlId="organization-template-category">
              <Select
                value={category}
                onValueChange={(value) => {
                  const nextCategory = CATEGORY_SLUGS.find(
                    (option) => option === value
                  )
                  if (nextCategory) {
                    setValue("category", nextCategory, { shouldDirty: true })
                  }
                }}
              >
                <SelectTrigger
                  id="organization-template-category"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_SLUGS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CATEGORY_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Labels"
              controlId="organization-template-labels"
              hint="Comma-separated, for example nextjs, drizzle"
            >
              <Input
                id="organization-template-labels"
                {...register("labels")}
                placeholder="nextjs, drizzle"
              />
            </Field>
            <Field
              label="License fallback"
              controlId="organization-template-license"
              hint="Optional editorial value"
            >
              <Input
                id="organization-template-license"
                {...register("licenseFallback")}
                placeholder="MIT"
              />
            </Field>
          </div>
          <Field
            label="Description override"
            controlId="organization-template-description"
            hint="Leave blank to use the GitHub repository description."
          >
            <Textarea
              id="organization-template-description"
              {...register("descriptionOverride")}
              rows={3}
            />
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
              onClick={() => handleOpenChange(false)}
              disabled={formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Adding..." : "Add template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
