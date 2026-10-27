import {
  createGitHubTemplateSourceAdapter,
  createTemplateInstallationPlan,
  type TemplateInstallationPlan,
} from "@workspace/registry/v1"
import { networkError, templateInvalid } from "../errors/index.js"

const NETWORK_DIAGNOSTIC_CODES = [
  "source.unavailable",
  "source.invalid_response",
  "source.incomplete_inventory",
  "source.inventory_limit_exceeded",
  "source.file_not_found",
  "source.file_read_failed",
]

export async function resolveTemplateInstallationPlan(
  repository: string,
  ref?: string
): Promise<TemplateInstallationPlan> {
  const result = await createTemplateInstallationPlan(
    { repository, ...(ref ? { ref } : {}) },
    createGitHubTemplateSourceAdapter()
  )
  if (result.success) return result.plan

  const missingDescriptor =
    result.diagnostics.length === 1 &&
    result.diagnostics[0]?.code === "descriptor.missing"
  if (missingDescriptor) {
    throw templateInvalid(
      repository,
      'this GitHub repository does not contain a "deesse-template.json" file at its root'
    )
  }

  const detail = result.diagnostics
    .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
    .join("\n")
  if (
    result.diagnostics.some((diagnostic) =>
      NETWORK_DIAGNOSTIC_CODES.includes(diagnostic.code)
    )
  ) {
    throw networkError(detail)
  }
  throw templateInvalid(repository, detail)
}
