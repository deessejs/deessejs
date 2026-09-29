import auditToolkit from "@deessejs/audit-toolkit"

/**
 * Directory mount of the audit toolkit at the root agent. This mount is
 * restricted by the sibling `tools/*.ts` files, which disable the
 * side-effecting tools (`checkout_repo`, `create_audit_issue`,
 * `find_similar_issues`) at this level. Only `list_audit_repositories`
 * and `get_audit_target` are visible to the coordinator. Specialists get
 * the full toolkit via their own subagent mount.
 */
export default auditToolkit({
  appId: process.env.GITHUB_APP_ID ?? "",
  appPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? "",
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? "",
  appSlug: process.env.GITHUB_APP_SLUG,
})