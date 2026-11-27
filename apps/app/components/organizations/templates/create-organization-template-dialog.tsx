"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import type { ReactNode } from "react"
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
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  repositoryUrlForSource,
  switchTemplateSource,
} from "@/lib/template-source-form"

const formSchema = z
  .object({
    sourceType: z.enum(["github", "managed"]),
    repositoryUrl: z.string().trim().max(2048),
    slug: z.string().trim().min(1, "Enter a template slug.").max(100),
    name: z.string().trim().min(1, "Enter a display name.").max(200),
    descriptionOverride: z.string().max(10000),
    category: z.enum(CATEGORY_SLUGS),
    labels: z.string(),
    licenseFallback: z.string().max(128),
  })
  .superRefine((value, context) => {
    if (value.sourceType === "github" && !value.repositoryUrl)
      context.addIssue({
        code: "custom",
        path: ["repositoryUrl"],
        message: "Enter a GitHub repository URL.",
      })
  })

type FormValues = z.infer<typeof formSchema>

const defaults: FormValues = {
  sourceType: "github",
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
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
        await client.rpc.organization.templates.create({
          organizationSlug,
          sourceType: value.sourceType,
          ...repositoryUrlForSource(value.sourceType, value.repositoryUrl),
          slug: value.slug,
          name: value.name,
          descriptionOverride: value.descriptionOverride.trim() || null,
          category: value.category,
          labels: value.labels
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean),
          licenseFallback: value.licenseFallback.trim() || null,
        })
        form.reset()
        onOpenChange(false)
        onCreated()
      } catch (error) {
        setFailure(
          error instanceof ORPCError
            ? (refusals[error.code] ?? genericFailure)
            : genericFailure
        )
      }
    },
  })
  const repositoryError = form.state.fieldMeta.repositoryUrl?.errors[0]

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
          <DialogTitle>Add a private template</DialogTitle>
          <DialogDescription>
            Add a GitHub-backed template or create a managed template for{" "}
            {organizationSlug} and publish its archive from the local project.
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
            <Field label="Source" controlId="organization-template-source">
              <Select
                value={form.getFieldValue("sourceType")}
                onValueChange={(value) => {
                  if (value === "github" || value === "managed") {
                    const next = switchTemplateSource(
                      {
                        sourceType: form.getFieldValue("sourceType"),
                        repositoryUrl: form.getFieldValue("repositoryUrl"),
                      },
                      value
                    )
                    form.setFieldValue("sourceType", next.sourceType)
                    form.setFieldValue("repositoryUrl", next.repositoryUrl)
                  }
                }}
              >
                <SelectTrigger
                  id="organization-template-source"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">
                    Public GitHub repository
                  </SelectItem>
                  <SelectItem value="managed">Managed archive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.getFieldValue("sourceType") === "github" && (
              <Field
                label="GitHub repository URL"
                controlId="organization-template-repository-url"
                error={
                  typeof repositoryError === "string"
                    ? repositoryError
                    : undefined
                }
              >
                <form.Field name="repositoryUrl">
                  {(field) => (
                    <Input
                      id="organization-template-repository-url"
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
              label="Template slug"
              controlId="organization-template-slug"
              error={form.state.fieldMeta.slug?.errors[0] as string | undefined}
            >
              <form.Field name="slug">
                {(field) => (
                  <Input
                    id="organization-template-slug"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="my-template"
                    autoComplete="off"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Display name"
              controlId="organization-template-name"
              error={form.state.fieldMeta.name?.errors[0] as string | undefined}
            >
              <form.Field name="name">
                {(field) => (
                  <Input
                    id="organization-template-name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Template"
                  />
                )}
              </form.Field>
            </Field>
            <Field label="Category" controlId="organization-template-category">
              <Select
                value={form.getFieldValue("category")}
                onValueChange={(value) => {
                  const nextCategory = CATEGORY_SLUGS.find(
                    (option) => option === value
                  )
                  if (nextCategory) {
                    form.setFieldValue("category", nextCategory)
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
              <form.Field name="labels">
                {(field) => (
                  <Input
                    id="organization-template-labels"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="nextjs, drizzle"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="License fallback"
              controlId="organization-template-license"
              hint="Optional editorial value"
            >
              <form.Field name="licenseFallback">
                {(field) => (
                  <Input
                    id="organization-template-license"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="MIT"
                  />
                )}
              </form.Field>
            </Field>
          </div>
          <Field
            label="Description override"
            controlId="organization-template-description"
            hint="Leave blank to use the GitHub repository description."
          >
            <form.Field name="descriptionOverride">
              {(field) => (
                <Textarea
                  id="organization-template-description"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  rows={3}
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
              onClick={() => handleOpenChange(false)}
              disabled={form.state.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Adding..." : "Add template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
