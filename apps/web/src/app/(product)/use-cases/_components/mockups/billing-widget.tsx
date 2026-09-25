"use client"

/**
 * Usage bar fills from 0 to 74% on mount. The percentage label counts
 * up at the same time.
 */

import * as m from "motion/react-m"

import { MockupMotionBoundary } from "./motion-boundary"

export function BillingWidgetMockup() {
  return (
    <MockupMotionBoundary>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-copy-13 text-muted-foreground">
            Pro Plan
          </span>
          <span className="font-mono text-copy-13 text-foreground">$49/mo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <m.div
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              style={{ transformOrigin: "left center" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-[74%] rounded-full bg-emerald-500"
            />
          </div>
          <m.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0, duration: 0.3 }}
            className="font-mono text-label-12 text-muted-foreground"
          >
            74%
          </m.span>
        </div>
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.1, duration: 0.3 }}
          className="flex items-center justify-between font-mono text-label-12 text-muted-foreground"
        >
          <span>7,423 / 10,000</span>
          <span>MRR $1,127</span>
        </m.div>
      </div>
    </MockupMotionBoundary>
  )
}