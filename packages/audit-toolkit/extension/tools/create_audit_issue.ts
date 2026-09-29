import { defineTool } from "eve/tools"
import { z } from "zod"

import { getInstallationOctokit } from "../lib/octokit-app.js"
import {
  CreateAuditIssueInput,
  createAuditIssue,
} from "../lib/audit-issue.js"

const CreateAuditIssueToolInput = CreateAuditIssueInput.extend({
  installationId: z.number().int().positive(),
})

/**
 * Shared publication tool. Performs three checks before creating:
 * (a) existing fingerprint marker in any issue or PR,
 * (b) exact-title match on open issues,
 * (c) open PR with the same title.
 *
 * Specialists should call find_similar_issues first; this tool enforces
 * idempotency only. Two specialists that describe the same defect with
 * different wording will create two issues; the morning coverage report
 * flags them.
 */
export default defineTool({
  description:
    "Create one audit issue in the target repository. Performs three " +
    "idempotency checks before creating: (a) existing fingerprint marker, " +
    "(b) exact-title match on open issues, (c) open PR with the same title. " +
    "Returns { status: 'created' | 'already-tracked' | 'rejected', ... }.",
  inputSchema: CreateAuditIssueToolInput,
  async execute({ installationId, ...rest }) {
    const octokit = await getInstallationOctokit(installationId)
    return createAuditIssue(CreateAuditIssueInput.parse(rest), octokit)
  },
})