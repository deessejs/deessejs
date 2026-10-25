/**
 * The organization provisioning operation.
 *
 * Creating an organization is not one statement. The plugin's create
 * endpoint writes the organization, then its membership, then the
 * caller's active selection, and the process can die between them.
 * This table is the record of the attempt, so an interrupted creation
 * can be found, reconciled and either adopted or cleaned up.
 *
 * The row is also the fence. Every write the flow makes is conditional
 * on the operation id and on the status being `pending`, so an attempt
 * that has been taken over cannot create anything.
 *
 * The operation id is the marker that travels with the organization's
 * own insert, as its metadata. That marker is what proves an
 * organization belongs to an attempt, and it is written in the same
 * statement as the row it names.
 */
import { sql } from "drizzle-orm"
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { user } from "./auth.js"

/**
 * The states an operation goes through.
 *
 * `pending` is the only state that blocks the next attempt: the
 * partial unique index below covers it and nothing else, so a finished
 * operation never stands in the way of the next creation.
 *
 * `superseded` means another attempt took the operation over. The
 * attempt that lost still holds its own row until it notices.
 */
export type OrganizationProvisioningStatus =
  | "pending"
  | "completed"
  | "failed"
  | "superseded"

export const ORGANIZATION_PROVISIONING_STATUS: {
  readonly [K in OrganizationProvisioningStatus]: K
} = {
  pending: "pending",
  completed: "completed",
  failed: "failed",
  superseded: "superseded",
}

/** Whether the value is one of the operation's states. */
export const isOrganizationProvisioningStatus = (
  value: string,
): value is OrganizationProvisioningStatus =>
  value === ORGANIZATION_PROVISIONING_STATUS.pending ||
  value === ORGANIZATION_PROVISIONING_STATUS.completed ||
  value === ORGANIZATION_PROVISIONING_STATUS.failed ||
  value === ORGANIZATION_PROVISIONING_STATUS.superseded


export const organizationProvisioning = pgTable(
  "organization_provisioning",
  {
    // The operation id, and the fencing token. Every write the flow
    // and the hooks make is conditional on it.
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // The candidate being tried right now. The organization the
    // operation produced carries this slug.
    slug: text("slug").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull(),
    // The heartbeat. See the lease.
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    // One pending operation per account. The index is the
    // serialization: a second attempt for the same account cannot
    // insert one.
    uniqueIndex("organization_provisioning_pending_user_uidx")
      .on(table.userId)
      .where(sql`${table.status} = 'pending'`),
    index("organization_provisioning_user_idx").on(table.userId),
  ],
)

export type OrganizationProvisioningRow =
  typeof organizationProvisioning.$inferSelect
export type NewOrganizationProvisioningRow =
  typeof organizationProvisioning.$inferInsert
