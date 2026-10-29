"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { CopyIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"

const organizationProfileSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine((value) => [...value].length <= 100, {
      message: "Use 100 characters or fewer.",
    })
    .refine((value) => !hasControlCharacters(value), {
      message: "Control characters are not allowed.",
    })
    .refine((value) => value === value.trim(), {
      message: "Remove spaces at the beginning or end.",
    }),
  logo: z
    .string()
    .max(2048)
    .refine(
      (value) => {
        if (!value) return true
        try {
          const url = new URL(value)
          return url.protocol === "https:" && !url.username && !url.password
        } catch {
          return false
        }
      },
      { message: "Enter a valid HTTPS image URL." }
    ),
})

type OrganizationProfileValues = z.infer<typeof organizationProfileSchema>

function isSafeLogoPreview(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)
    if (codePoint === undefined) continue
    if (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)) {
      return true
    }
  }
  return false
}

type OrganizationProfile = {
  id: string
  slug: string
  name: string
  logo: string | null
  role: string
}

function CopyButton({ value, label }: { value: () => string; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value())
          toast.success(`${label} copied`)
        } catch {
          toast.error(`Could not copy ${label.toLowerCase()}`)
        }
      }}
    >
      <CopyIcon className="size-4" aria-hidden />
    </Button>
  )
}

export function OrganizationProfile({
  organization,
}: {
  organization: OrganizationProfile
}) {
  const router = useRouter()
  const canManage = hasManagingRole(organization.role)
  const [submitting, setSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState(organization.logo ?? "")
  const form = useForm<OrganizationProfileValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: { name: organization.name, logo: organization.logo ?? "" },
  })
  const logoField = form.register("logo")
  async function handleSubmit(values: OrganizationProfileValues) {
    const savedValues = { ...values, logo: values.logo.trim() }
    setSubmitting(true)
    try {
      const { error } = await authClient.organization.update({
        organizationId: organization.id,
        data: { name: savedValues.name, logo: savedValues.logo || null },
      })

      if (error) {
        toast.error(error.message ?? "Could not update organization")
        return
      }

      form.reset(savedValues)
      setLogoPreview(savedValues.logo)
      toast.success("Organization profile saved")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update organization"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const workspacePath = `/${organization.slug}`
  const initials = organization.name.trim().slice(0, 2).toUpperCase() || "?"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 rounded-lg">
          {isSafeLogoPreview(logoPreview) && (
            <AvatarImage
              src={logoPreview}
              alt={`${organization.name} logo`}
              referrerPolicy="no-referrer"
            />
          )}
          <AvatarFallback className="rounded-lg text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{organization.name}</h2>
          <p className="text-sm text-muted-foreground">Organization profile</p>
        </div>
      </div>

      {canManage ? (
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="organization-name" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="organization-name"
              {...form.register("name")}
              required
              aria-describedby="organization-name-help"
            />
            <p
              id="organization-name-help"
              className="text-sm text-muted-foreground"
            >
              Renaming the organization does not change its workspace address.
            </p>
            {form.formState.errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="organization-logo" className="text-sm font-medium">
              Logo URL
            </label>
            <Input
              id="organization-logo"
              type="text"
              inputMode="url"
              placeholder="https://example.com/logo.png"
              {...logoField}
              onChange={(event) => {
                void logoField.onChange(event)
                setLogoPreview(event.target.value)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Use an HTTPS image URL. Leave empty to use the organization
              initials.
            </p>
            {form.formState.errors.logo && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.logo.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || !form.formState.isDirty}
            >
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only organization owners and admins can edit this profile.
        </p>
      )}

      <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">Workspace address</dt>
            <dd className="truncate text-sm font-medium">{workspacePath}</dd>
          </div>
          <CopyButton
            value={() =>
              new URL(workspacePath, window.location.origin).toString()
            }
            label="Workspace URL"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">Organization ID</dt>
            <dd className="truncate font-mono text-xs">{organization.id}</dd>
          </div>
          <CopyButton value={() => organization.id} label="Organization ID" />
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Your role</dt>
          <dd className="text-sm font-medium">{organization.role}</dd>
        </div>
      </dl>
    </div>
  )
}
