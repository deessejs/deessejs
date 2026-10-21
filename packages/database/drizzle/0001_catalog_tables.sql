CREATE TYPE "public"."template_access" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TABLE "template_repository_snapshots" (
	"template_id" uuid PRIMARY KEY NOT NULL,
	"repository_name" text NOT NULL,
	"repository_description" text,
	"canonical_url" text NOT NULL,
	"license" text,
	"topics" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"readme" text,
	"repository_updated_at" timestamp with time zone,
	"stars" integer,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_repository_snapshots_stars_nonnegative" CHECK ("template_repository_snapshots"."stars" >= 0),
	CONSTRAINT "template_repository_snapshots_repository_name_nonempty" CHECK (length(btrim("template_repository_snapshots"."repository_name")) > 0),
	CONSTRAINT "template_repository_snapshots_canonical_url_nonempty" CHECK (length(btrim("template_repository_snapshots"."canonical_url")) > 0)
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description_override" text,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"category" text NOT NULL,
	"labels" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"license_fallback" text,
	"access" "template_access" DEFAULT 'free' NOT NULL,
	"image_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug"),
	CONSTRAINT "templates_slug_nonempty" CHECK (length(btrim("templates"."slug")) > 0),
	CONSTRAINT "templates_name_nonempty" CHECK (length(btrim("templates"."name")) > 0),
	CONSTRAINT "templates_owner_nonempty" CHECK (length(btrim("templates"."owner")) > 0),
	CONSTRAINT "templates_repo_nonempty" CHECK (length(btrim("templates"."repo")) > 0),
	CONSTRAINT "templates_category_nonempty" CHECK (length(btrim("templates"."category")) > 0)
);
--> statement-breakpoint
ALTER TABLE "template_repository_snapshots" ADD CONSTRAINT "template_repository_snapshots_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "templates_sortOrder_slug_idx" ON "templates" USING btree ("sort_order","slug");