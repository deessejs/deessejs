"use client"

/**
 * Hono + oRPC endpoint mockup.
 *
 * Two panes side-by-side:
 *   - left: the request line types in, with method (GET), path, status
 *   - right: the typed response renders after a short delay, showing
 *     real-looking JSON for a SaaS org record
 *
 * Visual reference: Stripe / Linear / Vercel request inspectors.
 * One pane = one capability: "your agent consumes the contract, not
 * the implementation."
 */

import { useCallback, useState } from "react"
import { useTypewriter } from "@/hooks/mockups/use-typewriter"
import * as m from "motion/react-m"
import { Check } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import { MockupMotionBoundary } from "./motion-boundary"

const REQUEST = "GET /v1/orgs/org_2nK9xR/billing"
const REQUEST_DURATION_MS = REQUEST.length * 35

type Status = "idle" | "requesting" | "responded"

const RESPONSE_JSON = `{
  "id": "org_2nK9xR",
  "name": "Acme Labs",
  "plan": "pro",
  "mrr": 1127,
  "seats": 8,
  "stripe_customer_id": "cus_R8x2Wq"
}`

export function ApiEndpointMockup() {
  const [status, setStatus] = useState<Status>("requesting")
  const complete = useCallback(() => setStatus("responded"), [])
  const shown = useTypewriter(REQUEST, 300, 35, false, complete)

  return (
    <MockupMotionBoundary>
      <div className="flex flex-col gap-0 divide-y divide-border lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Request pane */}
        <div className="flex flex-col gap-3 bg-zinc-950 p-4 font-mono text-copy-13">
          <div className="flex items-center justify-between text-label-12 tracking-wider text-zinc-500 uppercase">
            <span>Request</span>
            <span>oRPC</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-100">
            <span className="rounded-sm bg-cyan-500/20 px-1.5 py-0.5 text-cyan-300">
              GET
            </span>
            <span className="flex-1 truncate">
              {shown}
              {status === "requesting" ? (
                <span
                  aria-hidden
                  className="ml-px inline-block h-3 w-px animate-pulse bg-zinc-100"
                />
              ) : null}
            </span>
          </div>
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: REQUEST_DURATION_MS / 1000 + 0.6,
              duration: 0.3,
            }}
            className="flex items-center gap-2 text-label-12 text-zinc-500"
          >
            <Check className="size-3 text-emerald-400" aria-hidden />
            <span>contract: ORG_READ</span>
            <span className="text-zinc-700">. </span>
            <span>auth: session</span>
          </m.div>
        </div>

        {/* Response pane */}
        <div className="flex flex-col gap-3 bg-zinc-950 p-4 font-mono text-copy-13">
          <div className="flex items-center justify-between text-label-12 tracking-wider text-zinc-500 uppercase">
            <span>Response</span>
            <ResponseStatusBadge status={status} />
          </div>
          <m.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: status === "responded" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto whitespace-pre text-zinc-100"
          >
            {RESPONSE_JSON}
          </m.pre>
        </div>
      </div>
    </MockupMotionBoundary>
  )
}

function ResponseStatusBadge({ status }: { status: Status }) {
  if (status === "responded") {
    return (
      <m.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-1 rounded-sm bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300"
        )}
      >
        200 OK
      </m.span>
    )
  }
  return (
    <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
      ...
    </span>
  )
}
