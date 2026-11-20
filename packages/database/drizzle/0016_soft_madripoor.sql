CREATE TYPE "public"."block_access" AS ENUM('free', 'paid');--> statement-breakpoint
ALTER TABLE "block_publications" ADD COLUMN "access" "block_access" DEFAULT 'free' NOT NULL;