import { ORPCError } from "@orpc/server"
import {
  AvatarCompleteRequestV1,
  AvatarCompleteResponseV1,
  AvatarImageV1,
  AvatarRemoveResponseV1,
  AvatarUploadRequestV1,
  AvatarUploadResponseV1,
} from "@workspace/contracts/v1"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"
import { findOrganizationForMember } from "../../core/organization/membership.js"
import {
  completeAvatarUpload,
  createAvatarUpload,
  getOrganizationAvatar,
  getUserAvatar,
  removeOrganizationAvatar,
  removeUserAvatar,
} from "../../core/avatars/lifecycle.js"
import { z } from "zod"

const avatarErrors = {
  AVATAR_ACCESS_DENIED: { status: 403, message: "Avatar access denied." },
  AVATAR_UPLOAD_INVALID: { status: 400, message: "Avatar image is invalid." },
  AVATAR_UPLOAD_NOT_FOUND: {
    status: 404,
    message: "Avatar upload was not found.",
  },
}

const uploadInput = AvatarUploadRequestV1
const uploadOutput = AvatarUploadResponseV1
const avatarOutput = AvatarImageV1

const rethrowAvatarError = (error: unknown): never => {
  if (error instanceof Error && error.message === "AVATAR_UPLOAD_INVALID") {
    throw new ORPCError("AVATAR_UPLOAD_INVALID")
  }
  if (error instanceof Error && error.message === "AVATAR_UPLOAD_NOT_FOUND") {
    throw new ORPCError("AVATAR_UPLOAD_NOT_FOUND")
  }
  if (error instanceof Error && error.message === "AVATAR_ACCESS_DENIED") {
    throw new ORPCError("AVATAR_ACCESS_DENIED")
  }
  throw error
}

const get = base
  .errors(avatarErrors)
  .use(authGuard)
  .output(avatarOutput)
  .handler(({ context }) => getUserAvatar(context.user.id))

const createUpload = base
  .input(uploadInput)
  .errors(avatarErrors)
  .use(authGuard)
  .output(uploadOutput)
  .handler(async ({ context, input }) => {
    try {
      return await createAvatarUpload(
        { kind: "user", userId: context.user.id },
        input.contentType,
        input.byteSize
      )
    } catch (error) {
      return rethrowAvatarError(error)
    }
  })

const complete = base
  .input(AvatarCompleteRequestV1)
  .errors(avatarErrors)
  .use(authGuard)
  .output(AvatarCompleteResponseV1)
  .handler(async ({ context, input }) => {
    try {
      return await completeAvatarUpload(
        { kind: "user", userId: context.user.id },
        input.uploadId
      )
    } catch (error) {
      return rethrowAvatarError(error)
    }
  })

const remove = base
  .errors(avatarErrors)
  .use(authGuard)
  .output(AvatarRemoveResponseV1)
  .handler(({ context }) => removeUserAvatar(context.user.id))

const organizationGet = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(avatarErrors)
  .use(authGuard)
  .output(avatarOutput)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization) throw errors.AVATAR_ACCESS_DENIED()
    return getOrganizationAvatar(organization.id)
  })

const organizationCreateUpload = base
  .input(z.object({ slug: z.string().min(1), ...uploadInput.shape }))
  .errors(avatarErrors)
  .use(authGuard)
  .output(uploadOutput)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.AVATAR_ACCESS_DENIED()
    }
    try {
      return await createAvatarUpload(
        {
          kind: "organization",
          organizationId: organization.id,
          userId: context.user.id,
        },
        input.contentType,
        input.byteSize
      )
    } catch (error) {
      return rethrowAvatarError(error)
    }
  })

const organizationComplete = base
  .input(
    z.object({ slug: z.string().min(1), ...AvatarCompleteRequestV1.shape })
  )
  .errors(avatarErrors)
  .use(authGuard)
  .output(AvatarCompleteResponseV1)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.AVATAR_ACCESS_DENIED()
    }
    try {
      return await completeAvatarUpload(
        {
          kind: "organization",
          organizationId: organization.id,
          userId: context.user.id,
        },
        input.uploadId
      )
    } catch (error) {
      return rethrowAvatarError(error)
    }
  })

const organizationRemove = base
  .input(z.object({ slug: z.string().min(1) }))
  .errors(avatarErrors)
  .use(authGuard)
  .output(AvatarRemoveResponseV1)
  .handler(async ({ context, input, errors }) => {
    const organization = await findOrganizationForMember(
      context.user.id,
      input.slug
    )
    if (!organization || !hasManagingRole(organization.role)) {
      throw errors.AVATAR_ACCESS_DENIED()
    }
    return removeOrganizationAvatar(organization.id)
  })

export const profileAvatarRouter = { get, createUpload, complete, remove }
export const organizationAvatarRouter = {
  get: organizationGet,
  createUpload: organizationCreateUpload,
  complete: organizationComplete,
  remove: organizationRemove,
}
