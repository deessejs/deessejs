"use client"

import { client } from "@/lib/client"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type AvatarContentType = "image/jpeg" | "image/png" | "image/webp"

export const organizationAvatarQueryOptions = (slug: string) => queryOptions({
  queryKey: ["organization", "avatar", slug] as const,
  queryFn: () => client.rpc.organization.avatar.get({ slug }),
  retry: false,
})

export function useOrganizationAvatar(slug: string) {
  return useQuery(organizationAvatarQueryOptions(slug))
}

export const profileAvatarQueryOptions = () => queryOptions({
  queryKey: ["profile", "avatar"] as const,
  queryFn: () => client.rpc.profile.avatar.get(),
  retry: false,
})

export function useProfileAvatar(enabled: boolean) {
  return useQuery({ ...profileAvatarQueryOptions(), enabled })
}

function getAvatarContentType(file: File): AvatarContentType {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") return file.type
  throw new Error("Choose a JPEG, PNG, or WebP image.")
}

async function uploadFile(uploadUrl: string, requiredHeaders: Record<string, string>, file: File) {
  const response = await fetch(uploadUrl, { method: "PUT", headers: requiredHeaders, body: file })
  if (!response.ok) throw new Error("Could not upload this image.")
}

export function useOrganizationAvatarMutations(slug: string) {
  const queryClient = useQueryClient()
  const queryKey = organizationAvatarQueryOptions(slug).queryKey
  const invalidate = () => queryClient.invalidateQueries({ queryKey })
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const created = await client.rpc.organization.avatar.createUpload({ slug, contentType: getAvatarContentType(file), byteSize: file.size })
      await uploadFile(created.uploadUrl, created.requiredHeaders, file)
      await client.rpc.organization.avatar.complete({ slug, uploadId: created.uploadId })
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: () => client.rpc.organization.avatar.remove({ slug }),
    onSuccess: invalidate,
  })
  return { upload, remove }
}

export function useProfileAvatarMutations() {
  const queryClient = useQueryClient()
  const queryKey = profileAvatarQueryOptions().queryKey
  const invalidate = () => queryClient.invalidateQueries({ queryKey })
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const created = await client.rpc.profile.avatar.createUpload({ contentType: getAvatarContentType(file), byteSize: file.size })
      await uploadFile(created.uploadUrl, created.requiredHeaders, file)
      await client.rpc.profile.avatar.complete({ uploadId: created.uploadId })
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: () => client.rpc.profile.avatar.remove(), onSuccess: invalidate })
  return { upload, remove }
}
