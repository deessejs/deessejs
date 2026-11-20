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

export function CreateOfficialBlockDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm({
    defaultValues: defaults,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setFailure(null)
      try {
        await client.rpc.admin.blocks.createOfficial(value)
        form.reset()
        onOpenChange(false)
        onCreated()
      } catch (error) {
        setFailure(
          error instanceof ORPCError && error.code === "CONFLICT"
            ? "An official block with this slug already exists."
            : "The official block could not be published. Check its GitHub source and descriptor, then try again."
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
          <DialogTitle>Add an official block</DialogTitle>
          <DialogDescription>
            Import a public GitHub repository. The current revision is pinned
            and published in the official catalog after its descriptor passes
            validation.
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
              id="official-block-repository"
              error={
                form.state.fieldMeta.repositoryUrl?.errors[0] as
                  | string
                  | undefined
              }
            >
              <form.Field name="repositoryUrl">
                {(field) => (
                  <Input
                    id="official-block-repository"
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
              id="official-block-slug"
              error={form.state.fieldMeta.slug?.errors[0] as string | undefined}
            >
              <form.Field name="slug">
                {(field) => (
                  <Input
                    id="official-block-slug"
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
              id="official-block-name"
              error={form.state.fieldMeta.name?.errors[0] as string | undefined}
            >
              <form.Field name="name">
                {(field) => (
                  <Input
                    id="official-block-name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Block"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Category"
              id="official-block-category"
              error={
                form.state.fieldMeta.category?.errors[0] as string | undefined
              }
            >
              <form.Field name="category">
                {(field) => (
                  <Input
                    id="official-block-category"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="integration"
                  />
                )}
              </form.Field>
            </Field>
            <Field
              label="Descriptor subdirectory"
              id="official-block-subdirectory"
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
                    id="official-block-subdirectory"
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
            id="official-block-description"
            hint="Optional catalog description."
            error={
              form.state.fieldMeta.description?.errors[0] as string | undefined
            }
          >
            <form.Field name="description">
              {(field) => (
                <Textarea
                  id="official-block-description"
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
              {form.state.isSubmitting
                ? "Publishing…"
                : "Publish official block"}
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
