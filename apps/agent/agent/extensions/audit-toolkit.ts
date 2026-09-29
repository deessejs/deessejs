import auditToolkit from "@deessejs/audit-toolkit"

/**
 * Root mount of the audit toolkit. The coordinator uses list_audit_repositories
 * to enumerate the audit surface and orchestrates the run.
 */
export default auditToolkit({
  appId: process.env.GITHUB_APP_ID ?? "",
  appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? "",
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  appSlug: process.env.GITHUB_APP_SLUG,
})