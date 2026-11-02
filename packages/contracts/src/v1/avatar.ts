import { z } from "zod"

const avatarInputContentType = z.enum(["image/jpeg", "image/png", "image/webp"])

/**
 * Short-lived direct-upload request and response contracts for app clients.
 * `uploadUrl` is a temporary bearer capability and must never be persisted.
 */
export const AvatarUploadRequestV1 = z.object({
  contentType: avatarInputContentType,
  byteSize: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024),
})

export const AvatarUploadResponseV1 = z.object({
  uploadId: z.uuid(),
  uploadUrl: z.url(),
  requiredHeaders: z.object({ "Content-Type": avatarInputContentType }),
  expiresAt: z.iso.datetime(),
})

/** Stable same-origin image reference. It carries no storage key or capability. */
export const AvatarImageV1 = z.object({ imageUrl: z.string().nullable() })

export const AvatarCompleteRequestV1 = z.object({ uploadId: z.uuid() })
export const AvatarCompleteResponseV1 = z.object({ imageUrl: z.string() })
export const AvatarRemoveResponseV1 = z.object({ success: z.literal(true) })

export type AvatarUploadRequestV1 = z.infer<typeof AvatarUploadRequestV1>
export type AvatarUploadResponseV1 = z.infer<typeof AvatarUploadResponseV1>
export type AvatarImageV1 = z.infer<typeof AvatarImageV1>
export type AvatarCompleteResponseV1 = z.infer<typeof AvatarCompleteResponseV1>
