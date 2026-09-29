import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"

/**
 * Resolve the single audit target for M1.
 *
 * Reads AUDIT_TARGET_REPOSITORY (env) and AUDIT_INSTALLATION_ID (env) at
 * execution time, validates their shape, fetches the live main SHA, and
 * returns the trio. The coordinator dispatches one specialist per call
 * to this tool — it is the only GitHub-facing tool the root agent sees.
 */
export default defineTool({
  description:
    "Resolve the M1 audit target from environment variables. Returns the " +
    "repository, installation id, and the SHA at which main currently " +
    "resolves. The coordinator calls this exactly once before dispatching " +
    "the behavior specialist. Fails loud if either env var is missing.",
  inputSchema: z.object({}),
  async execute() {
    const repository = process.env.AUDIT_TARGET_REPOSITORY
    const installationIdRaw = process.env.AUDIT_INSTALLATION_ID

    if (!repository || !installationIdRaw) {
      throw new Error(
        "AUDIT_TARGET_REPOSITORY and AUDIT_INSTALLATION_ID must both be " +
          "set in the deployment environment for M1.",
      )
    }
    if (!/^[^/]+\/[^/]+$/.test(repository)) {
      throw new Error(
        `AUDIT_TARGET_REPOSITORY must be 'owner/repo', got '${repository}'`,
      )
    }
    const installationId = Number.parseInt(installationIdRaw, 10)
    if (!Number.isFinite(installationId) || installationId <= 0) {
      throw new Error(
        `AUDIT_INSTALLATION_ID must be a positive integer, got '${installationIdRaw}'`,
      )
    }
    const [owner, repo] = repository.split("/")
    if (!owner || !repo) {
      throw new Error(`Invalid AUDIT_TARGET_REPOSITORY '${repository}'`)
    }

    const octokit = await getInstallationOctokit(installationId)
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    })
    return {
      repository,
      installationId,
      mainSha: ref.data.object.sha,
    }
  },
})