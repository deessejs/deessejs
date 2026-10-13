-- Admin plugin columns (RFC: "DeesseJS Administration Routes — V1")
--
-- Adds the columns the Better Auth `admin` plugin writes to the
-- `user` and `session` tables. V1 only reads `user.role` to gate the
-- `/admin/*` route area in `apps/app`; the other columns are present
-- so the schema matches the plugin's full data model and any future
-- admin screen (list, ban, impersonate) can be wired without another
-- migration.
--
-- All `ADD COLUMN` statements use `IF NOT EXISTS` so the migration
-- is idempotent: re-running it against an environment where the
-- columns already exist (e.g. a partial roll-out, a re-apply after
-- a `drizzle-kit migrate` that recorded the row but the columns
-- were added out-of-band) is a no-op rather than an error. The
-- backfill at the end uses `WHERE "role" IS NULL` so it never
-- overwrites an existing `'admin'` promotion.
--
-- Hand-written because `drizzle-kit generate` cannot run
-- interactively in non-TTY shells, and the matching `auth` CLI
-- regenerations (1.4.22, 1.6.23) silently rename the `deviceCode`
-- table and drop its constraints — see the long-form comment at
-- the top of `packages/database/src/schema/auth.ts`. The shape
-- here is the literal translation of the admin plugin's schema
-- fields (from `better-auth/src/plugins/admin/schema.ts`) to SQL.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonated_by" text;--> statement-breakpoint
-- Backfill: assign the default role to any pre-existing account
-- that does not already have one. The `IS NULL` guard means a
-- subsequent re-apply of this migration (or a manual `'admin'`
-- promotion) is preserved.
UPDATE "user" SET "role" = 'user' WHERE "role" IS NULL;
