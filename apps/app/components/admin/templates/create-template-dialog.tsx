"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ORPCError } from "@orpc/client"
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
import { useForm } from "react-hook-form"
import { z } from "zod"
import { orpcBrowser } from "@/lib/orpc-browser"

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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })
  const { register, handleSubmit, formState, setValue, watch, reset } = form

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
      await orpcBrowser.admin.templates.create({
        repositoryUrl: values.repositoryUrl,
        slug: values.slug,
        name: values.name,
        descriptionOverride: values.descriptionOverride.trim() || null,
        category: values.category,
        labels: values.labels
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
        licenseFallback: values.licenseFallback.trim() || null,
        access: values.access,
        imageName:
          values.imageName === "none"
            ? null
            : (values.imageName as (typeof TEMPLATE_IMAGE_FILENAMES)[number]),
      })
      reset(defaults)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      setFailure(
        error instanceof ORPCError
          ? (REFUSALS[error.code] ?? FAILURE_MESSAGE)
          : FAILURE_MESSAGE
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a template</DialogTitle>
          <DialogDescription>
            Enter a public GitHub repository. Its repository details and README
            will be fetched and saved with your catalog entry.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(create)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="GitHub repository URL"
              controlId="template-repository-url"
              error={formState.errors.repositoryUrl?.message}
            >
              <Input
                id="template-repository-url"
                {...register("repositoryUrl")}
                placeholder="https://github.com/owner/repository"
                autoComplete="url"
              />
            </Field>
            <Field
              label="Template slug"
              controlId="template-slug"
              error={formState.errors.slug?.message}
            >
              <Input
                id="template-slug"
                {...register("slug")}
                placeholder="my-template"
                autoComplete="off"
              />
            </Field>
            <Field
              label="Display name"
              controlId="template-name"
              error={formState.errors.name?.message}
            >
              <Input
                id="template-name"
                {...register("name")}
                placeholder="My Template"
              />
            </Field>
            <Field label="Category" controlId="template-category">
              <Select
                value={watch("category")}
                onValueChange={(value) => {
                  if (value)
                    setValue("category", value as FormValues["category"], {
                      shouldDirty: true,
                    })
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
              <Input
                id="template-labels"
                {...register("labels")}
                placeholder="nextjs, drizzle"
              />
            </Field>
            <Field
              label="License fallback"
              controlId="template-license"
              hint="Optional editorial value"
            >
              <Input
                id="template-license"
                {...register("licenseFallback")}
                placeholder="MIT"
              />
            </Field>
            <Field label="Access" controlId="template-access">
              <Select
                value={watch("access")}
                onValueChange={(value) => {
                  if (value)
                    setValue("access", value as FormValues["access"], {
                      shouldDirty: true,
                    })
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
                value={watch("imageName")}
                onValueChange={(value) => {
                  if (value) setValue("imageName", value, { shouldDirty: true })
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
            <Textarea
              id="template-description"
              {...register("descriptionOverride")}
              className="min-h-20"
              maxLength={10000}
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
              disabled={formState.isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting
                ? "Fetching from GitHub…"
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
