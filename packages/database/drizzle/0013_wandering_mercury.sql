CREATE TYPE "public"."block_owner_type" AS ENUM('organization', 'platform');--> statement-breakpoint
DROP INDEX "block_publications_one_current_slug_uidx";--> statement-breakpoint
-- Official platform blocks have no organization owner, so these fields must be nullable.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "block_publications" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
-- Official platform blocks have no organization slug.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "block_publications" ALTER COLUMN "organization_slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "block_publications" ADD COLUMN "owner_type" "block_owner_type" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "block_publications_platform_current_slug_uidx" ON "block_publications" USING btree ("slug") WHERE "block_publications"."publication_state" = 'current' AND "block_publications"."owner_type" = 'platform';--> statement-breakpoint
CREATE UNIQUE INDEX "block_publications_one_current_slug_uidx" ON "block_publications" USING btree ("organization_slug","slug") WHERE "block_publications"."publication_state" = 'current' AND "block_publications"."owner_type" = 'organization';--> statement-breakpoint
ALTER TABLE "block_publications" ADD CONSTRAINT "block_publications_owner_check" CHECK (("block_publications"."owner_type" = 'organization' AND "block_publications"."organization_id" IS NOT NULL AND "block_publications"."organization_slug" IS NOT NULL) OR ("block_publications"."owner_type" = 'platform' AND "block_publications"."organization_id" IS NULL AND "block_publications"."organization_slug" IS NULL));
