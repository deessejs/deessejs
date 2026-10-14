import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Auth schema. Runtime source of truth for the tables the Better
// Auth server reads and writes. Columns and constraints here MUST
// stay in lock-step with the Drizzle migration history under
// `./drizzle/`:
//
//   - `0000_boring_steel_serpent.sql` (account, session, user, verification)
//   - `0001_magenta_firebrand.sql`  (deviceCode + the 0000 indexes/FKs)
//   - `0002_admin_plugin_columns.sql` (admin-plugin columns on user
//     and session, plus a `role = 'user'` backfill)
//
// Two non-obvious rules:
//
//   1. The `deviceCode` table name is PascalCase ("deviceCode"), not
//      snake_case. Migration `0001` created it that way and the
//      production database has it as `public."deviceCode"`. The
//      `auth` CLI versions tested here (1.4.22 and 1.6.23) both
//      silently rename the table to `device_code` and drop the
//      unique constraints, the user_id foreign key, the
//      `created_at` / `updated_at` columns, the `status` default
//      of `'pending'`, and the `bigint` type of `polling_interval`
//      when they regenerate this file. They do not emit a matching
//      `ALTER TABLE … RENAME` migration, so the schema and the
//      production database drift apart and every device-flow
//      endpoint breaks at runtime. Do not re-run `auth:generate`
//      until the upstream CLI is fixed; if you must regenerate,
//      restore the `deviceCode` block from `0001_magenta_firebrand.sql`
//      and the unique constraints / FK / indexes below before
//      committing.
//
//   2. The admin plugin owns the four columns on `user` and the
//      `impersonated_by` column on `session`. They are nullable and
//      `banned` defaults to `false`; `role` is backfilled to
//      `'user'` in the `0002` migration. Do not add the plugin
//      twice (e.g. as `additionalFields`) — the plugin already
//      declares them in its server-side schema and a duplicate
//      declaration breaks the inferred User type.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  // Admin plugin (Better Auth) — see the long-form comment above.
  // Nullable so the migration is non-blocking on existing rows;
  // `0002_admin_plugin_columns.sql` backfills every existing row to
  // `'user'`.
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Admin plugin (Better Auth) — set when an admin impersonates a
    // user (V1 does not build the impersonation UI, but the
    // plugin-owned column is left in place for future use).
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

/**
 * Device authorization. The CLI's device-code flow uses this table;
 * the row is created when a CLI user calls `deesse auth login` and
 * is consumed when the user approves or denies on the web side.
 *
 * IMPORTANT: keep this table name PascalCase (`"deviceCode"`) and
 * preserve the unique constraints, foreign key, and indexes that
 * `0001_magenta_firebrand.sql` created. The current `auth` CLI
 * versions (1.4.22, 1.6.23) silently rename the table to
 * `device_code` and drop the constraints, the FK, the
 * `created_at` / `updated_at` columns, the `status` default of
 * `'pending'`, and the `bigint` type of `polling_interval` when
 * regenerating — see the long-form comment at the top of the
 * file. If you regenerate, restore this block from the migration
 * before committing.
 */
export const deviceCode = pgTable(
  "deviceCode",
  {
    id: text("id").primaryKey(),
    deviceCode: text("device_code").notNull().unique(),
    userCode: text("user_code").notNull().unique(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    clientId: text("client_id"),
    scope: text("scope"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    lastPolledAt: timestamp("last_polled_at"),
    pollingInterval: bigint("polling_interval", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("deviceCode_userId_idx").on(table.userId),
    index("deviceCode_expiresAt_idx").on(table.expiresAt),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  deviceCodes: many(deviceCode),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const deviceCodeRelations = relations(deviceCode, ({ one }) => ({
  user: one(user, {
    fields: [deviceCode.userId],
    references: [user.id],
  }),
}))
