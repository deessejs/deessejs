CREATE TABLE "vercel_oauth_state" (
	"state_hash" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vercel_organization_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"configuration_id" text NOT NULL,
	"team_id" text,
	"account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"linked_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vercel_project_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"vercel_project_id" text NOT NULL,
	"vercel_project_name" text NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vercel_oauth_state" ADD CONSTRAINT "vercel_oauth_state_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_oauth_state" ADD CONSTRAINT "vercel_oauth_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_organization_connection" ADD CONSTRAINT "vercel_organization_connection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_organization_connection" ADD CONSTRAINT "vercel_organization_connection_linked_by_user_id_user_id_fk" FOREIGN KEY ("linked_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_project_mapping" ADD CONSTRAINT "vercel_project_mapping_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_project_mapping" ADD CONSTRAINT "vercel_project_mapping_project_id_github_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."github_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vercel_project_mapping" ADD CONSTRAINT "vercel_project_mapping_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vercel_oauth_state_expires_idx" ON "vercel_oauth_state" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_connection_organization_uidx" ON "vercel_organization_connection" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_connection_configuration_uidx" ON "vercel_organization_connection" USING btree ("configuration_id");--> statement-breakpoint
CREATE INDEX "vercel_connection_linked_by_user_idx" ON "vercel_organization_connection" USING btree ("linked_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_project_mapping_project_uidx" ON "vercel_project_mapping" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_project_mapping_org_vercel_project_uidx" ON "vercel_project_mapping" USING btree ("organization_id","vercel_project_id");--> statement-breakpoint
CREATE INDEX "vercel_project_mapping_organization_idx" ON "vercel_project_mapping" USING btree ("organization_id");