import { sql } from "drizzle-orm"
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { organization, user } from "./auth.js"

export const blockReviewStatus = pgEnum("block_review_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
])
export const blockPublicationState = pgEnum("block_publication_state", [
  "private",
  "current",
  "superseded",
])
export const blockOwnerType = pgEnum("block_owner_type", [
  "organization",
  "platform",
])

/** A submitted block revision. Descriptor JSON is captured from its pinned source commit. */
export const blockPublications = pgTable(
  "block_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerType: blockOwnerType("owner_type").notNull().default("organization"),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "restrict",
    }),
    organizationSlug: text("organization_slug"),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull(),
    repositoryUrl: text("repository_url").notNull(),
    subdirectory: text("subdirectory").notNull().default(""),
    sourceCommit: text("source_commit").notNull(),
    descriptor: text("descriptor").notNull(),
    reviewStatus: blockReviewStatus("review_status")
      .notNull()
      .default("pending"),
    publicationState: blockPublicationState("publication_state")
      .notNull()
      .default("private"),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    reviewReason: text("review_reason"),
  },
  (table) => [
    check(
      "block_publications_commit_sha_check",
      sql`${table.sourceCommit} ~ '^[0-9a-f]{40}$'`
    ),
    check(
      "block_publications_owner_check",
      sql`(${table.ownerType} = 'organization' AND ${table.organizationId} IS NOT NULL AND ${table.organizationSlug} IS NOT NULL) OR (${table.ownerType} = 'platform' AND ${table.organizationId} IS NULL AND ${table.organizationSlug} IS NULL)`
    ),
    index("block_publications_org_slug_submitted_idx").on(
      table.organizationId,
      table.slug,
      table.submittedAt.desc()
    ),
    uniqueIndex("block_publications_one_pending_slug_uidx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.reviewStatus} = 'pending'`),
    uniqueIndex("block_publications_one_current_slug_uidx")
      .on(table.organizationSlug, table.slug)
      .where(
        sql`${table.publicationState} = 'current' AND ${table.ownerType} = 'organization'`
      ),
    uniqueIndex("block_publications_platform_current_slug_uidx")
      .on(table.slug)
      .where(
        sql`${table.publicationState} = 'current' AND ${table.ownerType} = 'platform'`
      ),
  ]
)
