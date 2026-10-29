import { sql } from "drizzle-orm"
import {
  check,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { organization, user } from "./auth.js"
import { templates } from "./templates.js"

export const templateSubmissionStatus = pgEnum("template_submission_status", [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
])

export const templatePublicationState = pgEnum("template_publication_state", [
  "unpublished",
  "current",
  "superseded",
  "removed",
])

/**
 * An immutable review snapshot of an organization template at a GitHub commit.
 * Review status is independent from publication state so a rejected update
 * never replaces an already published revision.
 */
export const templatePublications = pgTable(
  "template_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    organizationSlug: text("organization_slug").notNull(),
    organizationName: text("organization_name").notNull(),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    reviewStatus: templateSubmissionStatus("review_status")
      .notNull()
      .default("pending"),
    publicationState: templatePublicationState("publication_state")
      .notNull()
      .default("unpublished"),
    sourceCommit: text("source_commit").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    category: text("category").notNull(),
    labels: text("labels")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    imageName: text("image_name"),
    license: text("license").notNull(),
    repositoryName: text("repository_name").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    repositoryDescription: text("repository_description"),
    readme: text("readme"),
    stars: integer("stars"),
    repositoryUpdatedAt: timestamp("repository_updated_at", {
      withTimezone: true,
      mode: "date",
    }),
    distributionRightsConfirmed: boolean("distribution_rights_confirmed")
      .notNull()
      .default(false),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
      mode: "date",
    }),
    reviewReason: text("review_reason"),
    removedBy: text("removed_by").references(() => user.id, {
      onDelete: "restrict",
    }),
    removedAt: timestamp("removed_at", {
      withTimezone: true,
      mode: "date",
    }),
    removalReason: text("removal_reason"),
  },
  (table) => [
    check(
      "template_publications_source_commit_sha_check",
      sql`${table.sourceCommit} ~ '^[0-9a-f]{40}$'`
    ),
    check(
      "template_publications_distribution_rights_confirmed_check",
      sql`${table.distributionRightsConfirmed} = true`
    ),
    check(
      "template_publications_stars_nonnegative",
      sql`${table.stars} IS NULL OR ${table.stars} >= 0`
    ),
    check(
      "template_publications_license_nonempty",
      sql`length(btrim(${table.license})) > 0`
    ),
    index("template_publications_template_submitted_idx").on(
      table.templateId,
      table.submittedAt.desc()
    ),
    index("template_publications_pending_submitted_idx")
      .on(table.submittedAt)
      .where(sql`${table.reviewStatus} = 'pending'`),
    uniqueIndex("template_publications_one_pending_per_template_uidx")
      .on(table.templateId)
      .where(sql`${table.reviewStatus} = 'pending'`),
    uniqueIndex("template_publications_one_current_per_template_uidx")
      .on(table.templateId)
      .where(sql`${table.publicationState} = 'current'`),
    uniqueIndex("template_publications_current_address_uidx")
      .on(table.organizationSlug, table.slug)
      .where(sql`${table.publicationState} = 'current'`),
  ]
)

export type TemplatePublicationRow = typeof templatePublications.$inferSelect
export type NewTemplatePublicationRow = typeof templatePublications.$inferInsert
