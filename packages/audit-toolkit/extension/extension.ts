import { defineExtension } from "eve/extension"
import { z } from "zod"

/**
 * Audit toolkit configuration.
 *
 * The mounting agent must pass GitHub App credentials. The token stays in
 * the app runtime and is never exposed to the sandbox; tools that need
 * authenticated network access run in the app runtime and proxy results
 * into the sandbox.
 */
const AuditToolkitConfig = z.object({
  appId: z.string().min(1),
  appPrivateKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  appSlug: z.string().optional(),
})

export type AuditToolkitConfig = z.infer<typeof AuditToolkitConfig>

export default defineExtension({
  config: AuditToolkitConfig,
})