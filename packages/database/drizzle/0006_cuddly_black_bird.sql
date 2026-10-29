CREATE TYPE "public"."template_publication_state" AS ENUM('unpublished', 'current', 'superseded', 'removed');--> statement-breakpoint
CREATE TYPE "public"."template_submission_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "template_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"organization_slug" text NOT NULL,
	"organization_name" text NOT NULL,
	"submitted_by" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_status" "template_submission_status" DEFAULT 'pending' NOT NULL,
	"publication_state" "template_publication_state" DEFAULT 'unpublished' NOT NULL,
	"source_commit" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"category" text NOT NULL,
	"labels" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"image_name" text,
	"license" text NOT NULL,
	"repository_name" text NOT NULL,
	"canonical_url" text NOT NULL,
	"repository_description" text,
	"readme" text,
	"stars" integer,
	"repository_updated_at" timestamp with time zone,
	"distribution_rights_confirmed" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_reason" text,
	"removed_by" text,
	"removed_at" timestamp with time zone,
	"removal_reason" text,
	CONSTRAINT "template_publications_source_commit_sha_check" CHECK ("template_publications"."source_commit" ~ '^[0-9a-f]{40}$'),
	CONSTRAINT "template_publications_distribution_rights_confirmed_check" CHECK ("template_publications"."distribution_rights_confirmed" = true),
	CONSTRAINT "template_publications_stars_nonnegative" CHECK ("template_publications"."stars" IS NULL OR "template_publications"."stars" >= 0),
	CONSTRAINT "template_publications_license_nonempty" CHECK (length(btrim("template_publications"."license")) > 0)
);
--> statement-breakpoint
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_removed_by_user_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_publications_template_submitted_idx" ON "template_publications" USING btree ("template_id","submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "template_publications_pending_submitted_idx" ON "template_publications" USING btree ("submitted_at") WHERE "template_publications"."review_status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "template_publications_one_pending_per_template_uidx" ON "template_publications" USING btree ("template_id") WHERE "template_publications"."review_status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "template_publications_one_current_per_template_uidx" ON "template_publications" USING btree ("template_id") WHERE "template_publications"."publication_state" = 'current';--> statement-breakpoint
CREATE UNIQUE INDEX "template_publications_current_address_uidx" ON "template_publications" USING btree ("organization_slug","slug") WHERE "template_publications"."publication_state" = 'current';