/**
 * Template records, their ownership and their current GitHub observations.
 *
 * Two tables split by data ownership, not by history:
 *
 * - `templates` is the editorial record. Official fields are platform-owned;
 *   organization records are private to the organization that owns them.
 *   Both store display fields, category, labels and license fallback here.
 * - `template_repository_snapshots` is the current GitHub observation. It
 *   holds one row per template and is replaced wholesale on a successful
 *   refresh.
 *
 * The split is what keeps a refresh from overwriting editorial fields. A
 * refresh only ever writes the snapshot table.
 *
 * A template is readable only through a route authorized for its owner and
 * when both rows exist. The snapshot's primary key is the foreign key, so
 * there is at most one current snapshot per template. Foreign keys preserve
 * template records and snapshots until an explicit deletion policy exists.
 *
 * The shape deliberately departs from `auth.ts`, which is Better Auth
 * generated output with text IDs and naive timestamps. This table is
 * hand-written and stores GitHub instants, so it uses UUID internal IDs, a
 * finite `free`/`paid` enum and `timestamptz`.
 */
import { relations, sql } from "drizzle-orm"
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
import { organization } from "./auth.js"

/**
 * Access classification for an official template.
 *
 * This is a server-controlled label, not an entitlement. It does not
 * authorize downloads and it does not implement billing. Every current
 * record is `free`.
 */
export const templateAccess = pgEnum("template_access", ["free", "paid"])
export const templateOwnerType = pgEnum("template_owner_type", [
  "platform",
  "organization",
])

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    ownerType: templateOwnerType("owner_type").notNull().default("platform"),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    descriptionOverride: text("description_override"),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    category: text("category").notNull(),
    labels: text("labels")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    licenseFallback: text("license_fallback"),
    access: templateAccess("access").notNull().default("free"),
    imageName: text("image_name"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    // The public URL segment and the CLI address. A whitespace-only slug
    // would produce an unroutable public path.
    check("templates_slug_nonempty", sql`length(btrim(${table.slug})) > 0`),
    check(
      "templates_owner_scope_consistent",
      sql`(${table.ownerType} = 'platform' AND ${table.organizationId} IS NULL) OR (${table.ownerType} = 'organization' AND ${table.organizationId} IS NOT NULL)`
    ),
    check("templates_name_nonempty", sql`length(btrim(${table.name})) > 0`),
    // The acquisition locator. Both halves are needed to resolve a
    // repository, so neither may be blank.
    check("templates_owner_nonempty", sql`length(btrim(${table.owner})) > 0`),
    check("templates_repo_nonempty", sql`length(btrim(${table.repo})) > 0`),
    check(
      "templates_category_nonempty",
      sql`length(btrim(${table.category})) > 0`
    ),
    // Serves the catalog ordering: sortOrder, then slug. Without it every
    // list call sorts the whole table.
    index("templates_sortOrder_slug_idx").on(table.sortOrder, table.slug),
    // Official catalog slugs are global. Private slugs are unique only
    // within their organization, so the same name can be reused elsewhere.
    uniqueIndex("templates_platform_slug_uidx")
      .on(table.slug)
      .where(sql`${table.ownerType} = 'platform'`),
    uniqueIndex("templates_organization_slug_uidx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.ownerType} = 'organization'`),
  ]
)

export const templateRepositorySnapshots = pgTable(
  "template_repository_snapshots",
  {
    // Primary key and foreign key at once: this is what enforces at most
    // one current snapshot per template.
    templateId: uuid("template_id")
      .primaryKey()
      .references(() => templates.id, { onDelete: "restrict" }),
    repositoryName: text("repository_name").notNull(),
    repositoryDescription: text("repository_description"),
    canonicalUrl: text("canonical_url").notNull(),
    license: text("license"),
    topics: text("topics")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    readme: text("readme"),
    repositoryUpdatedAt: timestamp("repository_updated_at", {
      withTimezone: true,
      mode: "date",
    }),
    stars: integer("stars"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "template_repository_snapshots_stars_nonnegative",
      sql`${table.stars} >= 0`
    ),
    check(
      "template_repository_snapshots_repository_name_nonempty",
      sql`length(btrim(${table.repositoryName})) > 0`
    ),
    // The canonical URL is what projects to the public clone URL. An
    // empty one would produce an unroutable clone target.
    check(
      "template_repository_snapshots_canonical_url_nonempty",
      sql`length(btrim(${table.canonicalUrl})) > 0`
    ),
  ]
)

export const templateRelations = relations(templates, ({ one }) => ({
  snapshot: one(templateRepositorySnapshots, {
    fields: [templates.id],
    references: [templateRepositorySnapshots.templateId],
  }),
}))

export const templateRepositorySnapshotRelations = relations(
  templateRepositorySnapshots,
  ({ one }) => ({
    template: one(templates, {
      fields: [templateRepositorySnapshots.templateId],
      references: [templates.id],
    }),
  })
)

export type TemplateRow = typeof templates.$inferSelect
export type NewTemplateRow = typeof templates.$inferInsert
export type TemplateRepositorySnapshotRow =
  typeof templateRepositorySnapshots.$inferSelect
export type NewTemplateRepositorySnapshotRow =
  typeof templateRepositorySnapshots.$inferInsert
