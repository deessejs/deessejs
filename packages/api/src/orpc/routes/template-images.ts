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
    .output(output)
    .handler(async ({ context, input }) => {
      const org = await findOrganizationForMember(
        context.user.id,
        input.organizationSlug
      )
      if (!org || !hasManagingRole(org.role))
        throw new Error("TEMPLATE_IMAGE_FORBIDDEN")
      return createTemplateImageUpload(
        input.templateId,
        context.user.id,
        input.contentType,
        input.byteSize
      )
    }),
  complete: base
    .input(
      z.object({ organizationSlug: z.string().min(1), ...completeInput.shape })
    )
    .use(authGuard)
    .output(z.object({ imageUrl: z.string() }))
    .handler(async ({ context, input }) => {
      const org = await findOrganizationForMember(
        context.user.id,
        input.organizationSlug
      )
      if (!org || !hasManagingRole(org.role))
        throw new Error("TEMPLATE_IMAGE_FORBIDDEN")
      return completeTemplateImageUpload(
        input.templateId,
        context.user.id,
        input.uploadId
      )
    }),
}

export const adminTemplateImageRouter = {
  createUpload: adminProcedure
    .input(uploadInput)
    .output(output)
    .handler(({ context, input }) =>
      createTemplateImageUpload(
        input.templateId,
        context.user.id,
        input.contentType,
        input.byteSize
      )
    ),
  complete: adminProcedure
    .input(completeInput)
    .output(z.object({ imageUrl: z.string() }))
    .handler(({ context, input }) =>
      completeTemplateImageUpload(
        input.templateId,
        context.user.id,
        input.uploadId
      )
    ),
}
