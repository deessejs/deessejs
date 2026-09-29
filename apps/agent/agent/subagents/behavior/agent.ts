import {
  defineAgent,
  defineDynamic,
  type DynamicSentinel,
} from "eve"
import { minimax } from "vercel-minimax-ai-provider"

/**
 * Behavior specialist of the nightly DeesseJS audit.
 *
 * Inspects the entire main-branch checkout of one assigned repository and
 * reports one audit issue per distinct, verified behavioral defect.
 *
 * Sandboxed independently of the coordinator (see ./sandbox.ts). The
 * audit toolkit is mounted under ./extensions/audit-toolkit/ because eve
 * does not inherit parent tools into declared subagents.
 *
 * Exposed only via defineDynamic. The resolver returns the agent config
 * for sessions whose principal is the runtime (schedules authenticate as
 * authenticator: "app", principalType: "runtime"). Mention-loop sessions
 * authenticate as the commenting GitHub user; for those, the resolver
 * returns null and the subagent is not even visible to the parent model.
 * This is the code-level enforcement for P1.3 of the review.
 *
 * The explicit `DynamicSentinel` annotation mirrors apps/agent/agent/agent.ts:
 * it avoids TS2883 from tsc --noEmit when the inferred default-export type
 * references a hoisted @ai-sdk/provider type.
 */
const agent: DynamicSentinel = defineDynamic({
  events: {
    "session.started": (_event, ctx) => {
      const initiator = ctx.session.auth.initiator
      if (
        initiator &&
        initiator.authenticator === "app" &&
        initiator.principalType === "runtime"
      ) {
        return defineAgent({
          description:
            "Audit a complete main-branch checkout of a repository for " +
            "behavioral defects: incorrect flows, edge cases, error " +
            "propagation, API behavior changes, and user-visible " +
            "regressions. Always verifies a suspected defect against " +
            "the checked-out code before reporting it. Reports findings " +
            "via audit-toolkit__create_audit_issue; does not edit the " +
            "repository or open pull requests.",
          model: minimax("MiniMax-M3"),
        })
      }
      return null
    },
  },
})

export default agent