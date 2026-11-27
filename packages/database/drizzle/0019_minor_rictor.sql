CREATE TYPE "public"."template_source_type" AS ENUM('github', 'managed');--> statement-breakpoint
-- Managed sources have no repository owner. The source identity check below requires an owner for GitHub sources.
-- squawk-ignore ban-drop-constraint
ALTER TABLE "templates" DROP CONSTRAINT "templates_owner_nonempty";--> statement-breakpoint
-- Managed sources have no repository name. The source identity check below requires a repository for GitHub sources.
-- squawk-ignore ban-drop-constraint
ALTER TABLE "templates" DROP CONSTRAINT "templates_repo_nonempty";--> statement-breakpoint
-- Managed sources have no GitHub identity. The source identity check below retains both fields for GitHub sources.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "templates" ALTER COLUMN "owner" DROP NOT NULL;--> statement-breakpoint
-- Managed sources have no GitHub identity. The source identity check below retains both fields for GitHub sources.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "templates" ALTER COLUMN "repo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "source_type" "template_source_type" DEFAULT 'github' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_source_identity_check" CHECK (("templates"."source_type" = 'github' AND "templates"."owner" IS NOT NULL AND length(btrim("templates"."owner")) > 0 AND "templates"."repo" IS NOT NULL AND length(btrim("templates"."repo")) > 0) OR ("templates"."source_type" = 'managed' AND "templates"."owner" IS NULL AND "templates"."repo" IS NULL));
