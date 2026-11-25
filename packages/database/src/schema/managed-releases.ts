import { sql } from "drizzle-orm"
import {
  check,
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
import { blockPublications } from "./blocks.js"

export const managedReleaseKind = pgEnum("managed_release_kind", ["template", "block"])
export const managedReleaseOwnerType = pgEnum("managed_release_owner_type", ["platform", "organization"])
export const managedReleaseStatus = pgEnum("managed_release_status", ["ready", "withdrawn"])
export const managedReleaseUploadState = pgEnum("managed_release_upload_state", ["pending", "sealing", "failed", "completed", "cancelled", "expired"])

/** Immutable, source-neutral release metadata. Artifact bytes live in private object storage. */
export const managedReleases = pgTable("managed_releases", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: managedReleaseKind("kind").notNull(),
  ownerType: managedReleaseOwnerType("owner_type").notNull(),
  organizationId: text("organization_id").references(() => organization.id, { onDelete: "restrict" }),
  templateId: uuid("template_id").references(() => templates.id, { onDelete: "restrict" }),
  blockPublicationId: uuid("block_publication_id").references(() => blockPublications.id, { onDelete: "restrict" }),
  slug: text("slug").notNull(),
  version: text("version").notNull(),
  archiveKey: text("archive_key").notNull().unique(),
  digest: text("digest").notNull(),
  descriptorDigest: text("descriptor_digest").notNull(),
  previewKey: text("preview_key"),
  archiveSize: integer("archive_size").notNull(),
  publishedBy: text("published_by").notNull().references(() => user.id, { onDelete: "restrict" }),
  status: managedReleaseStatus("status").notNull().default("ready"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true, mode: "date" }),
}, (table) => [
  check("managed_releases_owner_scope_check", sql`(${table.ownerType} = 'platform' AND ${table.organizationId} IS NULL) OR (${table.ownerType} = 'organization' AND ${table.organizationId} IS NOT NULL)`),
  check("managed_releases_target_check", sql`(${table.kind} = 'template' AND ${table.templateId} IS NOT NULL AND ${table.blockPublicationId} IS NULL) OR (${table.kind} = 'block' AND ${table.blockPublicationId} IS NOT NULL AND ${table.templateId} IS NULL)`),
  check("managed_releases_version_check", sql`${table.version} ~ '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$'`),
  check("managed_releases_digest_check", sql`${table.digest} ~ '^[a-f0-9]{64}$' AND ${table.descriptorDigest} ~ '^[a-f0-9]{64}$'`),
  check("managed_releases_archive_size_check", sql`${table.archiveSize} > 0 AND ${table.archiveSize} <= 104857600`),
  check("managed_releases_withdrawal_check", sql`(${table.status} = 'ready' AND ${table.withdrawnAt} IS NULL) OR (${table.status} = 'withdrawn' AND ${table.withdrawnAt} IS NOT NULL)`),
  uniqueIndex("managed_releases_template_version_uidx").on(table.templateId, table.version).where(sql`${table.kind} = 'template'`),
  uniqueIndex("managed_releases_block_version_uidx").on(table.blockPublicationId, table.version).where(sql`${table.kind} = 'block'`),
  index("managed_releases_latest_idx").on(table.kind, table.slug, table.createdAt),
])

/** Fenced short-lived transfer attempt. An attempt is not a release until sealed and committed. */
export const managedReleaseUploads = pgTable("managed_release_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  idempotencyKey: text("idempotency_key").notNull(),
  requestFingerprint: text("request_fingerprint").notNull(),
  kind: managedReleaseKind("kind").notNull(),
  ownerType: managedReleaseOwnerType("owner_type").notNull(),
  organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => templates.id, { onDelete: "cascade" }),
  blockPublicationId: uuid("block_publication_id").references(() => blockPublications.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  version: text("version").notNull(),
  digest: text("digest").notNull(),
  descriptorDigest: text("descriptor_digest").notNull(),
  archiveSize: integer("archive_size").notNull(),
  stagedKey: text("staged_key").notNull().unique(),
  state: managedReleaseUploadState("state").notNull().default("pending"),
  fence: integer("fence").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  check("managed_release_uploads_owner_scope_check", sql`(${table.ownerType} = 'platform' AND ${table.organizationId} IS NULL) OR (${table.ownerType} = 'organization' AND ${table.organizationId} IS NOT NULL)`),
  check("managed_release_uploads_target_check", sql`(${table.kind} = 'template' AND ${table.templateId} IS NOT NULL AND ${table.blockPublicationId} IS NULL) OR (${table.kind} = 'block' AND ${table.blockPublicationId} IS NOT NULL AND ${table.templateId} IS NULL)`),
  check("managed_release_uploads_digest_check", sql`${table.digest} ~ '^[a-f0-9]{64}$' AND ${table.descriptorDigest} ~ '^[a-f0-9]{64}$'`),
  check("managed_release_uploads_archive_size_check", sql`${table.archiveSize} > 0 AND ${table.archiveSize} <= 104857600`),
  uniqueIndex("managed_release_uploads_idempotency_uidx").on(table.createdBy, table.idempotencyKey),
  index("managed_release_uploads_expiry_idx").on(table.state, table.expiresAt),
])
