DROP TABLE IF EXISTS "posts";
CREATE TABLE "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "status" text NOT NULL,
  "publishedAt" timestamp with time zone,
  "publishedOn" date,
  "details" jsonb,
  "views" integer DEFAULT 0 NOT NULL,
  "live" boolean DEFAULT false NOT NULL,
  CONSTRAINT "posts_title_unique" UNIQUE("title")
);
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");
