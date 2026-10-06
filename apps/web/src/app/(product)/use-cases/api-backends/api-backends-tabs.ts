import type { UseCaseTab } from "../_components/use-case-tabs"

/**
 * Group 1 - the four existing API backend clusters (typed RPC,
 * storage, auth + perimeter, observability), condensed from the
 * inline CAPABILITY_CLUSTERS array.
 *
 * Group 2 - four new "behind the curtain" pillars: OpenAPI
 * generation, pg-mem test harness, service-to-service tokens,
 * OTel waterfall.
 */

export const GROUP_1: ReadonlyArray<UseCaseTab> = [
  {
    slug: "orpc-router",
    iconName: "Workflow",
    title: "Typed RPC",
    description:
      "The wire format is the source of truth. Clients import the type; the server enforces it.",
  },
  {
    slug: "drizzle-schema",
    iconName: "Database",
    title: "Storage layer",
    description:
      "The data shape that the contracts sit on top of. Swap providers without rewriting callers.",
  },
  {
    slug: "rate-limit",
    iconName: "Lock",
    title: "Auth & perimeter",
    description:
      "Same auth and rate limits whether the caller is a user, a partner, or another service.",
  },
  {
    slug: "otel-waterfall",
    iconName: "Activity",
    title: "Observability",
    description:
      "When a partner files an integration ticket, you already know what changed.",
  },
]

export const GROUP_2: ReadonlyArray<UseCaseTab> = [
  {
    slug: "openapi-gen",
    iconName: "Workflow",
    title: "OpenAPI generation",
    description:
      "OpenAPI is generated from the same router the typed clients see. The published spec is the implementation, not a hand-trimmed copy.",
  },
  {
    slug: "pgmem-test",
    iconName: "Database",
    title: "pg-mem test harness",
    description:
      "Tests run against an in-memory Postgres. The CI suite does not need a live database to validate the query layer.",
  },
  {
    slug: "service-token",
    iconName: "KeyRound",
    title: "Service tokens",
    description:
      "Scoped, time-bound tokens with rotation. Internal callers authenticate against the same procedure definition as external ones.",
  },
  {
    slug: "audit-log",
    iconName: "ShieldCheck",
    title: "Audit log",
    description:
      "Sensitive operations record the actor, the action, the resource. Regulated buyers audit this in the first call.",
  },
]
