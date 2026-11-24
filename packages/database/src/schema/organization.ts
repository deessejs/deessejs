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

import { member, organization, user } from "./auth.js"

/**
 * The states an operation goes through.
 *
 * `pending` is the state of an attempt that is in flight and may
 * still create an organization.
 *
 * `superseded` is the state of an attempt that has been taken over.
 * Its leftovers are being reconciled, and the reconciliation holds the
 * account, so the state is covered by the partial unique index below
 * exactly like `pending` is.
 *
 * `completed` and `failed` are terminal, and the index covers neither
 * of them: a finished operation never stands in the way of the next
 * creation.
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
  value: string
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
    // One in-flight operation per account. The index is the
    // serialization: a second attempt for the same account cannot
    // insert one while an attempt is running or while the leftovers
    // of a taken-over attempt are being reconciled.
    uniqueIndex("organization_provisioning_in_flight_user_uidx")
      .on(table.userId)
      .where(sql`${table.status} IN ('pending', 'superseded')`),
    index("organization_provisioning_user_idx").on(table.userId),
  ]
)

export type OrganizationProvisioningRow =
  typeof organizationProvisioning.$inferSelect
export type NewOrganizationProvisioningRow =
  typeof organizationProvisioning.$inferInsert

/** An explicit allocation of one purchased Pro seat to an organization member. */
export const organizationProSeat = pgTable(
  "organization_pro_seat",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_pro_seat_member_uidx").on(
      table.organizationId,
      table.memberId
    ),
    index("organization_pro_seat_member_idx").on(table.memberId),
  ]
)

export type OrganizationProSeatRow = typeof organizationProSeat.$inferSelect
