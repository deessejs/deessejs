import { disableTool } from "eve/tools"

/**
 * Disable the audit-toolkit__find_similar_issues tool at the root mount.
 * The search itself is read-only, but exposing it at root would expand
 * the attack surface unnecessarily and create a confusing duplicate of
 * the GitHub Search API surface for any mention-loop prompt.
 */
export default disableTool()