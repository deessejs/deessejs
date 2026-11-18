"use client"

import { client } from "@/lib/client"
import { useRef, useState } from "react"
import { useProfileAvatar, useProfileAvatarMutations, type AvatarContentType } from "@/hooks/use-avatar-mutations"
import { toast } from "sonner"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { getInitials } from "@/lib/initials"

const avatarContentTypes: readonly AvatarContentType[] = ["image/jpeg", "image/png", "image/webp"]

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
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = client.auth.useSession()
  const avatar = useProfileAvatar(Boolean(session?.user))
  const avatarMutations = useProfileAvatarMutations()
  const user = session?.user
  const [displayName, setDisplayName] = useState(user?.name ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const avatarBusy = avatarMutations.upload.isPending || avatarMutations.remove.isPending

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return
    const contentType = avatarContentTypes.find((type) => type === file.type)
    if (!contentType) {
      toast.error("Choose a JPEG, PNG, or WebP image.")
      return
    }
    avatarMutations.upload.mutate(file, { onSuccess: () => toast.success("Avatar updated"), onError: (error) => toast.error(error.message) })
  }

  async function handleAvatarRemove() {
    avatarMutations.remove.mutate(undefined, { onSuccess: () => toast.success("Uploaded avatar removed"), onError: (error) => toast.error(error.message) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return

    setSubmitting(true)
    const { error } = await client.auth.updateUser({
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
