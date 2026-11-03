import { z } from "zod"
import { base } from "../base.js"
import { authGuard } from "../auth-middleware.js"
import { adminProcedure } from "../admin-middleware.js"
import {
  createTemplateImageUpload,
  completeTemplateImageUpload,
} from "../../core/templates/images.js"
import { findOrganizationForMember } from "../../core/organization/membership.js"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import { ORPCError } from "@orpc/server"

const imageErrors = {
  TEMPLATE_IMAGE_FORBIDDEN: {
    status: 403,
    message: "Template image access denied.",
  },
  TEMPLATE_IMAGE_INVALID: {
    status: 400,
    message: "Template image is invalid.",
  },
  TEMPLATE_IMAGE_NOT_FOUND: {
    status: 404,
    message: "Template image upload was not found.",
  },
}

function rethrowImageError(
  error: unknown,
  errors: {
    TEMPLATE_IMAGE_FORBIDDEN: () => Error
    TEMPLATE_IMAGE_INVALID: () => Error
    TEMPLATE_IMAGE_NOT_FOUND: () => Error
  }
): never {
  if (error instanceof Error) {
    if (error.message === "TEMPLATE_IMAGE_FORBIDDEN")
      throw errors.TEMPLATE_IMAGE_FORBIDDEN()
    if (error.message === "TEMPLATE_IMAGE_INVALID")
      throw errors.TEMPLATE_IMAGE_INVALID()
    if (error.message === "TEMPLATE_IMAGE_NOT_FOUND")
      throw errors.TEMPLATE_IMAGE_NOT_FOUND()
  }
  if (error instanceof ORPCError) throw error
  throw error
}

const uploadInput = z.object({
  templateId: z.string().uuid(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
})
const completeInput = z.object({
  templateId: z.string().uuid(),
  uploadId: z.string().uuid(),
})
const output = z.object({
  uploadId: z.string().uuid(),
  uploadUrl: z.string().url(),
  requiredHeaders: z.record(z.string(), z.string()),
  expiresAt: z.string().datetime(),
})

export const organizationTemplateImageRouter = {
  createUpload: base
    .input(
      z.object({ organizationSlug: z.string().min(1), ...uploadInput.shape })
    )
    .use(authGuard)
    .errors(imageErrors)
    .output(output)
    .handler(async ({ context, input, errors }) => {
      const org = await findOrganizationForMember(
        context.user.id,
        input.organizationSlug
      )
      if (!org || !hasManagingRole(org.role))
        throw errors.TEMPLATE_IMAGE_FORBIDDEN()
      try {
        return await createTemplateImageUpload(
          input.templateId,
          context.user.id,
          input.contentType,
          input.byteSize
        )
      } catch (error) {
        return rethrowImageError(error, errors)
      }
    }),
  complete: base
    .input(
      z.object({ organizationSlug: z.string().min(1), ...completeInput.shape })
    )
    .use(authGuard)
    .errors(imageErrors)
    .output(z.object({ imageUrl: z.string() }))
    .handler(async ({ context, input, errors }) => {
      const org = await findOrganizationForMember(
        context.user.id,
        input.organizationSlug
      )
      if (!org || !hasManagingRole(org.role))
        throw errors.TEMPLATE_IMAGE_FORBIDDEN()
      try {
        return await completeTemplateImageUpload(
          input.templateId,
          context.user.id,
          input.uploadId
        )
      } catch (error) {
        return rethrowImageError(error, errors)
      }
    }),
}

export const adminTemplateImageRouter = {
  createUpload: adminProcedure
    .errors(imageErrors)
    .input(uploadInput)
    .output(output)
    .handler(async ({ context, input, errors }) => {
      try {
        return await createTemplateImageUpload(
          input.templateId,
          context.user.id,
          input.contentType,
          input.byteSize
        )
      } catch (error) {
        return rethrowImageError(error, errors)
      }
    }),
  complete: adminProcedure
    .errors(imageErrors)
    .input(completeInput)
    .output(z.object({ imageUrl: z.string() }))
    .handler(async ({ context, input, errors }) => {
      try {
        return await completeTemplateImageUpload(
          input.templateId,
          context.user.id,
          input.uploadId
        )
      } catch (error) {
        return rethrowImageError(error, errors)
      }
    }),
}
