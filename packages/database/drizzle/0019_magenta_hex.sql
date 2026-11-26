CREATE TYPE "public"."template_source_type" AS ENUM('github', 'managed');--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_owner_nonempty";--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_repo_nonempty";--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "owner" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "repo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "source_type" "template_source_type" DEFAULT 'github' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_source_identity_check" CHECK (("templates"."source_type" = 'github' AND length(btrim("templates"."owner")) > 0 AND "templates"."repo" IS NOT NULL AND length(btrim("templates"."repo")) > 0) OR ("templates"."source_type" = 'managed' AND "templates"."owner" IS NULL AND "templates"."repo" IS NULL));