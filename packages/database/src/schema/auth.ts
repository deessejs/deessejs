// Auth schema. Runtime source of truth for the tables the Better
// Auth server reads and writes. Columns and constraints here MUST
// stay in lock-step with the Drizzle migration history under
// `./drizzle/`.
//
// `auth:generate` (the Better Auth CLI in `packages/auth/package.json`)
// writes the regenerated Drizzle schema to
// `src/schema/.auth-gen-probe.ts` — a scratch file, gitignored by
// `packages/database/.gitignore` so it never lands in a commit. The
// canonical file (this one) is the merged form: the CLI's output
// patched with the customisations the runtime needs. To regenerate:
//
//   1. Build the auth dependency chain: `@workspace/env`, `@workspace/email`,
//      `@workspace/database`. `auth:generate` loads `auth.ts` via jiti and
//      resolves `@workspace/*` symlinks; the build emits `dist/*.js` that
//      the symlinks expose.
//   2. Run the script:
//        pnpm --filter @workspace/auth auth:generate
//      Writes the CLI's output to `packages/database/src/schema/.auth-gen-probe.ts`.
//   3. Diff the probe against the canonical schema with an explicit
//      two-file diff (a regular `git diff` is wrong here — the
//      probe is gitignored and untracked, so `git diff` would
//      compare it to nothing):
//        git diff --no-index \
//          packages/database/src/schema/auth.ts \
//          packages/database/src/schema/.auth-gen-probe.ts
//   4. Integrate the probe's plugin output (organization, member,
//      invitation, activeOrganizationId) into the canonical schema,
//      applying the runtime-required customisations listed below.
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
//   b. **Foreign key on `deviceCode.userId`.** The CLI emits
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
//   - `pollingInterval: integer("polling_interval")` (the CLI emits
//     `integer`; the 1.7.7 runtime accepts `integer` — the 0001
//     migration was `bigint` and we keep `integer` going forward).
//   - `createdAt: timestamp("created_at").defaultNow().notNull()` and
//     `updatedAt: timestamp("updated_at").defaultNow().$onUpdate(…).notNull()`
//     (audit columns, consistent with the rest of the project's
//     tables).
//
// The admin plugin owns the four columns on `user` (`role`,
// `banned`, `banReason`, `banExpires`) and the `impersonated_by`
// column on `session`. They are nullable; `banned` defaults to
// `false`; `role` is backfilled to `'user'` in the `0002`
// migration. Do not add the plugin twice (e.g. as
// `additionalFields`) — the plugin already declares them in its
// server-side schema and a duplicate declaration breaks the
// inferred User type.
//
// The organization plugin (Better Auth) owns the `organization`,
// `member`, and `invitation` tables, the `active_organization_id`
// column on `session`, and the `bootstrap_operation_id` server-
// owned additional field on `organization`. The plugin's
// `additionalFields` declaration in `packages/auth/src/auth.ts`
// is `input: false, returned: false`; the column here is plain
// `text` (nullable) because the plugin's server-side schema
// marks the field nullable. The composite `(organization_id,
// user_id)` unique index on `member` is emitted by the CLI's
// regeneration; preserve its name (`member_organization_id_user_id_uq`)
// when re-applying the regeneration patch.

import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
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
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
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

/**
 * Device authorization. The CLI's regeneration does not emit this
 * block in canonical form; restore it from the comment above
 * (customisation a–d) before committing. The table name, the FK on
 * `userId`, the relations, the two lookup indexes, and the audit
 * columns are the runtime-required shape and must stay in
 * lock-step with the `0001_magenta_firebrand.sql` migration.
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
);

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
  bootstrapOperationId: text("bootstrap_operation_id").unique(),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  deviceCodes: many(deviceCode),
  members: many(member),
  invitations: many(invitation),
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

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// `deviceCodeRelations` is not emitted by the Better Auth CLI's
// regeneration; the runtime requires it because `advanced.database.joins`
// is enabled in `packages/auth/src/auth.ts` and the admin device-flow
// endpoints resolve through it. Restore the export whenever
// re-applying the regeneration patch.
export const deviceCodeRelations = relations(deviceCode, ({ one }) => ({
  user: one(user, {
    fields: [deviceCode.userId],
    references: [user.id],
  }),
}));
