"use client"

/**
 * Reusable product UI mockups for use-case pages.
 *
 * Sourced from apps/web/src/app/(marketing)/_components/contracts-grid.tsx
 * (AuthFlowMockup, DbTerminalMockup, BillingWidgetMockup, OtelWaterfallMockup)
 * and re-exported here so the use-case pages can render them in larger
 * sections without duplicating Motion wiring.
 *
 * All mockups use viewport-driven animations (`whileInView`) so they
 * fire once when scrolled into view, then stay in their final state.
 * They respect `MotionConfig reducedMotion="user"` from the layout.
 */

export { AuthFlowMockup } from "./auth-flow"
export { DbTerminalMockup } from "./db-terminal"
export { BillingWidgetMockup } from "./billing-widget"
export { OtelWaterfallMockup } from "./otel-waterfall"
export { ApiEndpointMockup } from "./api-endpoint"
export { CmsEditorMockup } from "./cms-editor"
export { MultiTenantSwitcherMockup } from "./multi-tenant-switcher"
export { AdminDashboardMockup } from "./admin-dashboard"
export { AgentLoopMockup } from "./agent-loop"
export { StreamingChatMockup } from "./streaming-chat"
export { OnboardingMockup } from "./onboarding"
export { ProductTableMockup } from "./product-table"
export { QueueLogMockup } from "./queue-log"
export { NotificationsInboxMockup } from "./notifications-inbox"
export { KnowledgeRetrievalMockup } from "./knowledge-retrieval"
