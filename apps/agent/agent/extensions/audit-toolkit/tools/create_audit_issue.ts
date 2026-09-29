import { disableTool } from "eve/tools"

/**
 * Disable the audit-toolkit__create_audit_issue tool at the root mount.
 * Issue publication is restricted to the specialist subagent. The root
 * agent must never be able to create issues even if a hostile mention
 * comment convinces it to try.
 */
export default disableTool()