-- Add the `issuer` column to `account` required by better-auth 1.7's
-- OAuth provider scoping. Backfill to "better-auth" so the
-- unique index can be added without conflicting with existing
-- account rows that have NULL issuer.
ALTER TABLE "account" ADD COLUMN "issuer" text;
UPDATE "account" SET "issuer" = 'better-auth' WHERE "issuer" IS NULL;
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

-- Composite unique index that the new schema expects.
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer", "account_id");

-- The `account.password` column added by better-auth 1.7 for
-- credential authentication storage. Nullable — populated only
-- for users who authenticate with email/password.
ALTER TABLE "account" ADD COLUMN "password" text;
