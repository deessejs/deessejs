CREATE TYPE "public"."block_publication_state" AS ENUM('private', 'current', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."block_review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "block_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"organization_slug" text NOT NULL,
	"submitted_by" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"repository_url" text NOT NULL,
	"subdirectory" text DEFAULT '' NOT NULL,
	"source_commit" text NOT NULL,
	"descriptor" text NOT NULL,
	"review_status" "block_review_status" DEFAULT 'pending' NOT NULL,
	"publication_state" "block_publication_state" DEFAULT 'private' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_reason" text,
	CONSTRAINT "block_publications_commit_sha_check" CHECK ("block_publications"."source_commit" ~ '^[0-9a-f]{40}$')
);
--> statement-breakpoint
ALTER TABLE "block_publications" ADD CONSTRAINT "block_publications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_publications" ADD CONSTRAINT "block_publications_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_publications" ADD CONSTRAINT "block_publications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_publications_org_slug_submitted_idx" ON "block_publications" USING btree ("organization_id","slug","submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "block_publications_one_pending_slug_uidx" ON "block_publications" USING btree ("organization_id","slug") WHERE "block_publications"."review_status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "block_publications_one_current_slug_uidx" ON "block_publications" USING btree ("organization_slug","slug") WHERE "block_publications"."publication_state" = 'current';