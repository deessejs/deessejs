CREATE TYPE "public"."template_owner_type" AS ENUM('platform', 'organization');--> statement-breakpoint
-- Replaced by platform-global and organization-scoped unique indexes below.
-- squawk-ignore ban-drop-constraint
ALTER TABLE "templates" DROP CONSTRAINT "templates_slug_unique";--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "owner_type" "template_owner_type" DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "templates_platform_slug_uidx" ON "templates" USING btree ("slug") WHERE "templates"."owner_type" = 'platform';--> statement-breakpoint
CREATE UNIQUE INDEX "templates_organization_slug_uidx" ON "templates" USING btree ("organization_id","slug") WHERE "templates"."owner_type" = 'organization';--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_owner_scope_consistent" CHECK (("templates"."owner_type" = 'platform' AND "templates"."organization_id" IS NULL) OR ("templates"."owner_type" = 'organization' AND "templates"."organization_id" IS NOT NULL));
