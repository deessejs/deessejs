import auditToolkit from "@deessejs/audit-toolkit"

/**
 * Mount the audit toolkit into the behavior specialist. Each declared
 * subagent must mount the extension itself because eve does not inherit
 * parent tools into declared subagents (see docs/subagents).
 */
export default auditToolkit({
  appId: process.env.GITHUB_APP_ID ?? "",
  appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? "",
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  appSlug: process.env.GITHUB_APP_SLUG,
})