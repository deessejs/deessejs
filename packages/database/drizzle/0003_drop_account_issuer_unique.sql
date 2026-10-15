-- Compatibility repair: drop the Better Auth 1.7.x issuer unique
-- index and the `issuer` NOT NULL constraint on `public.account`.
--
-- Context: the production database contains a fourth migration
-- (recorded in `drizzle.__drizzle_migrations` with a `when` greater
-- than the largest in-repo migration, 1789996800000 of `0002`) that
-- added `public.account.issuer text NOT NULL` and a unique index
-- `account_issuer_accountId_uidx` on `(issuer, account_id)`. The
-- repository's account schema does NOT declare `issuer` — the only
-- code in this repository that touches the column is the Better
-- Auth v1.6.23 signup path, which inserts into `account` without
-- `issuer`. PostgreSQL therefore rejected every signup with
-- `23502 not_null_violation` on `account.issuer`.
--
-- Better Auth 1.7.0–1.7.2 introduced this column and index; 1.7.3
-- (the version pinned in `pnpm-lock.yaml` for `better-auth`) does
-- not write `issuer` on signup and does not require it. 1.6.23 is
-- pinned directly — it is not a transitive of 1.7.3. The
-- production schema is therefore strictly stricter than the
-- application needs.
--
-- This migration is safe to run against:
--   (a) a database with the drift (production): drops the index
--       and relaxes the NOT NULL on `issuer` — the actual repair.
--   (b) a fresh database (0000..0002 only): both statements are
--       a no-op because neither the index nor the column exist.
--       The `DROP INDEX IF EXISTS` is unconditional. The
--       `ALTER COLUMN … DROP NOT NULL` is gated by an
--       `information_schema` lookup so it does not error on a
--       fresh install.
--
-- We do NOT drop the `issuer` column itself. The values may be
-- useful for diagnostic purposes, and dropping a column is a
-- strictly larger change than required to unblock signup.
--
-- The migration sorts after every migration recorded in
-- production: `when = 1793000000000` (greater than the maximum
-- applied in-repo `when` of 1789996800000).
--> statement-breakpoint
DROP INDEX IF EXISTS "account_issuer_accountId_uidx";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'account'
      AND column_name = 'issuer'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "public"."account" ALTER COLUMN "issuer" DROP NOT NULL;
  END IF;
END
$$;