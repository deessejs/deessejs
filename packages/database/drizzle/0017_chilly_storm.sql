CREATE TABLE "organization_pro_seat" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_pro_seat" ADD CONSTRAINT "organization_pro_seat_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pro_seat" ADD CONSTRAINT "organization_pro_seat_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_pro_seat_member_uidx" ON "organization_pro_seat" USING btree ("organization_id","member_id");--> statement-breakpoint
CREATE INDEX "organization_pro_seat_member_idx" ON "organization_pro_seat" USING btree ("member_id");