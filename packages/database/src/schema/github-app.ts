import {
  boolean,
  integer,
  index,
  pgEnum,
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

/** A GitHub repository imported into a DeesseJS organization. */
export const githubProject = pgTable(
  "github_project",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id").notNull(),
    repositoryFullName: text("repository_full_name").notNull(),
    repositoryUrl: text("repository_url").notNull(),
    isPrivate: boolean("is_private").notNull().default(false),
    defaultBranch: text("default_branch").notNull(),
    configurationPath: text("configuration_path")
      .notNull()
      .default("deesse.json"),
    importedByUserId: text("imported_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("github_project_org_repository_config_uidx").on(
      table.organizationId,
      table.repositoryId,
      table.configurationPath
    ),
    index("github_project_organization_idx").on(table.organizationId),
  ]
)

export const githubProjectCheckStatus = pgEnum("github_project_check_status", [
  "valid",
  "needs_revalidation",
  "configuration_invalid",
  "access_unavailable",
  "check_failed",
])

/** A metadata-only result from reviewing an imported project's configuration. */
export const githubProjectCheck = pgTable(
  "github_project_check",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => githubProject.id, { onDelete: "cascade" }),
    status: githubProjectCheckStatus("status").notNull(),
    commitSha: text("commit_sha"),
    formatVersion: integer("format_version"),
    pathCount: integer("path_count"),
    aliasCount: integer("alias_count"),
    checkedAt: timestamp("checked_at").defaultNow().notNull(),
  },
  (table) => [
    index("github_project_check_project_checked_idx").on(
      table.projectId,
      table.checkedAt
    ),
  ]
)

export type GitHubAppInstallationRow = typeof githubAppInstallation.$inferSelect
export type NewGitHubAppInstallationRow =
  typeof githubAppInstallation.$inferInsert
export type GitHubProjectRow = typeof githubProject.$inferSelect
export type NewGitHubProjectRow = typeof githubProject.$inferInsert
export type GitHubProjectCheckRow = typeof githubProjectCheck.$inferSelect
export type NewGitHubProjectCheckRow = typeof githubProjectCheck.$inferInsert
