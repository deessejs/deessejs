CREATE TYPE "public"."managed_release_kind" AS ENUM('template', 'block');--> statement-breakpoint
CREATE TYPE "public"."managed_release_owner_type" AS ENUM('platform', 'organization');--> statement-breakpoint
CREATE TYPE "public"."managed_release_status" AS ENUM('ready', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."managed_release_upload_state" AS ENUM('pending', 'sealing', 'failed', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "managed_release_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"kind" "managed_release_kind" NOT NULL,
	"owner_type" "managed_release_owner_type" NOT NULL,
	"organization_id" text,
	"template_id" uuid,
	"block_publication_id" uuid,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"digest" text NOT NULL,
	"descriptor_digest" text NOT NULL,
	"archive_size" integer NOT NULL,
	"staged_key" text NOT NULL,
	"state" "managed_release_upload_state" DEFAULT 'pending' NOT NULL,
	"fence" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "managed_release_uploads_staged_key_unique" UNIQUE("staged_key"),
	CONSTRAINT "managed_release_uploads_owner_scope_check" CHECK (("managed_release_uploads"."owner_type" = 'platform' AND "managed_release_uploads"."organization_id" IS NULL) OR ("managed_release_uploads"."owner_type" = 'organization' AND "managed_release_uploads"."organization_id" IS NOT NULL)),
	CONSTRAINT "managed_release_uploads_target_check" CHECK (("managed_release_uploads"."kind" = 'template' AND "managed_release_uploads"."template_id" IS NOT NULL AND "managed_release_uploads"."block_publication_id" IS NULL) OR ("managed_release_uploads"."kind" = 'block' AND "managed_release_uploads"."block_publication_id" IS NOT NULL AND "managed_release_uploads"."template_id" IS NULL)),
	CONSTRAINT "managed_release_uploads_digest_check" CHECK ("managed_release_uploads"."digest" ~ '^[a-f0-9]{64}$' AND "managed_release_uploads"."descriptor_digest" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "managed_release_uploads_archive_size_check" CHECK ("managed_release_uploads"."archive_size" > 0 AND "managed_release_uploads"."archive_size" <= 104857600)
);
--> statement-breakpoint
CREATE TABLE "managed_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "managed_release_kind" NOT NULL,
	"owner_type" "managed_release_owner_type" NOT NULL,
	"organization_id" text,
	"template_id" uuid,
	"block_publication_id" uuid,
	"slug" text NOT NULL,
	"version" text NOT NULL,
	"archive_key" text NOT NULL,
	"digest" text NOT NULL,
	"descriptor_digest" text NOT NULL,
	"preview_key" text,
	"archive_size" integer NOT NULL,
	"published_by" text NOT NULL,
	"status" "managed_release_status" DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "managed_releases_archive_key_unique" UNIQUE("archive_key"),
	CONSTRAINT "managed_releases_owner_scope_check" CHECK (("managed_releases"."owner_type" = 'platform' AND "managed_releases"."organization_id" IS NULL) OR ("managed_releases"."owner_type" = 'organization' AND "managed_releases"."organization_id" IS NOT NULL)),
	CONSTRAINT "managed_releases_target_check" CHECK (("managed_releases"."kind" = 'template' AND "managed_releases"."template_id" IS NOT NULL AND "managed_releases"."block_publication_id" IS NULL) OR ("managed_releases"."kind" = 'block' AND "managed_releases"."block_publication_id" IS NOT NULL AND "managed_releases"."template_id" IS NULL)),
	CONSTRAINT "managed_releases_version_check" CHECK ("managed_releases"."version" ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'),
	CONSTRAINT "managed_releases_digest_check" CHECK ("managed_releases"."digest" ~ '^[a-f0-9]{64}$' AND "managed_releases"."descriptor_digest" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "managed_releases_archive_size_check" CHECK ("managed_releases"."archive_size" > 0 AND "managed_releases"."archive_size" <= 104857600),
	CONSTRAINT "managed_releases_withdrawal_check" CHECK (("managed_releases"."status" = 'ready' AND "managed_releases"."withdrawn_at" IS NULL) OR ("managed_releases"."status" = 'withdrawn' AND "managed_releases"."withdrawn_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "managed_release_uploads" ADD CONSTRAINT "managed_release_uploads_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_release_uploads" ADD CONSTRAINT "managed_release_uploads_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_release_uploads" ADD CONSTRAINT "managed_release_uploads_block_pub_fk" FOREIGN KEY ("block_publication_id") REFERENCES "public"."block_publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_release_uploads" ADD CONSTRAINT "managed_release_uploads_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_releases" ADD CONSTRAINT "managed_releases_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_releases" ADD CONSTRAINT "managed_releases_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_releases" ADD CONSTRAINT "managed_releases_block_publication_id_block_publications_id_fk" FOREIGN KEY ("block_publication_id") REFERENCES "public"."block_publications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_releases" ADD CONSTRAINT "managed_releases_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "managed_release_uploads_idempotency_uidx" ON "managed_release_uploads" USING btree ("created_by","idempotency_key");--> statement-breakpoint
CREATE INDEX "managed_release_uploads_expiry_idx" ON "managed_release_uploads" USING btree ("state","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "managed_releases_template_version_uidx" ON "managed_releases" USING btree ("template_id","version") WHERE "managed_releases"."kind" = 'template';--> statement-breakpoint
CREATE UNIQUE INDEX "managed_releases_block_version_uidx" ON "managed_releases" USING btree ("block_publication_id","version") WHERE "managed_releases"."kind" = 'block';--> statement-breakpoint
CREATE INDEX "managed_releases_latest_idx" ON "managed_releases" USING btree ("kind","slug","created_at");
