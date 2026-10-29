import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth.js"

/** A user's encrypted GitHub App OAuth credentials, separate from login accounts. */
export const githubUserConnection = pgTable(
  "github_user_connection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    githubUserId: text("github_user_id").notNull(),
    githubLogin: text("github_login").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("github_user_connection_user_uidx").on(table.userId),
    uniqueIndex("github_user_connection_github_user_uidx").on(
      table.githubUserId
    ),
  ]
)

/** The GitHub App installation associated with a DeesseJS organization. */
export const githubAppInstallation = pgTable(
  "github_app_installation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    installationId: text("installation_id").notNull(),
    accountId: text("account_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type").notNull(),
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
    uniqueIndex("github_app_installation_organization_uidx").on(
      table.organizationId
    ),
    index("github_app_installation_installation_idx").on(table.installationId),
    index("github_app_installation_linked_by_user_idx").on(
      table.linkedByUserId
    ),
  ]
)

export type GitHubAppInstallationRow = typeof githubAppInstallation.$inferSelect
export type NewGitHubAppInstallationRow =
  typeof githubAppInstallation.$inferInsert
