import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/**
 * Application-owned organization state.
 *
 * Two tables back the mandatory first-organization onboarding flow:
 *
 * - `accountOrganizationDefaults` — permanent, immutable relation
 *   between an account and the organization created during that
 *   account's onboarding. Independent of the active-organization
 *   session field. One row per account.
 *
 * - `accountOrganizationProvisioning` — durable provisioning record
 *   for the onboarding operation: lease, fencing token, and
 *   state-machine progression. One row per account. Cleared by
 *   the provisioning service once the default row exists and the
 *   organization is durable.
 *
 * Declarations only. Foreign keys to the Better Auth plugin tables
 * (`user.id`, `organization.id`, the composite `member` pair) live
 * alongside the last-owner trigger design — the trigger and the
 * application state share a single migration so a destructive
 * cascade cannot split them.
 *
 * The `not null` / `default` defaults on `status` and `fencingToken`
 * are deliberate: the application state machine is the source of
 * truth and the schema only needs to store the value. `status` is
 * plain `text` rather than a Drizzle pgEnum because the state-machine
 * set (`pending`, `organization_created`, `membership_verified`,
 * `completed`) is owned by the application boundary; coupling the
 * schema to the enum here would force a destructive migration when
 * the set later grows.
 */

export const accountOrganizationDefaults = pgTable(
  "account_organization_defaults",
  {
    userId: text("user_id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_organization_defaults_org_idx").on(table.organizationId),
  ],
)

export const accountOrganizationProvisioning = pgTable(
  "account_organization_provisioning",
  {
    userId: text("user_id").primaryKey(),
    operationId: text("operation_id").notNull().unique(),
    organizationId: text("organization_id"),
    requestedName: text("requested_name").notNull(),
    requestedSlug: text("requested_slug").notNull(),
    status: text("status").notNull().default("pending"),
    leaseUntil: timestamp("lease_until"),
    fencingToken: bigint("fencing_token", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
)
