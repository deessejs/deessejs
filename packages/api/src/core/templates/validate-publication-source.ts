import {
  createGitHubTemplateSourceAdapter,
  createTemplateInstallationPlan,
} from "@workspace/registry/v1"

export class InvalidTemplatePublicationSourceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidTemplatePublicationSourceError"
  }
}

/** Ensure the reviewed commit can be installed by the supported CLI. */
export async function validateTemplatePublicationSource(
  owner: string,
  repo: string,
  sourceCommit: string
): Promise<void> {
  const result = await createTemplateInstallationPlan(
    { repository: `${owner}/${repo}`, ref: sourceCommit },
    createGitHubTemplateSourceAdapter()
  )

  if (!result.success) {
    const detail = result.diagnostics
      .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
      .join("\n")
    throw new InvalidTemplatePublicationSourceError(detail)
  }

  if (result.plan.source.revision !== sourceCommit.toLowerCase()) {
    throw new InvalidTemplatePublicationSourceError(
      "GitHub resolved the submission to a different commit."
    )
  }
}
