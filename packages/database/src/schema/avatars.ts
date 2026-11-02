import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { organization, user } from "./auth.js"

/** Server-owned metadata for finalized avatar objects in private R2 storage. */
export const storageObjects = pgTable(
  "storage_objects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    state: text("state").notNull().default("pending"),
    contentType: text("content_type"),
    byteSize: integer("byte_size"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    cleanupAfter: timestamp("cleanup_after", { withTimezone: true }),
  },
  (table) => [
    check(
      "storage_objects_state_check",
      sql`${table.state} IN ('pending', 'ready', 'delete_pending')`
    ),
    check(
      "storage_objects_ready_metadata_check",
      sql`${table.state} <> 'ready' OR (${table.contentType} = 'image/webp' AND ${table.byteSize} IS NOT NULL AND ${table.verifiedAt} IS NOT NULL)`
    ),
    index("storage_objects_cleanup_idx").on(table.cleanupAfter),
  ]
)

/** A short-lived browser upload and its server-only staging key. */
export const storageUploads = pgTable(
  "storage_uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectId: uuid("object_id")
      .notNull()
      .unique()
      .references(() => storageObjects.id, { onDelete: "cascade" }),
    stagedKey: text("staged_key").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    expectedContentType: text("expected_content_type").notNull(),
    expectedByteSize: integer("expected_byte_size").notNull(),
    state: text("state").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    cleanupAfter: timestamp("cleanup_after", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "storage_uploads_state_check",
      sql`${table.state} IN ('pending', 'promoted', 'delete_pending')`
    ),
    check(
      "storage_uploads_expected_byte_size_check",
      sql`${table.expectedByteSize} > 0`
    ),
    index("storage_uploads_cleanup_idx").on(table.cleanupAfter),
  ]
)

export const userAvatars = pgTable("user_avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  objectId: uuid("object_id")
    .notNull()
    .unique()
    .references(() => storageObjects.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const organizationAvatars = pgTable("organization_avatars", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  objectId: uuid("object_id")
    .notNull()
    .unique()
    .references(() => storageObjects.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
