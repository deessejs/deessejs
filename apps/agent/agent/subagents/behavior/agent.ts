import { defineAgent, type DefinedAgent } from "eve"
import { minimax } from "vercel-minimax-ai-provider"

/**
 * Behavior specialist of the nightly DeesseJS audit.
 *
 * Inspects the entire main-branch checkout of one assigned repository and
 * reports one audit issue per distinct, verified behavioral defect.
 *
 * Sandboxed independently of the coordinator (see ./sandbox.ts). The
 * audit toolkit is mounted under ./extensions/audit-toolkit/ because eve
 * does not inherit parent tools into declared subagents. The
 * `DefinedAgent` annotation mirrors apps/agent/agent/agent.ts: it avoids
 * TS2883 from tsc --noEmit when the inferred default-export type
 * references a hoisted @ai-sdk/provider v3 type.
 */
const agent: DefinedAgent = defineAgent({
  description:
    "Audit a complete main-branch checkout of a repository for behavioral " +
    "defects: incorrect flows, edge cases, error propagation, API behavior " +
    "changes, and user-visible regressions. Always verifies a suspected " +
    "defect against the checked-out code before reporting it. Reports " +
    "findings via audit-toolkit__create_audit_issue; does not edit the " +
    "repository or open pull requests.",
  model: minimax("MiniMax-M3"),
})

export default agent