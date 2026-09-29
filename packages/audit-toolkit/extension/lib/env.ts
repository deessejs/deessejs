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

/**
 * Resolve the allowlist of repositories the audit may publish into.
 *
 * Precedence: AUDIT_TARGET_REPOSITORIES (CSV) wins when set and
 * non-empty. AUDIT_TARGET_REPOSITORY (singular) is the M1 fallback and
 * is ignored when the CSV form is present. Both forms are lower-cased
 * before comparison.
 *
 * Empty allowlist rejects all writes — there is no implicit "anything
 * goes" mode.
 */
export function readRepositoryAllowlist(): string[] {
  const multi = process.env.AUDIT_TARGET_REPOSITORIES?.trim()
  if (multi && multi.length > 0) {
    return multi
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0)
  }
  const single = process.env.AUDIT_TARGET_REPOSITORY?.trim().toLowerCase()
  return single ? [single] : []
}