import auditToolkit from "@deessejs/audit-toolkit"

/**
 * Specialist mount of the audit toolkit. Directory form so each subagent
 * keeps the full tool surface (`checkout_repo`, `create_audit_issue`,
 * `find_similar_issues`, `list_audit_repositories`, `get_audit_target`).
 * The root agent mounts the same extension but with `disableTool()`
 * overrides on the side-effecting tools — see
 * apps/agent/agent/extensions/audit-toolkit/tools/*.
 */
export default auditToolkit({
  appId: process.env.GITHUB_APP_ID ?? "",
  appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? "",
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  appSlug: process.env.GITHUB_APP_SLUG,
})