"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { ORPCError } from "@orpc/client"
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
import { useForm } from "@tanstack/react-form"
import { z } from "zod"

const schema = z.object({
  repositoryUrl: z.string().trim().url("Enter a valid GitHub repository URL."),
  slug: z.string().trim().min(1, "Enter a block slug.").max(100),
  name: z.string().trim().min(1, "Enter a display name.").max(200),
  category: z.string().trim().min(1, "Enter a category.").max(64),
  subdirectory: z.string().trim(),
  description: z.string().max(10000),
})

type FormValues = z.infer<typeof schema>
const defaults: FormValues = {
  repositoryUrl: "",
  slug: "",
  name: "",
  category: "integration",
  subdirectory: "",
  description: "",
}

const failures: Record<string, string> = {
  ORGANIZATION_ACCESS_DENIED:
    "Only organization owners and admins can add blocks.",
  BLOCK_SLUG_CONFLICT: "This organization already has a block with this slug.",
  BLOCK_GITHUB_SOURCE_INVALID: "Enter a URL for a public GitHub repository.",
  BLOCK_GITHUB_FETCH_FAILED:
    "GitHub could not read this repository. Check the URL and try again.",
  BLOCK_DESCRIPTOR_INVALID:
    "The repository needs a valid deesse-block.json descriptor.",
}

export function AddOrganizationBlockDialog({
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
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
        await client.rpc.organization.blocks.create({
          organizationSlug,
          ...value,
        })
        form.reset()
        onOpenChange(false)
        onCreated()
      } catch (error) {
        setFailure(
          error instanceof ORPCError
            ? (failures[error.code] ??
                "The block could not be imported. Check its descriptor and try again.")
            : "The block could not be imported. Check its descriptor and try again."
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
          <DialogTitle>Add a private block</DialogTitle>
          <DialogDescription>
            Import a public GitHub repository. Its deesse-block.json descriptor
            is validated and pinned to the resolved commit.
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
            <Field
              label="GitHub repository URL"
              id="block-repository-url"
              error={
                form.getFieldValue("repositoryUrl") &&
                (form.state.fieldMeta.repositoryUrl?.errors[0] as
                  | string
                  | undefined)
              }
            >
              <form.Field name="repositoryUrl">
                {(field) => (
                  <Input
                    id="block-repository-url"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="https://github.com/owner/repository"
                    autoComplete="url"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Block slug"
              id="block-slug"
              error={form.state.fieldMeta.slug?.errors[0] as string | undefined}
            >
              <form.Field name="slug">
                {(field) => (
                  <Input
                    id="block-slug"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="my-block"
                    autoComplete="off"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Display name"
              id="block-name"
              error={form.state.fieldMeta.name?.errors[0] as string | undefined}
            >
              <form.Field name="name">
                {(field) => (
                  <Input
                    id="block-name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Block"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Category"
              id="block-category"
              error={
                form.state.fieldMeta.category?.errors[0] as string | undefined
              }
            >
              <form.Field name="category">
                {(field) => (
                  <Input
                    id="block-category"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="integration"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Descriptor subdirectory"
              id="block-subdirectory"
              hint="Leave empty when deesse-block.json is at the repository root."
              error={
                form.state.fieldMeta.subdirectory?.errors[0] as
                  | string
                  | undefined
              }
            >
              <form.Field name="subdirectory">
                {(field) => (
                  <Input
                    id="block-subdirectory"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="blocks/my-block"
                  />
                )}
              </form.Field>
            </Field>
          </div>
          <Field
            label="Description"
            id="block-description"
            hint="Optional organization presentation text."
            error={
              form.state.fieldMeta.description?.errors[0] as string | undefined
            }
          >
            <form.Field name="description">
              {(field) => (
                <Textarea
                  id="block-description"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  rows={3}
                />
              )}
            </form.Field>
          </Field>
          {failure ? (
            <p className="text-sm text-destructive" role="alert">
              {failure}
            </p>
          ) : null}
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
              {form.state.isSubmitting ? "Importing…" : "Import block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string
  id: string
  hint?: string | undefined
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
