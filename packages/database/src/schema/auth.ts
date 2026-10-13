import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/unused-import
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
// Auth schema. Runtime source of truth for the tables the Better
// Auth server reads and writes. Stay in lock-step with the
// migration history under ./drizzle/:
//
//   - 0000_boring_steel_serpent.sql (account, session, user, verification)
//   - 0001_magenta_firebrand.sql  (deviceCode + 0000 indexes/FKs)
//   - 0002_rename_device_code.sql (deviceCode -> device_code; metadata-only)
//
// The TypeScript export keeps its PascalCase name (deviceCode) but
// the SQL identifier is device_code. The export name is the stable
// API surface; the SQL identifier is what the database sees and
// what drizzle-kit diffs. The application-specific additions
// (named unique constraints, named FK with cascade delete, status
// default of 'pending', bigint polling_interval with mode: "number",
// created_at and updated_at columns) are reconciled by
// packages/auth/scripts/generate-schema.mjs after each
// auth:generate run. Re-run pnpm --filter @workspace/auth
// auth:generate after a Better Auth upgrade to confirm the
// committed file still matches the generator output.
//
// The admin plugin (admin() in packages/auth/src/auth.ts) adds the
// four columns on user and the impersonated_by column on session
// in a later migration.


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
});

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
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

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
);

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
);

export const deviceCode = pgTable(
  "device_code",
  {
    id: text("id").primaryKey(),
    deviceCode: text("device_code").notNull(),
    userCode: text("user_code").notNull(),
    userId: text("user_id"),
    expiresAt: timestamp("expires_at").notNull(),
    status: text("status").notNull().default("pending"),
    lastPolledAt: timestamp("last_polled_at"),
    pollingInterval: bigint("polling_interval", { mode: "number" }),
    clientId: text("client_id"),
    scope: text("scope"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("deviceCode_device_code_unique").on(table.deviceCode),
    unique("deviceCode_user_code_unique").on(table.userCode),
    foreignKey({
      name: "deviceCode_user_id_user_id_fk",
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
    index("deviceCode_userId_idx").on(table.userId),
    index("deviceCode_expiresAt_idx").on(table.expiresAt),
  ],
);


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
