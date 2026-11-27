"use client"

import type { ReactNode } from "react"
import {
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
} from "@workspace/api/templates-labels"
import { TEMPLATE_IMAGE_FILENAMES } from "@workspace/api/templates-images"
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
import { z } from "zod"

export const templateFormSchema = z.object({
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

export type TemplateFormValues = z.infer<typeof templateFormSchema>

export type EditableTemplate = {
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

type TemplateFormFieldsProps = {
  values: TemplateFormValues
  errors: Partial<Record<keyof TemplateFormValues, string | undefined>>
  template: EditableTemplate | null
  onChange: (name: keyof TemplateFormValues, value: string) => void
}

export function TemplateFormFields({
  values,
  errors,
  template,
  onChange,
}: TemplateFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {!template && (
        <Field
          label="GitHub repository URL"
          controlId="template-repository-url"
          error={errors.repositoryUrl}
        >
          <Input
            id="template-repository-url"
            value={values.repositoryUrl}
            onChange={(event) => onChange("repositoryUrl", event.target.value)}
            placeholder="https://github.com/owner/repository"
            autoComplete="url"
          />
        </Field>
      )}
      <Field
        label={template ? "Template slug (read-only)" : "Template slug"}
        controlId="template-slug"
        error={errors.slug}
      >
        <Input
          id="template-slug"
          value={values.slug}
          onChange={(event) => onChange("slug", event.target.value)}
          placeholder="my-template"
          autoComplete="off"
          readOnly={Boolean(template)}
        />
      </Field>
      <Field label="Display name" controlId="template-name" error={errors.name}>
        <Input
          id="template-name"
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="My Template"
        />
      </Field>
      <Field label="Category" controlId="template-category">
        <Select
          value={values.category}
          onValueChange={(value) => {
            const category = CATEGORY_SLUGS.find((item) => item === value)
            if (category) onChange("category", category)
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
          value={values.labels}
          onChange={(event) => onChange("labels", event.target.value)}
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
          value={values.licenseFallback}
          onChange={(event) => onChange("licenseFallback", event.target.value)}
          placeholder="MIT"
        />
      </Field>
      <Field label="Access" controlId="template-access">
        <Select
          value={values.access}
          onValueChange={(value) => {
            if (value === "free" || value === "paid") {
              onChange("access", value)
            }
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
          value={values.imageName}
          onValueChange={(value) => {
            if (value) onChange("imageName", value)
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
      <Field
        label="Description override"
        controlId="template-description"
        hint="Optional. Leave empty to use the repository description."
      >
        <Textarea
          id="template-description"
          value={values.descriptionOverride}
          onChange={(event) =>
            onChange("descriptionOverride", event.target.value)
          }
          className="min-h-20"
          maxLength={10000}
        />
      </Field>
    </div>
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
