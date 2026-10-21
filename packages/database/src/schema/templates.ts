/**
 * Official template catalog.
 *
 * Two tables split by data ownership, not by history:
 *
 * - `templates` is the editorial record. Admin-owned fields live here: the
 *   public slug, the display name, the curated labels, the category, the
 *   curated license fallback and the access classification.
 * - `template_repository_snapshots` is the current GitHub observation. It
 *   holds one row per template and is replaced wholesale on a successful
 *   refresh.
 *
 * The split is what keeps a refresh from overwriting editorial fields. A
 * refresh only ever writes the snapshot table.
 *
 * A template is publicly readable only when both rows exist. The snapshot's
 * primary key is the foreign key, so there is at most one current snapshot
 * per template, and `onDelete: "restrict"` keeps a snapshot from outliving
 * the editorial row it describes.
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
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Access classification for an official template.
 *
 * This is a server-controlled label, not an entitlement. It does not
 * authorize downloads and it does not implement billing. Every current
 * record is `free`.
 */
export const templateAccess = pgEnum("template_access", ["free", "paid"])

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique("templates_slug_unique"),
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
