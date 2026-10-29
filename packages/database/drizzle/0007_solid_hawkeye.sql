CREATE TYPE "public"."github_project_check_status" AS ENUM('valid', 'needs_revalidation', 'configuration_invalid', 'access_unavailable', 'check_failed');--> statement-breakpoint
CREATE TABLE "github_project" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"repository_id" text NOT NULL,
	"repository_full_name" text NOT NULL,
	"repository_url" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"default_branch" text NOT NULL,
	"configuration_path" text DEFAULT 'deesse.json' NOT NULL,
	"imported_by_user_id" text,
	"imported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_project_check" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"status" "github_project_check_status" NOT NULL,
	"commit_sha" text,
	"format_version" integer,
	"path_count" integer,
	"alias_count" integer,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_project" ADD CONSTRAINT "github_project_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_project" ADD CONSTRAINT "github_project_imported_by_user_id_user_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_project_check" ADD CONSTRAINT "github_project_check_project_id_github_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."github_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_project_org_repository_config_uidx" ON "github_project" USING btree ("organization_id","repository_id","configuration_path");--> statement-breakpoint
CREATE INDEX "github_project_organization_idx" ON "github_project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "github_project_check_project_checked_idx" ON "github_project_check" USING btree ("project_id","checked_at");