import type { UseCaseTab } from "../_components/use-case-tabs"

/**
 * Group 1 - the four existing internal-tools clusters (auth +
 * RBAC, operator console, support + tickets, automation),
 * condensed from the inline CAPABILITY_CLUSTERS array.
 *
 * Group 2 - four new "behind the curtain" pillars: scoped
 * impersonation, audit replay, CSAT tracker, scheduled jobs.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "better-auth-rbac",
    iconName: "Lock",
    title: "Auth & RBAC",
    description:
      "Operator identity sits behind the same wall as customer identity, with role-based gating.",
  },
  {
    slug: "admin-table",
    iconName: "Layers",
    title: "Operator console",
    description:
      "The surface the support team operates from. Same data the customer sees, scoped to the operator's role.",
  },
  {
    slug: "ticket-in-context",
    iconName: "MessageSquare",
    title: "Support & tickets",
    description:
      "The inbox your support team works in. Tied to the product surface, not a separate vendor.",
  },
  {
    slug: "feature-flag",
    iconName: "Workflow",
    title: "Automation",
    description:
      "Background work the operator team sets up once and forgets.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "impersonate",
    iconName: "Lock",
    title: "Impersonation",
    description:
      "Scoped impersonation tokens with an audit row. The support team can act as a customer, and the row records who, when, why.",
  },
  {
    slug: "audit-replay",
    iconName: "ShieldCheck",
    title: "Audit replay",
    description:
      "The audit log is replayable. A buyer in a regulated vertical can re-run the full history of an org's actions on demand.",
  },
  {
    slug: "csat-tracker",
    iconName: "LineChart",
    title: "CSAT tracker",
    description:
      "Per-operator response time and customer rating surface in the same dashboard. The data the support manager needs is on the same screen as the team.",
  },
  {
    slug: "scheduled-job",
    iconName: "Workflow",
    title: "Scheduled jobs",
    description:
      "Cron-style tasks share the same trace, log, and retry policy as the rest of the app. A failing job is a typed event, not a shell-script surprise.",
  },
]
