import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth.js"
import { githubProject } from "./github-app.js"

/** One-time server-side OAuth state used to reject callback replays. */
export const vercelOAuthState = pgTable(
  "vercel_oauth_state",
  {
    stateHash: text("state_hash").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [index("vercel_oauth_state_expires_idx").on(table.expiresAt)]
)

/** Vercel installation metadata owned by one DeesseJS organization. */
export const vercelOrganizationConnection = pgTable(
  "vercel_organization_connection",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    configurationId: text("configuration_id").notNull(),
    teamId: text("team_id"),
    accountId: text("account_id").notNull(),
    accountName: text("account_name").notNull(),
    linkedByUserId: text("linked_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "vercel_connection_org_fk",
      columns: [table.organizationId],
      foreignColumns: [organization.id],
    }).onDelete("cascade"),
    uniqueIndex("vercel_connection_organization_uidx").on(table.organizationId),
    uniqueIndex("vercel_connection_configuration_uidx").on(
      table.configurationId
    ),
    index("vercel_connection_linked_by_user_idx").on(table.linkedByUserId),
  ]
)

/**
 * A one-to-one mapping from the canonical imported DeesseJS project row
 * (currently `github_project`) to a Vercel project.
 */
export const vercelProjectMapping = pgTable(
  "vercel_project_mapping",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => githubProject.id, { onDelete: "cascade" }),
    vercelProjectId: text("vercel_project_id").notNull(),
    vercelProjectName: text("vercel_project_name").notNull(),
    updatedByUserId: text("updated_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("vercel_project_mapping_project_uidx").on(table.projectId),
    uniqueIndex("vercel_project_mapping_org_vercel_project_uidx").on(
      table.organizationId,
      table.vercelProjectId
    ),
    index("vercel_project_mapping_organization_idx").on(table.organizationId),
  ]
)
