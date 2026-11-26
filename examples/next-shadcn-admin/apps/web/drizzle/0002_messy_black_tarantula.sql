DROP INDEX "posts_created_at_idx";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "excerpt" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "publishedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "updatedAt" timestamp with time zone;--> statement-breakpoint
UPDATE "posts" SET "slug" = 'legacy-' || "id"::text, "content" = '', "updatedAt" = "createdAt" WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "posts_status_published_at_idx" ON "posts" USING btree ("status","publishedAt");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_slug_unique" UNIQUE("slug");
