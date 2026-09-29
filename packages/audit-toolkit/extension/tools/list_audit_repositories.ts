import { defineTool } from "eve/tools"
import { z } from "zod"

import { listAuditRepositories } from "../lib/repos.js"

export default defineTool({
  description:
    "List repositories the DeesseJS GitHub App is installed on. " +
    "Returns the full_name, default_branch, language, and topics for " +
    "each repository. Used by the audit coordinator to enumerate the " +
    "audit surface.",
  inputSchema: z.object({
    installationId: z.number().int().positive(),
  }),
  async execute({ installationId }) {
    return listAuditRepositories(installationId)
  },
})