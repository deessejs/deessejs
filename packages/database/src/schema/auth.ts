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
// `auth:generate` (the Better Auth CLI in `packages/auth/package.json`)
// writes the regenerated Drizzle schema to
// `src/schema/.auth-gen-probe.ts` — a scratch file, gitignored by
// `packages/database/.gitignore` so it never lands in a commit. The
// canonical file (this one) is the merged form: the CLI's output
// patched with the customisations the runtime needs. To regenerate:
//
//   1. `./packages/auth/node_modules/.bin/auth generate --output
//       packages/database/src/schema/.auth-gen-probe.ts -y`.
//   2. `git diff packages/database/src/schema/.auth-gen-probe.ts` and
//      read the diff in full.
//   3. Apply the *runtime-required* patches below, then copy the
//      patched result over this file.
//
// The customisations the runtime requires (re-apply on every
// regeneration; the CLI does not emit them):
//
//   a. **Table name `deviceCode` (PascalCase), not `device_code`.**
//      Migration `0001` created `public."deviceCode"`. Switching to
//      snake_case would break the device flow on every existing
//      deployment. The CLI emits `device_code` because the Better
//      Auth plugin's internal Zod schema does not declare a table
//      name; Drizzle's `pgTable("device_code", …)` uses the literal
//      argument as the table name. Rename to `"deviceCode"` to keep
//      the migration history in lock-step with the schema.
//
//   b. **Foreign key on `userId`.** The CLI emits
//      `userId: text("user_id")` with no `.references(…)` — the
//      plugin's Zod schema marks `userId` as `ZodOptional`, so the
//      CLI does not infer an FK. The runtime contract requires the
//      FK (deletes on `user` must cascade to device codes) — see
//      `0001_magenta_firebrand.sql`. Add
//      `userId: text("user_id").references(() => user.id, { onDelete: "cascade" })`.
//
//   c. **`deviceCodeRelations` export.** The CLI does not emit
//      relations. We have `advanced.database.joins: true` enabled in
//      `packages/auth/src/auth.ts`; the join plumbing requires
//      `deviceCodeRelations` (and the matching
//      `userRelations.deviceCodes` back-reference) so the Better
//      Auth admin device queries resolve. Re-add both at the bottom
//      of the file.
//
//   d. **Lookup indexes `deviceCode_userId_idx` and
//      `deviceCode_expiresAt_idx`.** The CLI does not emit them. They
//      back the device-flow admin endpoints and the pending-code
//      expiry sweep, respectively. Re-add
//      `index("deviceCode_userId_idx").on(table.userId)` and
//      `index("deviceCode_expiresAt_idx").on(table.expiresAt)` in
//      the table callback.
//
// Customisations we keep that the runtime does not strictly require
// (re-apply if you regenerate, but they are not load-bearing — see
// `0001_magenta_firebrand.sql` for the historical reasons):
//
//   - `status: text("status").default("pending").notNull()` (the
//     `'pending'` default; the runtime works with `notNull` alone).
//   - `pollingInterval: bigint("polling_interval", { mode: "number" })`
//     (the CLI emits `integer`; the 1.7.7 runtime accepts either —
//     the upgrade guide says polling interval is bounded — but we
//     keep `bigint` for forward-compat with longer intervals).
//   - `createdAt: timestamp("created_at").defaultNow().notNull()` and
//     `updatedAt: timestamp("updated_at").defaultNow().$onUpdate(…).notNull()`
//     (audit columns, consistent with the rest of the project's
//     tables).
//   - Inline `.unique()` on `device_code` / `user_code` columns
//     instead of `uniqueIndex(…)` in the table callback (the CLI
//     emits the latter; the constraint shape is identical, only
//     the index name changes).
//
// The admin plugin owns the four columns on `user` (`role`,
// `banned`, `banReason`, `banExpires`) and the `impersonated_by`
// column on `session`. They are nullable; `banned` defaults to
// `false`; `role` is backfilled to `'user'` in the `0002`
// migration. Do not add the plugin twice (e.g. as
// `additionalFields`) — the plugin already declares them in its
// server-side schema and a duplicate declaration breaks the
// inferred User type.

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
 * The block below preserves the table name (`"deviceCode"`), the
 * `user_id` foreign key, the `created_at` / `updated_at` columns,
 * the `status` default of `'pending'`, the `bigint` type of
 * `polling_interval`, and the `deviceCode_userId_idx` /
 * `deviceCode_expiresAt_idx` indexes that the `auth` CLI's
 * regeneration does not emit (see the long-form comment at the top
 * of this file). On regeneration, restore this block from the
 * canonical before committing.
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
