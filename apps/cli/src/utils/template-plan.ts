import {
  createTemplateDescriptorInfo,
  createGitHubTemplateSourceAdapter,
  createTemplateInstallationPlan,
  createManagedTemplateSourceAdapter,
  type TemplateDescriptorInfo,
  type TemplateInstallationPlan,
} from "@workspace/registry/v1"
import {
  networkError,
  repositoryNotFound,
  templateInvalid,
} from "../errors/index.js"
import { downloadManagedArchive } from "./download-managed-archive.js"
import { createAuthenticatedORPCClient, orpc } from "../api/client.js"

export async function resolveManagedTemplateInstallationPlan(input: {
  slug: string
  repository?: string
  organizationSlug?: string
  accessToken?: string
}): Promise<{
  plan: TemplateInstallationPlan | null
  requiresManaged: boolean
  preview: string | null
}> {
  const client = input.accessToken
    ? createAuthenticatedORPCClient(input.accessToken)
    : orpc
  let response
  try {
    response = await client.managedReleases.resolve({
      kind: "template",
      slug: input.slug,
      ...(input.organizationSlug
        ? { organizationSlug: input.organizationSlug }
        : {}),
    })
  } catch (error) {
    if (input.organizationSlug)
      throw templateInvalid(
        `@${input.organizationSlug}/${input.slug}`,
        "this organization template is unavailable or you do not have access"
      )
    throw error
  }
  if (!response.release)
    return {
      plan: null,
      requiresManaged: response.requiresManaged,
      preview: null,
    }
  const archive = await downloadManagedArchive(
    response.release.downloadUrl,
    response.release.digest
  )
  const sourceIdentity =
    input.repository ?? `managed-release:${response.release.id}`
  const adapter = await createManagedTemplateSourceAdapter({
    archive,
    repository: sourceIdentity,
    version: response.release.version,
  })
  const result = await createTemplateInstallationPlan(
    { repository: sourceIdentity },
    adapter
  )
  if (result.success) {
    return {
      plan: result.plan,
      requiresManaged: true,
      preview: response.release.preview,
    }
  }
  throw templateInvalid(
    input.slug,
    result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("\n")
  )
}

const NETWORK_DIAGNOSTIC_CODES = [
  "source.unavailable",
  "source.invalid_response",
  "source.incomplete_inventory",
  "source.inventory_limit_exceeded",
  "source.file_not_found",
  "source.file_read_failed",
]

export async function resolveTemplateDescriptorInfo(
  repository: string,
  ref?: string
): Promise<TemplateDescriptorInfo> {
  const result = await createTemplateDescriptorInfo(
    { repository, ...(ref ? { ref } : {}) },
    createGitHubTemplateSourceAdapter()
  )
  if (result.success) return result.info

  if (
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "source.repository_not_found"
    )
  ) {
    throw repositoryNotFound(repository)
  }

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

export async function resolveTemplateInstallationPlan(
  repository: string,
  ref?: string
): Promise<TemplateInstallationPlan> {
  const result = await createTemplateInstallationPlan(
    { repository, ...(ref ? { ref } : {}) },
    createGitHubTemplateSourceAdapter()
  )
  if (result.success) return result.plan

  if (
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === "source.repository_not_found"
    )
  ) {
    throw repositoryNotFound(repository)
  }

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
