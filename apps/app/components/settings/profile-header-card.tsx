"use client"

import { useRef, useState } from "react"
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { authClient } from "@/lib/auth-client"
import { orpcBrowser } from "@/lib/orpc-browser"

const profileAvatarQueryOptions = () =>
  queryOptions({
    queryKey: ["profile", "avatar"],
    queryFn: () => orpcBrowser.profile.avatar.get(),
    retry: false,
  })
const avatarContentTypes = ["image/jpeg", "image/png", "image/webp"] as const

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const first = parts.at(0)
  if (!first) return "?"
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const last = parts.at(-1) ?? first
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

function getAvatarUrl(email: string, image?: string | null): string {
  if (image) return image
  return `${VERCEL_AVATAR_BASE}?s=160&u=${encodeURIComponent(email)}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48`
}

/**
 * Combined "Public profile" card on /account/settings/profile: avatar
 * (with a disabled Change avatar button as V1 placeholder) and name
 * form. The email is read-only here; the Email card below handles
 * changes.
 */
export function ProfileHeaderCard() {
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = authClient.useSession()
  const avatar = useQuery({
    ...profileAvatarQueryOptions(),
    enabled: Boolean(session?.user),
  })
  const user = session?.user
  const [displayName, setDisplayName] = useState(user?.name ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return
    const contentType = avatarContentTypes.find((type) => type === file.type)
    if (!contentType) {
      toast.error("Choose a JPEG, PNG, or WebP image.")
      return
    }
    setAvatarBusy(true)
    try {
      const upload = await orpcBrowser.profile.avatar.createUpload({
        contentType,
        byteSize: file.size,
      })
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: upload.requiredHeaders,
        body: file,
      })
      if (!response.ok) throw new Error("Could not upload this image.")
      await orpcBrowser.profile.avatar.complete({ uploadId: upload.uploadId })
      await queryClient.invalidateQueries({
        queryKey: profileAvatarQueryOptions().queryKey,
      })
      toast.success("Avatar updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update avatar"
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarBusy(true)
    try {
      await orpcBrowser.profile.avatar.remove()
      await queryClient.invalidateQueries({
        queryKey: profileAvatarQueryOptions().queryKey,
      })
      toast.success("Uploaded avatar removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove avatar"
      )
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    setSubmitting(true)
    const { error } = await authClient.updateUser({
      name: displayName.trim(),
    })
    setSubmitting(false)

    if (error) {
      toast.error(error.message ?? "Failed to update profile")
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const name = user?.name ?? ""
  const email = user?.email ?? ""
  const initials = getInitials(name, email)
  const avatarUrl = avatar.data?.imageUrl ?? getAvatarUrl(email, user?.image)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-3 sm:w-48">
        <Avatar className="size-24 rounded-lg">
          {(avatar.data?.imageUrl || user?.image) && (
            <AvatarImage src={avatarUrl} alt={name || email} />
          )}
          <AvatarFallback className="rounded-lg text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Input
          ref={avatarInputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={avatarBusy}
          aria-label="Choose an avatar image"
          onChange={(event) => {
            void handleAvatarChange(event.currentTarget.files?.[0]).then(
              () => undefined
            )
            event.currentTarget.value = ""
          }}
        />
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={avatarBusy}
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarBusy ? "Saving..." : "Change avatar"}
          </Button>
          {avatar.data?.imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={avatarBusy}
              onClick={() => void handleAvatarRemove().then(() => undefined)}
            >
              Remove upload
            </Button>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            placeholder="Your name"
          />
        </div>

        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Changes saved.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || displayName === name}>
            {submitting ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
