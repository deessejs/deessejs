"use client"

import * as React from "react"
import { LazyMotion, domAnimation } from "motion/react"

/**
 * Shared `LazyMotion` boundary for the use-case mockups.
 *
 * Each mockup imports `m` from `motion/react-m` and renders inside
 * this provider. `domAnimation` covers every animation the mockups
 * use today (opacity / transform / `AnimatePresence`); if a mockup
 * later needs pan / drag / layout animations, swap to `domMax`.
 *
 * Wrapping each mockup individually keeps the provider inside the
 * existing `"use client"` boundary of every mockup file and avoids
 * pulling `domMax` into the bundle for animations that only a few
 * mockups need.
 */
export function MockupMotionBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}