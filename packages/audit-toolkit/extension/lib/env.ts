import { z } from "zod"

import extension from "../extension.js"

/**
 * Resolve the GitHub App credentials from the extension's validated config.
 * Tools call this at the top of execute() so the validation runs once per
 * mount, not per call.
 */
const ResolvedGitHub = z.object({
  appId: z.string().min(1),
  appPrivateKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  appSlug: z.string().optional(),
})

export type ResolvedGitHub = z.infer<typeof ResolvedGitHub>

export function getGitHubCredentials(): ResolvedGitHub {
  return ResolvedGitHub.parse(extension.config)
}