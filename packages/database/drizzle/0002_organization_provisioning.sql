CREATE TABLE "organization_provisioning" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_provisioning" ADD CONSTRAINT "organization_provisioning_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_provisioning_in_flight_user_uidx" ON "organization_provisioning" USING btree ("user_id") WHERE "organization_provisioning"."status" IN ('pending', 'superseded');--> statement-breakpoint
CREATE INDEX "organization_provisioning_user_idx" ON "organization_provisioning" USING btree ("user_id");