"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useForm } from "react-hook-form"
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
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const { register, handleSubmit, formState, reset } = form

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
      await client.rpc.admin.blocks.createOfficial(values)
      reset(defaults)
      onOpenChange(false)
      onCreated()
    } catch (error) {
      setFailure(
        error instanceof ORPCError && error.code === "CONFLICT"
          ? "An official block with this slug already exists."
          : "The official block could not be published. Check its GitHub source and descriptor, then try again."
      )
    }
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(create)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="GitHub repository URL"
              id="official-block-repository"
              error={formState.errors.repositoryUrl?.message}
            >
              <Input
                id="official-block-repository"
                {...register("repositoryUrl")}
                placeholder="https://github.com/owner/repository"
                autoComplete="url"
              />
            </Field>
            <Field
              label="Block slug"
              id="official-block-slug"
              error={formState.errors.slug?.message}
            >
              <Input
                id="official-block-slug"
                {...register("slug")}
                placeholder="my-block"
                autoComplete="off"
              />
            </Field>
            <Field
              label="Display name"
              id="official-block-name"
              error={formState.errors.name?.message}
            >
              <Input
                id="official-block-name"
                {...register("name")}
                placeholder="My Block"
              />
            </Field>
            <Field
              label="Category"
              id="official-block-category"
              error={formState.errors.category?.message}
            >
              <Input
                id="official-block-category"
                {...register("category")}
                placeholder="integration"
              />
            </Field>
            <Field
              label="Descriptor subdirectory"
              id="official-block-subdirectory"
              hint="Leave empty when deesse-block.json is at the repository root."
              error={formState.errors.subdirectory?.message}
            >
              <Input
                id="official-block-subdirectory"
                {...register("subdirectory")}
                placeholder="blocks/my-block"
              />
            </Field>
          </div>
          <Field
            label="Description"
            id="official-block-description"
            hint="Optional catalog description."
            error={formState.errors.description?.message}
          >
            <Textarea
              id="official-block-description"
              {...register("description")}
              rows={3}
            />
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
              disabled={formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting
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
